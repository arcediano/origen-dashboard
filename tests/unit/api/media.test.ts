import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalWindow = globalThis.window;

const PRESIGNED_URL = 'https://s3.eu-west-1.amazonaws.com/bucket/key?X-Amz-Signature=abc';
const PRESIGNED_RESPONSE = {
  key: 'products/123/image.png',
  uploadUrl: PRESIGNED_URL,
  publicUrl: 'https://cdn.origen.es/products/123/image.png',
};

describe('uploadFile', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error restore optional global
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      });
    }
  });

  it('solicita URL prefirmada a /api/presigned-upload y devuelve key + url', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => PRESIGNED_RESPONSE,
      })
      .mockResolvedValueOnce({ ok: true, status: 200 }); // PUT S3

    vi.stubGlobal('fetch', fetchMock);

    const { uploadFile } = await import('@/lib/api/media');
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    const result = await uploadFile(file, 'products/123');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [presignedUrl, presignedInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(presignedUrl).toContain('/api/presigned-upload');
    expect(presignedUrl).toContain('mimeType=image%2Fpng');
    expect((presignedInit as RequestInit).method).toBe('GET');
    expect((presignedInit as RequestInit).credentials).toBe('include');

    const [s3Url, s3Init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(s3Url).toBe(PRESIGNED_URL);
    expect((s3Init as RequestInit).method).toBe('PUT');

    expect(result.key).toBe(PRESIGNED_RESPONSE.key);
    expect(result.url).toBe(PRESIGNED_RESPONSE.publicUrl);
  });

  it('lanza error cuando la subida a S3 falla con un código de estado no recuperable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => PRESIGNED_RESPONSE,
      })
      .mockResolvedValueOnce({ ok: false, status: 500 }); // S3 falla con 500

    vi.stubGlobal('fetch', fetchMock);

    const { uploadFile } = await import('@/lib/api/media');
    const file = new File(['image'], 'product.png', { type: 'image/png' });

    await expect(uploadFile(file, 'products/123')).rejects.toThrow(
      'Error al subir el archivo',
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
