/**
 * useInactivityTimeout
 *
 * Ejecuta `onTimeout` tras INACTIVITY_TIMEOUT_MS sin ninguna interacción
 * del usuario (ratón, teclado, toque, scroll).
 *
 * POLÍTICA DE SEGURIDAD: aplicación de administración con datos sensibles.
 * El tiempo de inactividad por defecto es 15 minutos — ajustar en la
 * constante INACTIVITY_TIMEOUT_MS si la política de seguridad lo requiere.
 *
 * @example
 * useInactivityTimeout(() => handleForceLogout('inactivity'));
 */

import { useEffect, useRef, useCallback } from 'react';

/** Tiempo máximo de inactividad antes de cerrar la sesión (15 min) */
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

/** Eventos del DOM que se consideran "actividad del usuario" */
const ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'pointermove',
];

export function useInactivityTimeout(onTimeout: () => void): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref estable para no re-registrar listeners cuando cambia el callback
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Arrancar el temporizador al montar
    resetTimer();

    // Reiniciar con cada interacción (passive:true → no bloquea el scroll)
    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, resetTimer),
      );
    };
  }, [resetTimer]);
}
