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
      'https://dashboard.origen.es/api/upload',
      expect.objectContaining({ method: 'POST' }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const formData = requestInit.body as FormData;

    expect(formData.get('entityType')).toBe('producers');
  });

  it('devuelve un error de usuario cuando falla el route handler de upload', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://dashboard.origen.es' } },
      configurable: true,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

    vi.stubGlobal('fetch', fetchMock);

    const { uploadFile } = await import('@/lib/api/media');
    const file = new File(['image'], 'product.png', { type: 'image/png' });

    await expect(uploadFile(file, 'products/123')).rejects.toThrow(
      'Error al subir el archivo',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dashboard.origen.es/api/upload',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
