import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({ getMock: vi.fn(), postMock: vi.fn() }));

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, gatewayClient: { get: getMock, post: postMock } };
});

import { GatewayError } from '@/lib/api/client';
<<<<<<< Updated upstream
import { AiAssistError, getAiAssistQuota, startConversation } from '@/lib/api/ai-assist';

// Las rutas F1 (`label-reading`)/F2 (`text-improvement`) se retiraron
// (petición del humano, 2026-11-03): código muerto, sustituidas por
// `conversation*` desde el rediseño v2 del backend (2026-10-26).
=======
import { AiAssistError, createAssistedProduct, getAiAssistQuota, improveText, readLabel } from '@/lib/api/ai-assist';
>>>>>>> Stashed changes

describe('ai-assist API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAiAssistQuota devuelve el cupo', async () => {
    getMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
    await expect(getAiAssistQuota()).resolves.toEqual({ enabled: true, used: 1, total: 5 });
    expect(getMock).toHaveBeenCalledWith('/ai-assist/quota');
  });

  it('startConversation envía el turno con su timeout ampliado', async () => {
    postMock.mockResolvedValue({ kind: 'step' });
    await startConversation({ text: 'Es un queso de oveja' });
    expect(postMock).toHaveBeenCalledWith(
      '/ai-assist/conversation',
      { text: 'Es un queso de oveja' },
      { timeoutMs: 125_000 },
    );
  });

  it('createAssistedProduct envía todo el formulario de una vez con el timeout ampliado', async () => {
    postMock.mockResolvedValue({ productId: 'prod-1', charged: true, nutritionSource: null });
    const input = {
      images: { product: { mediaType: 'image/jpeg' as const, data: 'QUJD' } },
      productDescription: 'Queso curado de oveja',
    };
    await expect(createAssistedProduct(input)).resolves.toEqual({
      productId: 'prod-1',
      charged: true,
      nutritionSource: null,
    });
    expect(postMock).toHaveBeenCalledWith('/ai-assist/assisted-product', input, { timeoutMs: 125_000 });
  });

  it('createAssistedProduct traduce el código de cupo agotado', async () => {
    postMock.mockRejectedValue(new GatewayError(403, 'cupo', { code: 'AI_PRODUCER_QUOTA_EXCEEDED' }));
    const err = await createAssistedProduct({
      images: { product: { mediaType: 'image/jpeg', data: 'QUJD' } },
      productDescription: 'Queso curado de oveja',
    }).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({ code: 'AI_PRODUCER_QUOTA_EXCEEDED', status: 403 });
  });

  it('traduce un GatewayError con code estable a AiAssistError', async () => {
    postMock.mockRejectedValue(
      new GatewayError(503, 'Límite alcanzado', { code: 'AI_MONTHLY_CAP_REACHED' }),
    );
    const err = await startConversation({}).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({
      code: 'AI_MONTHLY_CAP_REACHED',
      status: 503,
      message: 'Límite alcanzado',
    });
  });

  it('sin code deja code = null; un error no-Gateway también se envuelve', async () => {
    postMock.mockRejectedValueOnce(new GatewayError(500, 'boom'));
    expect(await startConversation({}).catch((e) => e)).toMatchObject({ code: null, status: 500 });
    postMock.mockRejectedValueOnce(new Error('red caída'));
    expect(await startConversation({}).catch((e) => e)).toMatchObject({
      code: null,
      status: 0,
      message: 'red caída',
    });
  });
});
