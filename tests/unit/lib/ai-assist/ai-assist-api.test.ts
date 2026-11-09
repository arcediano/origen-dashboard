import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({ getMock: vi.fn(), postMock: vi.fn() }));

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, gatewayClient: { get: getMock, post: postMock } };
});

import { GatewayError } from '@/lib/api/client';
import { AiAssistError, createAssistedProduct, getAiAssistQuota, reviewProfile } from '@/lib/api/ai-assist';

const ASSISTED_PRODUCT_INPUT = {
  images: { product: { mediaType: 'image/jpeg' as const, data: 'QUJD' } },
  productDescription: 'Queso curado de oveja',
};

describe('ai-assist API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAiAssistQuota devuelve el cupo', async () => {
    getMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
    await expect(getAiAssistQuota()).resolves.toEqual({ enabled: true, used: 1, total: 5 });
    expect(getMock).toHaveBeenCalledWith('/ai-assist/quota');
  });

  it('createAssistedProduct envía todo el formulario de una vez con el timeout ampliado', async () => {
    postMock.mockResolvedValue({ productId: 'prod-1', charged: true, nutritionSource: null });
    await expect(createAssistedProduct(ASSISTED_PRODUCT_INPUT)).resolves.toEqual({
      productId: 'prod-1',
      charged: true,
      nutritionSource: null,
    });
    expect(postMock).toHaveBeenCalledWith('/ai-assist/assisted-product', ASSISTED_PRODUCT_INPUT, { timeoutMs: 125_000 });
  });

  it('createAssistedProduct traduce el código de cupo agotado', async () => {
    postMock.mockRejectedValue(new GatewayError(403, 'cupo', { code: 'AI_PRODUCER_QUOTA_EXCEEDED' }));
    const err = await createAssistedProduct(ASSISTED_PRODUCT_INPUT).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({ code: 'AI_PRODUCER_QUOTA_EXCEEDED', status: 403 });
  });

  it('traduce un GatewayError con code estable a AiAssistError', async () => {
    postMock.mockRejectedValue(
      new GatewayError(503, 'Límite alcanzado', { code: 'AI_MONTHLY_CAP_REACHED' }),
    );
    const err = await createAssistedProduct(ASSISTED_PRODUCT_INPUT).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({
      code: 'AI_MONTHLY_CAP_REACHED',
      status: 503,
      message: 'Límite alcanzado',
    });
  });

  // Petición del humano, 2026-11-08: "Mejorar con IA" del perfil comercial,
  // misma bolsa de créditos que crear un producto.
  it('reviewProfile envía los campos y devuelve las sugerencias', async () => {
    const fields = { tagline: 'Miel de mi pueblo' };
    postMock.mockResolvedValue({
      suggestions: [{ field: 'tagline', current: 'Miel de mi pueblo', suggested: 'Miel cruda de mi pueblo', reason: 'Más concreto' }],
    });
    await expect(reviewProfile(fields)).resolves.toEqual({
      suggestions: [{ field: 'tagline', current: 'Miel de mi pueblo', suggested: 'Miel cruda de mi pueblo', reason: 'Más concreto' }],
    });
    expect(postMock).toHaveBeenCalledWith(
      '/ai-assist/profile-review',
      fields,
      expect.objectContaining({ timeoutMs: expect.any(Number) }),
    );
  });

  it('reviewProfile traduce el código de cupo agotado', async () => {
    postMock.mockRejectedValue(new GatewayError(403, 'cupo', { code: 'AI_PRODUCER_QUOTA_EXCEEDED' }));
    const err = await reviewProfile({ tagline: 'x' }).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({ code: 'AI_PRODUCER_QUOTA_EXCEEDED', status: 403 });
  });

  it('sin code deja code = null; un error no-Gateway también se envuelve', async () => {
    postMock.mockRejectedValueOnce(new GatewayError(500, 'boom'));
    expect(await createAssistedProduct(ASSISTED_PRODUCT_INPUT).catch((e) => e)).toMatchObject({ code: null, status: 500 });
    postMock.mockRejectedValueOnce(new Error('red caída'));
    expect(await createAssistedProduct(ASSISTED_PRODUCT_INPUT).catch((e) => e)).toMatchObject({
      code: null,
      status: 0,
      message: 'red caída',
    });
  });
});
