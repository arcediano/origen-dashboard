/**
 * useSessionVisibilityGuard
 *
 * Cierra la sesión cuando el usuario abandona la pestaña durante más de
 * MAX_HIDDEN_MS y luego vuelve. Cubre el caso de "dejar la sesión abierta
 * en otro monitor / dispositivo compartido".
 *
 * POLÍTICA DE SEGURIDAD: 30 minutos con la pestaña oculta → logout al volver.
 * Ajustar MAX_HIDDEN_MS según la política de seguridad.
 *
 * @example
 * useSessionVisibilityGuard(() => handleForceLogout('hidden'));
 */

import { useEffect, useRef } from 'react';

/** Tiempo máximo con la pestaña oculta antes de cerrar la sesión (30 min) */
const MAX_HIDDEN_MS = 30 * 60 * 1000;

export function useSessionVisibilityGuard(onExpired: () => void): void {
  const hiddenSinceRef = useRef<number | null>(null);

  // Ref estable para no re-registrar el listener cuando cambia el callback
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Registrar el momento en que la pestaña se ocultó
        hiddenSinceRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenSinceRef.current !== null) {
          const elapsed = Date.now() - hiddenSinceRef.current;
          hiddenSinceRef.current = null;

          if (elapsed >= MAX_HIDDEN_MS) {
            onExpiredRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
