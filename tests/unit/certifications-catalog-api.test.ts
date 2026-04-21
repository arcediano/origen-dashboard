/**
 * @file certifications-catalog-api.test.ts
 * @description Tests unitarios de las funciones de catálogo de certs (US-QA-2903 / Sprint 29).
 *
 * Valida:
 *  - getCertificationsCatalog construye la query correctamente y mapea la respuesta
 *  - addProductCertification llama a POST /products/:id/certifications con el body correcto
 *  - removeProductCertification llama a DELETE /products/:id/certifications/:certId
 *  - Manejo de errores de red (GatewayError devuelve ApiResponse con error)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock del cliente gateway ─────────────────────────────────────────────────

const mockGet    = vi.fn();
const mockPost   = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/api/client', () => ({
  gatewayClient: {
    get:    (...args: unknown[]) => mockGet(...args),
    post:   (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    put:    vi.fn(),
    patch:  vi.fn(),
  },
  GatewayError: class GatewayError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import {
  getCertificationsCatalog,
  addProductCertification,
  removeProductCertification,
} from '@/lib/api/products';

// ─── Tests ────────────────────────────────────────────────────────────────────

const MOCK_CATALOG_RESPONSE = {
  items: [
    { id: 'cert-eco', name: 'Agricultura Ecológica UE', issuingBody: 'CAE', category: 'ORGANIC' },
    { id: 'cert-dop', name: 'DOP Sierra Nevada',       issuingBody: 'MAPAMA', category: 'ORIGIN' },
  ],
  total: 2,
  page:  1,
  limit: 20,
};

describe('getCertificationsCatalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama al endpoint correcto sin parámetros y mapea la respuesta', async () => {
    mockGet.mockResolvedValueOnce(MOCK_CATALOG_RESPONSE);

    const res = await getCertificationsCatalog();

    expect(mockGet).toHaveBeenCalledWith('/products/certifications/catalog');
    expect(res.status).toBe(200);
    expect(res.data?.items).toHaveLength(2);
    expect(res.data?.total).toBe(2);
  });

  it('incluye el parámetro search en la query string', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_CATALOG_RESPONSE, items: [], total: 0 });

    await getCertificationsCatalog({ search: 'ecologica' });

    const [url] = mockGet.mock.calls[0] as [string];
    expect(url).toContain('search=ecologica');
  });

  it('incluye el parámetro category en la query string', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_CATALOG_RESPONSE, items: [], total: 0 });

    await getCertificationsCatalog({ category: 'ORGANIC' });

    const [url] = mockGet.mock.calls[0] as [string];
    expect(url).toContain('category=ORGANIC');
  });

  it('incluye page y limit cuando se proporcionan', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_CATALOG_RESPONSE });

    await getCertificationsCatalog({ page: 2, limit: 5 });

    const [url] = mockGet.mock.calls[0] as [string];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=5');
  });

  it('devuelve error cuando el gateway falla', async () => {
    const { GatewayError } = await import('@/lib/api/client');
    mockGet.mockRejectedValueOnce(new GatewayError(404, 'Not Found'));

    const res = await getCertificationsCatalog();

    expect(res.error).toBeTruthy();
    expect(res.status).toBe(404);
  });
});

describe('addProductCertification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a POST /products/:id/certifications con certificationId correcto', async () => {
    mockPost.mockResolvedValueOnce({ certificationId: 'cert-eco' });

    const res = await addProductCertification('prod-123', 'cert-eco');

    expect(mockPost).toHaveBeenCalledWith(
      '/products/prod-123/certifications',
      { certificationId: 'cert-eco' },
    );
    expect(res.status).toBe(201);
    expect(res.data?.certificationId).toBe('cert-eco');
  });

  it('devuelve error cuando el gateway falla', async () => {
    const { GatewayError } = await import('@/lib/api/client');
    mockPost.mockRejectedValueOnce(new GatewayError(409, 'Conflict'));

    const res = await addProductCertification('prod-123', 'cert-eco');

    expect(res.error).toBeTruthy();
    expect(res.status).toBe(409);
  });
});

describe('removeProductCertification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a DELETE /products/:id/certifications/:certId', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const res = await removeProductCertification('prod-123', 'cert-eco');

    expect(mockDelete).toHaveBeenCalledWith('/products/prod-123/certifications/cert-eco');
    expect(res.status).toBe(200);
    expect(res.data).toBeNull();
  });

  it('devuelve error cuando el gateway falla', async () => {
    const { GatewayError } = await import('@/lib/api/client');
    mockDelete.mockRejectedValueOnce(new GatewayError(403, 'Forbidden'));

    const res = await removeProductCertification('prod-123', 'cert-eco');

    expect(res.error).toBeTruthy();
    expect(res.status).toBe(403);
  });
});
