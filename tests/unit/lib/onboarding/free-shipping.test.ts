import { describe, it, expect } from 'vitest';
import {
  NO_FREE_SHIPPING,
  freeShippingFromApi,
  freeShippingToApi,
  validateFreeShipping,
} from '@/lib/onboarding/free-shipping';

describe('envío gratuito del productor', () => {
  it('API -> formulario: null = sin envío gratuito, 0 = siempre, > 0 = desde importe', () => {
    expect(freeShippingFromApi(null)).toEqual(NO_FREE_SHIPPING);
    expect(freeShippingFromApi(undefined)).toEqual(NO_FREE_SHIPPING);
    expect(freeShippingFromApi('0')).toEqual({ mode: 'always', amount: 0 });
    expect(freeShippingFromApi('35.5')).toEqual({ mode: 'from', amount: 35.5 });
  });

  it('formulario -> API', () => {
    expect(freeShippingToApi(NO_FREE_SHIPPING)).toBeNull();
    expect(freeShippingToApi({ mode: 'always', amount: 0 })).toBe(0);
    expect(freeShippingToApi({ mode: 'from', amount: 40 })).toBe(40);
    expect(freeShippingToApi({ mode: 'from', amount: 0 })).toBeNull();
  });

  it('"desde un importe" exige un importe mayor que 0; las otras opciones no', () => {
    expect(validateFreeShipping({ mode: 'from', amount: 0 })).toMatch(/importe/i);
    expect(validateFreeShipping({ mode: 'from', amount: 25 })).toBeUndefined();
    expect(validateFreeShipping({ mode: 'always', amount: 0 })).toBeUndefined();
    expect(validateFreeShipping(NO_FREE_SHIPPING)).toBeUndefined();
  });
});
