/**
 * useLogout
 *
 * Hook centralizado para ejecutar el logout del usuario: llamada a API,
 * limpieza de estado de autenticación y redirect a página de login.
 *
 * Proporciona protección contra doble-clic (reentrancia) vía `isLoggingOut`.
 *
 * @example
 * const { logout, isLoggingOut } = useLogout();
 * <button onClick={logout} disabled={isLoggingOut}>
 *   {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
 * </button>
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

export interface UseLogoutOptions {
  /** Ruta a la que redirigir tras el logout. Por defecto: '/auth/login'. */
  redirectTo?: string;
}

export interface UseLogoutResult {
  /** Ejecuta el logout: API + limpieza de estado + redirect. Idempotente
   *  mientras haya un logout en curso. */
  logout: () => Promise<void>;
  /** true mientras el logout está en curso (API en vuelo o ya se ordenó
   *  el redirect). Útil para deshabilitar el botón / mostrar "Cerrando...". */
  isLoggingOut: boolean;
}

export function useLogout(options?: UseLogoutOptions): UseLogoutResult {
  const router = useRouter();
  const { clearUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    // Guarda de reentrancia: si ya está en curso, no hacer nada
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch {
      // El logout local debe continuar aunque falle la llamada al gateway.
    }

    // Limpiar estado de usuario en AuthContext
    clearUser();

    // Redirigir a la página de login
    router.replace(options?.redirectTo ?? '/auth/login');
  }, [isLoggingOut, clearUser, router, options?.redirectTo]);

  return {
    logout,
    isLoggingOut,
  };
}
