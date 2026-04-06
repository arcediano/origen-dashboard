import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalWindow = globalThis.window;

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

  it('usa el mismo origen del navegador para las subidas en cliente', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://dashboard.origen.es' } },
      configurable: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { key: 'visual/logo/test.png', url: 'https://cdn.origen.es/test.png' } }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { uploadFile } = await import('@/lib/api/media');
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    await uploadFile(file, 'visual/logo');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dashboard.origen.es/api/v1/media/upload',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const formData = requestInit.body as FormData;

    expect(formData.get('entityType')).toBe('producers');
  });

  it('reintenta con la ruta legacy cuando la versionada no existe', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://dashboard.origen.es' } },
      configurable: true,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { key: 'products/123/test.png', url: 'https://cdn.origen.es/test.png' } }) });

    vi.stubGlobal('fetch', fetchMock);

    const { uploadFile } = await import('@/lib/api/media');
    const file = new File(['image'], 'product.png', { type: 'image/png' });

    await uploadFile(file, 'products/123');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://dashboard.origen.es/api/v1/media/upload',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://dashboard.origen.es/api/media/upload',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});
