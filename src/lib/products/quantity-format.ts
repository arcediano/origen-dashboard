import type { MeasureKind } from '@/types/product';

/** Unidades de una venta a granel: la cantidad se guarda en `base` (g o ml); el precio es por `big` (kg o l). */
export function measureUnits(measureKind?: MeasureKind): { base: 'g' | 'ml'; big: 'kg' | 'l' } {
  return measureKind === 'VOLUME' ? { base: 'ml', big: 'l' } : { base: 'g', big: 'kg' };
}

/** Cantidad a granel legible: 500 → «500 g», 1500 → «1,5 kg» (o «ml» y «l» si es volumen). */
export function formatBaseQuantity(quantity: number, measureKind?: MeasureKind): string {
  const { base, big } = measureUnits(measureKind);
  if (quantity >= 1000) {
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(quantity / 1000)} ${big}`;
  }
  return `${quantity} ${base}`;
}

export function formatProductQuantity(
  quantity: number,
  saleMode?: 'UNIT' | 'WEIGHT',
  measureKind?: MeasureKind,
): string {
  if (saleMode !== 'WEIGHT') return `${quantity} uds`;
  return formatBaseQuantity(quantity, measureKind);
}

/** Importe de una línea a granel en céntimos: igual que el backend (céntimo más cercano, empates hacia arriba). */
export function weightLineCents(pricePerKgCents: number, quantityBase: number): number {
  return Math.floor((pricePerKgCents * quantityBase + 500) / 1000);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Cantidades que puede elegir el comprador: el mínimo y, desde ahí, de incremento en incremento. */
export function nextQuantity(
  current: number,
  direction: 1 | -1,
  minimum: number,
  increment: number,
  maximum?: number,
): number {
  const next = direction === 1 ? current + increment : current - increment;
  if (next < minimum) return minimum;
  if (maximum !== undefined && next > maximum) return current;
  return next;
}
