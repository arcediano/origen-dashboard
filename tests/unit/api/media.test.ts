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
  });
});
