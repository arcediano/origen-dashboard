/**
 * Envío gratuito del productor (solo logística gestionada por él).
 * En la API es un único número: `null` = sin envío gratuito, `0` = siempre
 * gratuito, `> 0` = gratuito desde ese subtotal de sus productos.
 */

export type FreeShippingMode = 'none' | 'from' | 'always';

export interface FreeShippingConfig {
  mode: FreeShippingMode;
  /** Importe del umbral (solo relevante con `mode === 'from'`; 0 = vacío). */
  amount: number;
}

export const NO_FREE_SHIPPING: FreeShippingConfig = { mode: 'none', amount: 0 };

export function freeShippingFromApi(value: unknown): FreeShippingConfig {
  if (value === null || value === undefined || value === '') return NO_FREE_SHIPPING;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return NO_FREE_SHIPPING;
  return n === 0 ? { mode: 'always', amount: 0 } : { mode: 'from', amount: n };
}

export function freeShippingToApi(cfg: FreeShippingConfig): number | null {
  if (cfg.mode === 'always') return 0;
  if (cfg.mode === 'from' && cfg.amount > 0) return cfg.amount;
  return null;
}

/** Mensaje de error si la configuración no es válida; `undefined` si lo es. */
export function validateFreeShipping(cfg: FreeShippingConfig): string | undefined {
  if (cfg.mode === 'from' && !(cfg.amount > 0)) {
    return 'Indica el importe a partir del cual el envío es gratuito (mayor que 0 €).';
  }
  return undefined;
}
