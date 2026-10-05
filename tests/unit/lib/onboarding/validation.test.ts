import { describe, it, expect } from 'vitest';
import { INITIAL_FORM_DATA, type OnboardingFormData, type ShippingCoverage } from '@/lib/onboarding/types';
import { issuesToFieldErrors, validateStep } from '@/lib/onboarding/validation';

const TODAY = '2026-09-30';
const covered: ShippingCoverage = { status: 'COVERED', postalCode: '41001', canDelegate: true, pickupRoute: null, currentChoice: null };
const form = (patch: Partial<OnboardingFormData> = {}): OnboardingFormData => ({ ...INITIAL_FORM_DATA, ...patch });
const ids = (i: number, f: OnboardingFormData, coverage: ShippingCoverage | null = covered) =>
  validateStep(i, f, { coverage, today: TODAY }).map((x) => x.fieldId);

describe('paso 1', () => {
  it('vacío: pide forma jurídica, NIF, teléfono, dirección, CP y categorías', () => {
    expect(ids(0, form())).toEqual(expect.arrayContaining([
      'onb-entity-type', 'onb-tax-id', 'onb-phone', 'onb-street', 'onb-street-number', 'onb-postal-code', 'onb-city', 'onb-categories',
    ]));
  });
  it('completo: sin incidencias', () => {
    const f = form({ step1: { ...INITIAL_FORM_DATA.step1, entityType: 'autonomo', taxId: '12345678Z', businessPhone: '600123123', street: 'Mayor', streetNumber: '1', city: 'Sevilla', province: 'Sevilla', postalCode: '41001', categories: ['agricola'] } });
    expect(ids(0, f)).toEqual([]);
  });
  it('facturación distinta: exige sus campos', () => {
    const f = form({ step1: { ...INITIAL_FORM_DATA.step1, billingAddressSameAsProduction: false } });
    expect(ids(0, f)).toContain('onb-billing-street');
  });
});

describe('paso 2', () => {
  it('logo obligatorio; vídeo opcional pero válido', () => {
    expect(ids(1, form())).toEqual(['onb-logo']);
    const logo = { id: 'k', key: 'k', name: 'l', size: 0, type: 'image/png' };
    expect(ids(1, form({ step2: { ...INITIAL_FORM_DATA.step2, logo, introVideo: 'https://ejemplo.com/v' } }))).toEqual(['onb-video']);
    expect(ids(1, form({ step2: { ...INITIAL_FORM_DATA.step2, logo, introVideo: 'https://youtu.be/abc' } }))).toEqual([]);
  });
});

describe('paso 3 (envíos)', () => {
  const step3 = { ...INITIAL_FORM_DATA.step3, minOrderAmount: 25, includedZones: [{ id: 'z', type: 'custom' as const, value: 'ES', label: 'Toda España' }] };
  it('sin cobertura comprobada no se puede continuar', () => {
    expect(ids(2, form({ step3 }), null)).toEqual(['onb-delivery-choice']);
  });
  it('MISSING_POSTAL_CODE pide completar la ubicación', () => {
    const missing: ShippingCoverage = { status: 'MISSING_POSTAL_CODE', postalCode: null, canDelegate: false, pickupRoute: null, currentChoice: null };
    const msg = validateStep(2, form({ step3 }), { coverage: missing })[0].message;
    expect(msg).toMatch(/ubicación/i);
  });
  it('delegar sin cobertura no es válido', () => {
    const nc: ShippingCoverage = { status: 'NOT_COVERED', postalCode: '1', canDelegate: false, pickupRoute: null, currentChoice: null };
    expect(ids(2, form({ step3: { ...step3, deliveryChoice: 'delegated' } }), nc)).toEqual(['onb-delivery-choice']);
  });
  it('delegado con cobertura: no pide métodos de envío', () => {
    expect(ids(2, form({ step3: { ...step3, deliveryChoice: 'delegated' } }))).toEqual([]);
  });
  it('gestión propia: exige ≥1 método completo', () => {
    expect(ids(2, form({ step3: { ...step3, deliveryChoice: 'own' } }))).toEqual(['onb-delivery-options']);
    const opt = { id: 'a', name: 'E', description: 'd', price: 5, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' as const };
    expect(ids(2, form({ step3: { ...step3, deliveryChoice: 'own', deliveryOptions: [opt] } }))).toEqual([]);
    expect(ids(2, form({ step3: { ...step3, deliveryChoice: 'own', deliveryOptions: [{ ...opt, price: 0 }] } }))).toEqual(['onb-delivery-options']);
  });
  it('las zonas son obligatorias; el pedido mínimo es opcional (0 = sin mínimo) pero no negativo', () => {
    expect(ids(2, form({ step3: { ...INITIAL_FORM_DATA.step3, deliveryChoice: 'delegated' } }))).toEqual(['onb-zone-value']);
    expect(ids(2, form({ step3: { ...INITIAL_FORM_DATA.step3, deliveryChoice: 'delegated', minOrderAmount: -5 } }))).toEqual(['onb-zone-value', 'onb-min-order']);
  });
});

describe('paso 4 (documentación)', () => {
  const file = { id: 'k', key: 'k', name: 'd.pdf', size: 0, type: 'application/pdf' };
  it('los 3 documentos son obligatorios', () => {
    expect(ids(3, form())).toEqual(['onb-doc-cif', 'onb-doc-seguroRc', 'onb-doc-manipulador']);
  });
  it('la caducidad es obligatoria y futura; un verificado no la exige', () => {
    const base = { ...INITIAL_FORM_DATA.step4, cif: { file, fileBack: file, expiresAt: '2030-01-01' }, seguroRc: { file }, manipulador: { file, expiresAt: '2026-01-01' } };
    expect(ids(3, form({ step4: base }))).toEqual(['onb-doc-seguroRc-expires', 'onb-doc-manipulador-expires']);
    const verified = { ...base, seguroRc: { file, status: 'VERIFIED' as const }, manipulador: { file, expiresAt: '2031-01-01' } };
    expect(ids(3, form({ step4: verified }))).toEqual([]);
  });
  it('el CIF con solo el anverso pide el reverso (sin llegar a pedir la caducidad)', () => {
    const base = { ...INITIAL_FORM_DATA.step4, cif: { file, expiresAt: '2030-01-01' }, seguroRc: { file, expiresAt: '2030-01-01' }, manipulador: { file, expiresAt: '2030-01-01' } };
    expect(ids(3, form({ step4: base }))).toEqual(['onb-doc-cif-back']);
    expect(ids(3, form({ step4: { ...base, cif: { ...base.cif, fileBack: file } } }))).toEqual([]);
  });
  it('una certificación con documento necesita caducidad; sin documento no pide nada', () => {
    const docs = { cif: { file, fileBack: file, expiresAt: '2030-01-01' }, seguroRc: { file, expiresAt: '2030-01-01' }, manipulador: { file, expiresAt: '2030-01-01' } };
    expect(ids(3, form({ step4: { ...docs, certifications: [{ certificationId: 'ecologico' }] } }))).toEqual([]);
    expect(ids(3, form({ step4: { ...docs, certifications: [{ certificationId: 'ecologico', file }] } }))).toEqual(['onb-cert-ecologico-expires']);
  });
});

describe('paso 5 y errores por campo', () => {
  it('exige aceptar términos, no tener Stripe conectado', () => {
    expect(ids(4, form())).toEqual(['accept-terms']);
    expect(ids(4, form({ step5: { stripeConnected: false, acceptTerms: true } }))).toEqual([]);
  });
  it('issuesToFieldErrors conserva el primer mensaje por campo', () => {
    expect(issuesToFieldErrors([{ message: 'a', fieldId: 'x' }, { message: 'b', fieldId: 'x' }, { message: 'c' }])).toEqual({ x: 'a' });
  });
});
