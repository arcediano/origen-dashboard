import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({ getMock: vi.fn(), postMock: vi.fn() }));

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, gatewayClient: { get: getMock, post: postMock } };
});

import { GatewayError } from '@/lib/api/client';
import { AiAssistError, getAiAssistQuota, improveText, readLabel } from '@/lib/api/ai-assist';

describe('ai-assist API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAiAssistQuota devuelve el cupo', async () => {
    getMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
    await expect(getAiAssistQuota()).resolves.toEqual({ enabled: true, used: 1, total: 5 });
    expect(getMock).toHaveBeenCalledWith('/ai-assist/quota');
  });

  it('readLabel envía assistKey + imágenes con timeout ampliado', async () => {
    postMock.mockResolvedValue({ legible: true });
    const images = [{ mediaType: 'image/jpeg' as const, data: 'QUJD' }];
    await readLabel('clave-12345', images);
    expect(postMock).toHaveBeenCalledWith(
      '/ai-assist/label-reading',
      { assistKey: 'clave-12345', images },
      { timeoutMs: 90_000 },
    );
  });

  it('improveText envía assistKey + borrador con su timeout', async () => {
    postMock.mockResolvedValue({ proposal: {} });
    await improveText('clave-12345', { name: 'Miel' });
    expect(postMock).toHaveBeenCalledWith(
      '/ai-assist/text-improvement',
      { assistKey: 'clave-12345', name: 'Miel' },
      { timeoutMs: 60_000 },
    );
  });

  it('traduce un GatewayError con code estable a AiAssistError', async () => {
    postMock.mockRejectedValue(
      new GatewayError(503, 'Límite alcanzado', { code: 'AI_MONTHLY_CAP_REACHED' }),
    );
    const err = await readLabel('clave-12345', []).catch((e) => e);
    expect(err).toBeInstanceOf(AiAssistError);
    expect(err).toMatchObject({
      code: 'AI_MONTHLY_CAP_REACHED',
      status: 503,
      message: 'Límite alcanzado',
    });
  });

  it('sin code deja code = null; un error no-Gateway también se envuelve', async () => {
    postMock.mockRejectedValueOnce(new GatewayError(500, 'boom'));
    expect(await readLabel('k', []).catch((e) => e)).toMatchObject({ code: null, status: 500 });
    postMock.mockRejectedValueOnce(new Error('red caída'));
    expect(await readLabel('k', []).catch((e) => e)).toMatchObject({
      code: null,
      status: 0,
      message: 'red caída',
    });
  });
});
