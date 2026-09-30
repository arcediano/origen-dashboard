import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock('@/lib/api/client', () => ({
  gatewayClient: { get: (...a: unknown[]) => mockGet(...a), post: (...a: unknown[]) => mockPost(...a), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  GatewayError: class extends Error {},
}));

import * as api from '@/lib/api/onboarding';
import { INITIAL_FORM_DATA } from '@/lib/onboarding/types';

beforeEach(() => { vi.clearAllMocks(); mockPost.mockResolvedValue({ success: true }); });

const step1 = {
  ...INITIAL_FORM_DATA.step1, entityType: 'sl' as const, taxId: 'B12345674', businessPhone: '600123123',
  street: 'Mayor', streetNumber: '1', city: 'Sevilla', province: 'Sevilla', postalCode: '41001', categories: ['agricola'],
};

describe('contrato: solo endpoints y campos vigentes (forbidNonWhitelisted)', () => {
  it('ya no existen las funciones de los pasos eliminados ni la numeración vieja', () => {
    for (const name of ['saveStep6', 'saveStepProducts', 'saveCertificationDocuments', 'saveStep4Legacy']) {
      expect(name in api).toBe(false);
    }
  });

  it('paso 1: sin foundedYear/teamSize; fotos solo si se pasan (omitir = no tocar)', async () => {
    await api.saveStep1(step1);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/producers/onboarding/step/1');
    expect(body).not.toHaveProperty('foundedYear');
    expect(body).not.toHaveProperty('teamSize');
    expect(body).not.toHaveProperty('locationImageKeys');
    expect(body.billingAddress).toBeUndefined();
    await api.saveStep1(step1, []);
    expect(mockPost.mock.calls[1][1].locationImageKeys).toEqual([]);
  });

  it('paso 1: envía billingAddress solo si difiere de la de producción', () => {
    const body = api.buildStep1Body({
      ...step1, billingAddressSameAsProduction: false,
      billingAddress: { street: 'B', streetNumber: '2', city: 'C', province: 'P', postalCode: '28001' },
    });
    expect(body.billingAddress).toMatchObject({ street: 'B', postalCode: '28001' });
  });

  it('paso 2: endpoint 2, teamPhotoKeys y sin productImageKeys; null borra banner y vídeo', async () => {
    await api.saveStep2({ logoKey: 'l', teamPhotoKeys: ['t1'], introVideoUrl: '  ' });
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/producers/onboarding/step/2');
    expect(body).toEqual({ logoKey: 'l', bannerKey: null, teamPhotoKeys: ['t1'], introVideoUrl: null });
    expect(body).not.toHaveProperty('productImageKeys');
  });

  it('paso 3: endpoint 3, sin isInOriginRoute, solo opciones completas', async () => {
    await api.saveStep3({
      ...INITIAL_FORM_DATA.step3, deliveryChoice: 'own', minOrderAmount: 20, sustainablePackaging: true, packagingDescription: ' Cartón ',
      deliveryOptions: [
        { id: 'a', name: ' Estándar ', description: 'd', price: 5, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' },
        { id: 'b', name: 'Incompleta', description: '', price: 5, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' },
      ],
      includedZones: [{ id: 'z', type: 'province', value: 'Sevilla', label: 'Sevilla' }],
    });
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/producers/onboarding/step/3');
    expect(body).not.toHaveProperty('isInOriginRoute');
    expect(body.packagingDescription).toBe('Cartón');
    expect(body.deliveryOptions).toEqual([{ name: 'Estándar', description: 'd', price: 5, estimatedDaysValue: 2, estimatedDaysUnit: 'DAYS' }]);
    expect(body.includedZones).toEqual([{ type: 'PROVINCE', value: 'Sevilla', label: 'Sevilla' }]);
    expect(Object.keys(body.deliveryOptions[0]).sort()).toEqual(['description', 'estimatedDaysUnit', 'estimatedDaysValue', 'name', 'price']);
  });

  it('paso 3: sin packaging sostenible no se envía descripción', () => {
    const body = api.buildStep3Body({ ...INITIAL_FORM_DATA.step3, deliveryChoice: 'delegated', minOrderAmount: 1, packagingDescription: 'x' });
    expect(body.packagingDescription).toBeUndefined();
  });

  it('paso 4: endpoint 4, certificaciones por id sin name/issuingBody', async () => {
    await api.saveStep4(
      { ...INITIAL_FORM_DATA.step4, cif: { expiresAt: '2030-01-01' } },
      { cifKey: 'k', certifications: [{ certificationId: 'ecologico', documentKey: 'd', expiresAt: '2030-02-02' }, { certificationId: 'vegano' }] },
    );
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/producers/onboarding/step/4');
    expect(body).not.toHaveProperty('certificationDocuments');
    expect(body.cifKey).toBe('k');
    expect(body.cifExpiresAt).toBe('2030-01-01');
    for (const c of body.certifications) {
      expect(c).not.toHaveProperty('name');
      expect(c).not.toHaveProperty('issuingBody');
    }
  });

  it('paso 4: reenvía la caducidad ISO original si el día no cambia', () => {
    expect(api.resolveExpiresAt({ expiresAt: '2030-01-01', originalExpiresAt: '2030-01-01T00:00:00.000Z' })).toBe('2030-01-01T00:00:00.000Z');
    expect(api.resolveExpiresAt({ expiresAt: '2031-05-05', originalExpiresAt: '2030-01-01T00:00:00.000Z' })).toBe('2031-05-05');
    expect(api.resolveExpiresAt({})).toBeUndefined();
  });

  it('paso 5: endpoint 5 y sin stripeConnected', async () => {
    await api.saveStep5({ stripeAccountId: 'acct_1', acceptTerms: true, ...( { stripeConnected: true } as object) });
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe('/producers/onboarding/step/5');
    expect(body).toEqual({ stripeAccountId: 'acct_1', acceptTerms: true });
  });

  it('getShippingCoverage llama a la ruta nueva y devuelve data', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: { status: 'COVERED', postalCode: '41001', canDelegate: true, pickupRoute: null, currentChoice: null } });
    const cov = await api.getShippingCoverage();
    expect(mockGet).toHaveBeenCalledWith('/producers/onboarding/shipping-coverage');
    expect(cov.status).toBe('COVERED');
  });
});
