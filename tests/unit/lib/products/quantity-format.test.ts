import { describe, expect, it } from 'vitest';
import {
  formatBaseQuantity,
  formatCents,
  formatProductQuantity,
  measureUnits,
  nextQuantity,
  weightLineCents,
} from '@/lib/products/quantity-format';

describe('quantity-format (venta a granel, ADR-024)', () => {
  it('usa g/kg para peso y ml/l para volumen', () => {
    expect(measureUnits('MASS')).toEqual({ base: 'g', big: 'kg' });
    expect(measureUnits('VOLUME')).toEqual({ base: 'ml', big: 'l' });
    expect(measureUnits(undefined)).toEqual({ base: 'g', big: 'kg' });
  });

  it('formatea cantidades a granel', () => {
    expect(formatBaseQuantity(500, 'MASS')).toBe('500 g');
    expect(formatBaseQuantity(1500, 'MASS')).toBe('1,5 kg');
    expect(formatBaseQuantity(750, 'VOLUME')).toBe('750 ml');
    expect(formatBaseQuantity(2000, 'VOLUME')).toBe('2 l');
  });

  it('mantiene el formato de producto: unidades y a granel', () => {
    expect(formatProductQuantity(3, 'UNIT')).toBe('3 uds');
    expect(formatProductQuantity(1500, 'WEIGHT')).toBe('1,5 kg');
    expect(formatProductQuantity(500, 'WEIGHT', 'VOLUME')).toBe('500 ml');
  });

  it('calcula el importe como el backend: céntimo más cercano, empates hacia arriba', () => {
    expect(weightLineCents(1600, 750)).toBe(1200);
    expect(weightLineCents(1299, 250)).toBe(325);
    expect(weightLineCents(2, 250)).toBe(1);
  });

  it('da formato de euros en español', () => {
    expect(formatCents(1200).replace(/\s/g, ' ')).toBe('12,00 €');
  });

  it('avanza y retrocede por incrementos sin bajar del mínimo ni pasar del máximo', () => {
    expect(nextQuantity(500, 1, 500, 250)).toBe(750);
    expect(nextQuantity(750, -1, 500, 250)).toBe(500);
    expect(nextQuantity(500, -1, 500, 250)).toBe(500);
    expect(nextQuantity(750, 1, 500, 250, 800)).toBe(750);
  });
});
