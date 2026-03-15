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

  // Función para refrescar los datos del usuario
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del usuario';
      setError(errorMessage);
      setUser(null);
      
      // No redirigir aquí - dejar que el layout maneje la redirección
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para limpiar los datos del usuario (logout)
  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  // Cargar datos del usuario al montar el provider (solo si no hay usuario en caché)
  useEffect(() => {
    let mounted = true;
    
    // Solo cargar si ya no tenemos un usuario en caché
    if (!user) {
      refreshUser();
    }

    return () => {
      mounted = false;
    };
  }, []); // Solo al montar - sin dependencias para evitar llamadas múltiples

  // Escuchar evento de sesión expirada
  useEffect(() => {
    const handleSessionExpired = () => {
      clearUser();
    };

    window.addEventListener('session:expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session:expired', handleSessionExpired);
    };
  }, [clearUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isProducer: user?.role === 'PRODUCER',
    refreshUser,
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
