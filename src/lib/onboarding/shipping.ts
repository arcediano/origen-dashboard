/**
 * Lógica pura del paso de envíos: validez de una opción de envío y mapeo de la
 * cobertura de Origen (`GET onboarding/shipping-coverage`) a lo que la UI ofrece.
 */

import type { DeliveryChoice, DeliveryOption, ShippingCoverage } from './types';

export const isDeliveryOptionComplete = (opt: DeliveryOption): boolean =>
  Boolean(opt.name.trim()) &&
  Boolean(opt.description.trim()) &&
  opt.estimatedDaysValue !== null &&
  opt.price > 0;

/**
 * Qué muestra el paso de envíos según la cobertura:
 * - `loading`: comprobando.
 * - `error`: no se pudo comprobar (se ofrece reintentar).
 * - `choose`  (COVERED): el productor elige entre delegar en Origen o gestionarlo él.
 * - `own-only` (NOT_COVERED): solo puede gestionarlo él.
 * - `missing-location` (MISSING_POSTAL_CODE): falta completar la ubicación.
 */
export type ShippingUiMode = 'loading' | 'error' | 'choose' | 'own-only' | 'missing-location';

export function getShippingUiMode(
  coverage: ShippingCoverage | null,
  state: { loading?: boolean; error?: boolean } = {},
): ShippingUiMode {
  if (coverage) {
    switch (coverage.status) {
      case 'COVERED':
        return coverage.canDelegate ? 'choose' : 'own-only';
      case 'NOT_COVERED':
        return 'own-only';
      case 'MISSING_POSTAL_CODE':
        return 'missing-location';
    }
  }
  if (state.error) return 'error';
  return 'loading';
}

/**
 * Adapta la elección guardada a lo que la cobertura permite: sin cobertura
 * solo es válido `own` (una elección previa `delegated` ya no lo es); con
 * cobertura se conserva la elección del productor.
 */
export function reconcileDeliveryChoice(
  choice: DeliveryChoice | undefined,
  coverage: ShippingCoverage | null,
): DeliveryChoice | undefined {
  if (!coverage) return choice;
  if (coverage.status === 'NOT_COVERED' || (coverage.status === 'COVERED' && !coverage.canDelegate)) {
    return 'own';
  }
  return choice;
}
