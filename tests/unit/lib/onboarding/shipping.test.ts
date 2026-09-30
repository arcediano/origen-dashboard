import { describe, it, expect } from 'vitest';
import { getShippingUiMode, isDeliveryOptionComplete, reconcileDeliveryChoice } from '@/lib/onboarding/shipping';
import { parsePostalInput } from '@/lib/onboarding/zones';
import type { ShippingCoverage } from '@/lib/onboarding/types';

const covered: ShippingCoverage = {
  status: 'COVERED', postalCode: '41001', canDelegate: true,
  pickupRoute: { id: 'r', name: 'Ruta', warehouseName: 'Almacén' }, currentChoice: null,
};
const notCovered: ShippingCoverage = { status: 'NOT_COVERED', postalCode: '99999', canDelegate: false, reason: 'Sin ruta', pickupRoute: null, currentChoice: null };
const missing: ShippingCoverage = { status: 'MISSING_POSTAL_CODE', postalCode: null, canDelegate: false, pickupRoute: null, currentChoice: null };

describe('cobertura → UI del paso de envíos', () => {
  it('COVERED ofrece elegir; NOT_COVERED solo gestión propia; MISSING pide la ubicación', () => {
    expect(getShippingUiMode(covered)).toBe('choose');
    expect(getShippingUiMode(notCovered)).toBe('own-only');
    expect(getShippingUiMode(missing)).toBe('missing-location');
  });
  it('sin respuesta: cargando o error', () => {
    expect(getShippingUiMode(null, { loading: true })).toBe('loading');
    expect(getShippingUiMode(null, { error: true })).toBe('error');
  });
  it('una elección "delegated" previa pasa a "own" si no hay cobertura', () => {
    expect(reconcileDeliveryChoice('delegated', notCovered)).toBe('own');
    expect(reconcileDeliveryChoice(undefined, notCovered)).toBe('own');
    expect(reconcileDeliveryChoice('delegated', covered)).toBe('delegated');
    expect(reconcileDeliveryChoice(undefined, covered)).toBeUndefined();
    expect(reconcileDeliveryChoice('delegated', null)).toBe('delegated');
  });
});

describe('opción de envío', () => {
  const base = { id: 'a', name: 'Estándar', description: 'd', price: 5, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' as const };
  it('exige nombre, descripción, plazo y precio > 0 (sin "gratis"/recogida en local)', () => {
    expect(isDeliveryOptionComplete(base)).toBe(true);
    expect(isDeliveryOptionComplete({ ...base, price: 0 })).toBe(false);
    expect(isDeliveryOptionComplete({ ...base, name: ' ' })).toBe(false);
    expect(isDeliveryOptionComplete({ ...base, description: '' })).toBe(false);
    expect(isDeliveryOptionComplete({ ...base, estimatedDaysValue: null })).toBe(false);
  });
});

describe('parsePostalInput', () => {
  it('individual, comodín y rango', () => {
    expect(parsePostalInput('28001').map((z) => z.value)).toEqual(['28001']);
    expect(parsePostalInput('280*').map((z) => z.value)).toEqual(['280*']);
    expect(parsePostalInput('28000-28002').map((z) => z.value)).toEqual(['28000', '28001', '28002']);
    expect(parsePostalInput('abc, 123')).toEqual([]);
  });
});
