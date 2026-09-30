import { describe, it, expect } from 'vitest';
import { hydrateOnboardingForm } from '@/lib/onboarding/hydrate';
import { INITIAL_FORM_DATA } from '@/lib/onboarding/types';
import type { OnboardingData } from '@/lib/api/onboarding';

const data: OnboardingData = {
  fiscal: { businessName: 'Huerta', entityType: 'sl', taxId: 'B1', businessPhone: '600', categories: ['agricola'], billingAddress: null },
  location: { street: 'Mayor', streetNumber: '1', city: 'Sevilla', province: 'Sevilla', postalCode: '41001' },
  story: { introVideoUrl: 'https://youtu.be/x', website: 'https://huerta.test' },
  visual: {
    logoDocId: 'l.png', logoUrl: 'https://cdn/l.png',
    teamPhotoUrls: [{ key: 't1', url: 'https://cdn/t1' }],
    locationImageUrls: [{ key: 'loc1', url: 'https://cdn/loc1' }],
  },
  logistics: {
    deliveryChoice: 'own', minOrderAmount: 25 as never, sustainablePackaging: true, packagingDescription: 'Cartón',
    deliveryOptions: [{ name: 'E', description: 'd', price: 5 as never, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' }],
    shippingZones: [
      { type: 'PROVINCE', value: 'Sevilla', label: 'Sevilla' },
      { type: 'CUSTOM', value: 'X', label: 'X', isExcluded: true },
    ],
  },
  documents: [
    { type: 'CIF', status: 'VERIFIED', documentKey: 'documents/cif/a.pdf', expiresAt: '2030-01-01T00:00:00.000Z' },
    { type: 'SEGURO_RC', status: 'REJECTED', documentKey: 'documents/rc/b.pdf', expiresAt: '2030-01-01T00:00:00.000Z', rejectedReason: 'Ilegible' },
    { type: 'MANIPULADOR_ALIMENTOS', status: 'PENDING', documentKey: 'documents/m/old.pdf', expiresAt: '2029-01-01T00:00:00.000Z', pendingDocumentKey: 'documents/m/new.pdf', pendingExpiresAt: '2031-01-01T00:00:00.000Z' },
  ],
  certifications: [{ certificationId: 'ecologico', name: 'Eco', status: 'PENDING', documentKey: null }],
  payment: { stripeConnected: true, stripeAccountId: 'acct_1', acceptedTermsAt: '2026-09-01' },
};

describe('hydrateOnboardingForm', () => {
  const f = hydrateOnboardingForm(data, INITIAL_FORM_DATA);

  it('paso 1 y nombre del negocio (de fiscal)', () => {
    expect(f.step1).toMatchObject({ entityType: 'sl', street: 'Mayor', postalCode: '41001', billingAddressSameAsProduction: true });
    expect(f.step1.locationImages[0]).toMatchObject({ key: 'loc1', url: 'https://cdn/loc1' });
    expect(f.meta).toEqual({ businessName: 'Huerta', website: 'https://huerta.test' });
  });

  it('paso 2: logo, fotos del equipo y vídeo', () => {
    expect(f.step2.logo).toMatchObject({ key: 'l.png' });
    expect(f.step2.teamPhotos).toHaveLength(1);
    expect(f.step2.introVideo).toBe('https://youtu.be/x');
  });

  it('paso 3: elección, opciones y zonas (excluidas aparte)', () => {
    expect(f.step3.deliveryChoice).toBe('own');
    expect(f.step3.minOrderAmount).toBe(25);
    expect(f.step3.deliveryOptions[0]).toMatchObject({ name: 'E', price: 5 });
    expect(f.step3.includedZones).toHaveLength(1);
    expect(f.step3.excludedZones).toHaveLength(1);
  });

  it('paso 4: documentos hidratados, sin obligar a resubir; fecha en YYYY-MM-DD', () => {
    expect(f.step4.cif.file?.key).toBe('documents/cif/a.pdf');
    expect(f.step4.cif.expiresAt).toBe('2030-01-01');
    expect(f.step4.cif.originalExpiresAt).toBe('2030-01-01T00:00:00.000Z');
    expect(f.step4.cif.status).toBe('VERIFIED');
  });

  it('paso 4: un documento rechazado obliga a subir uno nuevo; una sustitución pendiente manda', () => {
    expect(f.step4.seguroRc.file).toBeUndefined();
    expect(f.step4.seguroRc.rejectedReason).toBe('Ilegible');
    expect(f.step4.manipulador.file?.key).toBe('documents/m/new.pdf');
    expect(f.step4.manipulador.expiresAt).toBe('2031-01-01');
  });

  it('paso 4: certificaciones declaradas', () => {
    expect(f.step4.certifications).toEqual([expect.objectContaining({ certificationId: 'ecologico', file: undefined })]);
  });

  it('paso 5: Stripe y términos', () => {
    expect(f.step5).toEqual({ stripeConnected: true, stripeAccountId: 'acct_1', acceptTerms: true });
  });

  it('conserva lo escrito si el servidor no devuelve el bloque', () => {
    const prev = { ...INITIAL_FORM_DATA, step3: { ...INITIAL_FORM_DATA.step3, minOrderAmount: 40 } };
    expect(hydrateOnboardingForm({}, prev).step3.minOrderAmount).toBe(40);
  });
});
