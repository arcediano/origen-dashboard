import { useEffect, useRef } from 'react';

/**
 * Polling de dos niveles para detectar que Stripe Connect ha terminado de
 * verificar una cuenta.
 *
 * Por qué existe: el SDK embebido de Stripe (`@stripe/connect-js` /
 * `@stripe/react-connect-js`) no expone ningún evento que avise de que la
 * cuenta pasó a operativa. `onExit` se dispara cuando el usuario cierra el
 * formulario, que suele ser ANTES de que Stripe termine de verificar, y
 * `onStepChange` reporta el paso interno del asistente, no el estado de la
 * cuenta. Sin un polling propio, la UI se queda con un estado obsoleto
 * indefinidamente (Bug 1 del requisito
 * `bugs-stripe-embedded-onboarding-payments`).
 *
 * Dos niveles:
 * - **rápido**: el usuario está mirando el formulario embebido ahora mismo,
 *   así que interesa reaccionar en segundos.
 * - **lento**: la cuenta sigue pendiente pero el formulario no está a la
 *   vista; basta con enterarse eventualmente sin castigar al backend.
 *
 * En ambos casos el intervalo crece con backoff hasta un techo: una
 * verificación que no se ha resuelto en el primer minuto rara vez se
 * resuelve en el segundo, y así una pestaña olvidada no consulta
 * indefinidamente al ritmo inicial.
 */

const FAST_POLL_BASE_MS = 4000;
const FAST_POLL_MAX_MS = 20000;
const SLOW_POLL_BASE_MS = 60000;
const SLOW_POLL_MAX_MS = 300000;
const POLL_BACKOFF_FACTOR = 1.5;

export interface UseStripeConnectPollingOptions {
  /** `false` detiene el polling y limpia el temporizador pendiente. */
  active: boolean;
  /** `true` usa el nivel rápido; `false`, el lento. */
  fastTier: boolean;
  /**
   * Se espera a que resuelva antes de programar el siguiente tick, de modo
   * que una respuesta lenta no solape peticiones.
   */
  onTick: () => Promise<void>;
}

export function useStripeConnectPolling({
  active,
  fastTier,
  onTick,
}: UseStripeConnectPollingOptions): void {
  // `onTick` se guarda en una ref para que un callback recreado en cada
  // render no reinicie el efecto: reiniciarlo perdería el backoff acumulado
  // y dejaría el polling clavado en el intervalo base para siempre.
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let delay = fastTier ? FAST_POLL_BASE_MS : SLOW_POLL_BASE_MS;
    const maxDelay = fastTier ? FAST_POLL_MAX_MS : SLOW_POLL_MAX_MS;

    const schedule = () => {
      timeoutId = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        await onTickRef.current();
      } catch {
        // Un `onTick` que rechaza no debe matar el polling: sin este catch, la
        // promesa rechazada cortaría la cadena y no se reprogramaría nunca
        // más, dejando la UI congelada en silencio. Se reprograma igual, y el
        // backoff espacia los reintentos si el fallo persiste.
      }
      if (cancelled) return;
      delay = Math.min(delay * POLL_BACKOFF_FACTOR, maxDelay);
      schedule();
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [active, fastTier]);
}
