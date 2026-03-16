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
import { getCurrentUser } from '@/lib/api/auth';

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
  const [isLoading, setIsLoading] = useState(false);
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
      // Verificar si hay cookies antes de hacer la llamada
      if (!document.cookie.includes('accessToken')) {
        throw new Error('Token no proporcionado');
      }

      const userData = await getCurrentUser();
      setUser(userData);
      console.log('[AuthContext] Usuario cargado:', userData);
    } catch (err) {
      let errorMessage = 'Error al cargar datos del usuario';
      
      if (err instanceof Error) {
        errorMessage = err.message.includes('401') || err.message.includes('Token')
          ? 'Sesión no válida o expirada' 
          : err.message;
      }

      console.error('[AuthContext] Error cargando usuario:', errorMessage);
      setError(errorMessage);
      setUser(null);
      
      // Disparar evento global de sesión expirada
      if (errorMessage.includes('Sesión') || errorMessage.includes('Token')) {
        window.dispatchEvent(new CustomEvent('session:expired'));
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
        console.log('[AuthContext] Usuario establecido tras login:', {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          producerCode: userData.producerCode,
          todasLasPropiedades: Object.keys(userData)
        });
        setIsLoading(false);
        setHasTriedLoad(true);
        return userData; // ✅ Devolver el usuario al caller
      } catch (err) {
        console.warn(`[AuthContext] Intento ${i + 1}/${maxRetries} fallido:`, err);

        // Último intento fallido
        if (i === maxRetries - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del usuario';
          console.error('[AuthContext] Error tras login (todos los intentos):', errorMessage);
          setError(errorMessage);
          setUser(null);
          throw err; // PROPAGAR ERROR al caller
        }

        // Esperar antes del siguiente intento (tiempo incremental)
        await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
      }
    }

    // TypeScript no debería llegar aquí, pero por seguridad
    throw new Error('Error al cargar usuario después de ' + maxRetries + ' intentos');
  }, []);

  // Función para limpiar los datos del usuario (logout)
  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  // Cargar datos del usuario al montar del provider (solo una vez)
  useEffect(() => {
    let mounted = true;

    // Solo cargar si no hemos intentado y no tenemos usuario
    if (!hasTriedLoad && !user) {
      refreshUser();
    }

    return () => {
      mounted = false;
    };
  }, [hasTriedLoad, user, refreshUser]);

  // Escuchar evento de sesión expirada
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener('session:expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session:expired', handleSessionExpired);
    };
  }, []);

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
