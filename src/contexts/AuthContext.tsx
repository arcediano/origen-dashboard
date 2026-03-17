/**
 * AuthContext - Contexto de autenticación global
 * 
 * Proporciona acceso a los datos del usuario autenticado y métodos de autenticación
 * Cachea los datos del usuario para evitar múltiples llamadas a la API
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/api/auth';
import { getCurrentUser, logoutUser } from '@/lib/api/auth';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useSessionVisibilityGuard } from '@/hooks/useSessionVisibilityGuard';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isProducer: boolean;
  refreshUser: () => Promise<void>;
  setUserFromLogin: (email: string) => Promise<AuthUser>;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  // BUG FIX: Inicializar isLoading en true para evitar el flash de pantalla en blanco
  // en el primer render antes de que el useEffect valide la sesión.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  // Función para refrescar los datos del usuario
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Verificar si estamos en el cliente (browser)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      setHasTriedLoad(true);
      return;
    }

    try {
      // BUG FIX: Eliminada la comprobación document.cookie.includes('accessToken').
      // Los cookies accessToken son HttpOnly — document.cookie NUNCA los muestra,
      // por lo que la comprobación anterior SIEMPRE fallaba y disparaba session:expired
      // en cada recarga, incluso con sesión válida.
      // Si no hay token, getCurrentUser() lanzará un GatewayError 401 de forma natural.
      const userData = await getCurrentUser();
      setUser(userData);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AuthContext] Usuario cargado:', userData);
      }
    } catch (err) {
      setUser(null);

      const is401 = err instanceof Error &&
        (err.message.includes('401') || err.message.includes('Token'));

      if (is401) {
        // 401 = sin sesión activa — estado esperado en páginas públicas, no es un error.
        // No llamar a setError() para no mostrar mensajes erróneos en /auth/register, /auth/login, etc.
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AuthContext] Sin sesión activa (401) — usuario no autenticado.');
        }
      } else {
        // Error real (red, servidor caído, etc.) — sí merece notificación
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del usuario';
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AuthContext] Error cargando usuario:', errorMessage);
        }
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setHasTriedLoad(true);
    }
  }, []);

  // Función para establecer usuario después de login (con reintentos automáticos)
  const setUserFromLogin = useCallback(async (email: string): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    const maxRetries = 3;
    const baseDelay = 300; // ms

    for (let i = 0; i < maxRetries; i++) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AuthContext] Usuario establecido tras login:', {
            id: userData.id,
            email: userData.email,
            role: userData.role,
          });
        }
        setIsLoading(false);
        setHasTriedLoad(true);
        return userData; // ✅ Devolver el usuario al caller
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[AuthContext] Intento ${i + 1}/${maxRetries} fallido:`, err);
        }

        // Último intento fallido
        if (i === maxRetries - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del usuario';
          setError(errorMessage);
          setUser(null);
          setIsLoading(false);
          setHasTriedLoad(true);
          throw err; // PROPAGAR ERROR al caller
        }

        // Esperar antes del siguiente intento (tiempo incremental)
        await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
      }
    }

    // TypeScript no debería llegar aquí, pero por seguridad
    throw new Error('Error al cargar usuario después de ' + maxRetries + ' intentos');
  }, []);

  // Función para limpiar los datos del usuario (logout local sin llamada al backend)
  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  // ── Logout forzado centralizado ─────────────────────────────────────────────
  // Único punto de salida para todos los escenarios de cierre de sesión:
  // token expirado (401), inactividad y pestaña abandonada.
  //
  // Motivos posibles:
  //   'expired'    → el token caducó (recibimos un 401 del gateway)
  //   'inactivity' → 15 min sin interacción del usuario
  //   'hidden'     → pestaña oculta más de 30 min
  const handleForceLogout = useCallback(async (
    reason: 'expired' | 'inactivity' | 'hidden'
  ) => {
    try {
      // Invalidar el token en el servidor (borra las cookies HttpOnly)
      await logoutUser();
    } catch {
      // Si el gateway falla (token ya expirado), continuamos igualmente
    }

    setUser(null);
    setError(null);

    const messages: Record<typeof reason, string> = {
      expired:    'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
      inactivity: 'Sesión cerrada automáticamente por inactividad (15 min).',
      hidden:     'Sesión cerrada por seguridad tras un periodo de inactividad prolongada.',
    };

    router.replace(
      `/auth/login?reason=${reason}&message=${encodeURIComponent(messages[reason])}`
    );
  }, [router]);

  // ── Cargar usuario al montar (solo una vez) ─────────────────────────────────
  useEffect(() => {
    let mounted = true;

    if (!hasTriedLoad && !user) {
      const load = async () => {
        await refreshUser();
      };
      load();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 401 desde el cliente HTTP → cierre de sesión inmediato ─────────────────
  useEffect(() => {
    const handleSessionExpired = () => {
      // Solo actuar si había sesión activa (evitar logout doble en páginas /auth/*)
      if (user) {
        handleForceLogout('expired');
      }
    };

    window.addEventListener('session:expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session:expired', handleSessionExpired);
    };
  }, [user, handleForceLogout]);

  // ── 15 min sin interacción → cierre de sesión por inactividad ──────────────
  useInactivityTimeout(
    useCallback(() => {
      if (user) handleForceLogout('inactivity');
    }, [user, handleForceLogout])
  );

  // ── Pestaña oculta más de 30 min → cierre al volver ────────────────────────
  useSessionVisibilityGuard(
    useCallback(() => {
      if (user) handleForceLogout('hidden');
    }, [user, handleForceLogout])
  );

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isProducer: user?.role === 'PRODUCER',
    refreshUser,
    setUserFromLogin,
    setUser,
    clearUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personalizado para acceder al contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

/**
 * Hook de conveniencia para verificar si el usuario es productor
 */
export function useIsProducer() {
  const { isProducer, isLoading } = useAuth();
  return { isProducer, isLoading };
}

/**
 * Hook de conveniencia para obtener el usuario actual
 */
export function useCurrentUser() {
  const { user, isLoading, error, refreshUser } = useAuth();
  return { user, isLoading, error, refreshUser };
}
