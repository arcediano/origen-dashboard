/**
 * Definición de los 5 pasos del onboarding (ADR-020) y utilidades de
 * navegación (`?step=N`, paso inicial, hasta dónde se puede llegar).
 *
 * Numeración única: 1 Ubicación e identidad legal · 2 Perfil visual ·
 * 3 Envíos · 4 Documentación y certificaciones · 5 Pagos. Los pasos
 * "Historia" y "Productos" ya no existen.
 */

export const ONBOARDING_TOTAL_STEPS = 5;

export type OnboardingStepId = 1 | 2 | 3 | 4 | 5;

export interface OnboardingStepMeta {
  id: OnboardingStepId;
  /** Título completo (cabecera del paso). */
  title: string;
  /** Etiqueta corta para el stepper. */
  label: string;
  /** Qué se pide y para qué, en una frase dirigida al productor. */
  purpose: string;
  /** Tiempo orientativo. */
  time: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStepMeta[] = [
  {
    id: 1,
    title: 'Ubicación e identidad legal',
    label: 'Ubicación',
    purpose: 'Datos fiscales y dirección de tu negocio. Los necesitamos para verificar tu cuenta, emitir facturas y saber si Origen puede recoger tus pedidos.',
    time: '3 min',
  },
  {
    id: 2,
    title: 'Perfil visual',
    label: 'Imagen',
    purpose: 'El logo y las fotos son lo primero que ven tus clientes en tu tienda.',
    time: '2 min',
  },
  {
    id: 3,
    title: 'Envíos',
    label: 'Envíos',
    purpose: 'Elige quién entrega tus pedidos y a dónde llegas. Lo ajustamos según tu código postal.',
    time: '3 min',
  },
  {
    id: 4,
    title: 'Documentación y certificaciones',
    label: 'Documentos',
    purpose: 'Sube los documentos legales para que podamos verificar tu negocio y declara las certificaciones que tengas.',
    time: '4 min',
  },
  {
    id: 5,
    title: 'Pagos',
    label: 'Pagos',
    purpose: 'Conecta tu cuenta de cobro para recibir el dinero de tus ventas.',
    time: '3 min',
  },
];

/** Valida el parámetro `?step=N` (1..5). Devuelve `null` si no es válido. */
export function parseStepParam(raw: string | null | undefined): OnboardingStepId | null {
  if (raw == null || !/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= 1 && n <= ONBOARDING_TOTAL_STEPS ? (n as OnboardingStepId) : null;
}

/** Normaliza `completedSteps` del backend: solo 1..5, sin duplicados, ordenado. */
export function normalizeCompletedSteps(steps: unknown): number[] {
  if (!Array.isArray(steps)) return [];
  const valid = steps.filter(
    (s): s is number => Number.isInteger(s) && s >= 1 && s <= ONBOARDING_TOTAL_STEPS,
  );
  return Array.from(new Set(valid)).sort((a, b) => a - b);
}

/**
 * Índice (0-based) del último paso al que se puede navegar: el siguiente al
 * último completado, o el `currentStep` que reporta el backend si es mayor.
 */
export function getMaxReachableIndex(completedSteps: number[], currentStep?: number | null): number {
  const maxCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
  const fromCurrent = currentStep && currentStep >= 1 ? currentStep - 1 : 0;
  return Math.min(ONBOARDING_TOTAL_STEPS - 1, Math.max(maxCompleted, fromCurrent));
}

/**
 * Paso (índice 0-based) en el que se abre el wizard. `?step=N` manda (los
 * emails de recordatorio enlazan a `/onboarding?step=<currentStep>`), pero
 * nunca más allá de lo alcanzable; si no hay parámetro, el `currentStep` del
 * backend (máx. 5); sin datos guardados, el primero.
 */
export function resolveInitialStepIndex(input: {
  urlStep: OnboardingStepId | null;
  currentStep?: number | null;
  completedSteps?: number[];
}): number {
  const completed = normalizeCompletedSteps(input.completedSteps);
  const reachable = getMaxReachableIndex(completed, input.currentStep);
  if (input.urlStep) return Math.min(input.urlStep - 1, reachable);
  if (input.currentStep && input.currentStep >= 1) {
    return Math.min(input.currentStep - 1, ONBOARDING_TOTAL_STEPS - 1);
  }
  return 0;
}
