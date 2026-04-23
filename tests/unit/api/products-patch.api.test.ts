/**
 * @file products.api.test.ts (dashboard)
 * @description Tests unitarios para updateProductStatus() y scheduleProduct()
 *              de src/lib/api/products.ts.
 *
 * Usa MSW para interceptar PATCH /products/:id/status y /products/:id/schedule.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { updateProductStatus, scheduleProduct } from '@/lib/api/products';
import { productPatchHandlers } from '../../mocks/handlers/products-patch.handlers';
import { TEST_API_BASE } from '../../mocks/api-base';

const BASE = TEST_API_BASE;

beforeEach(() => {
  server.use(...productPatchHandlers);
});

// ─── updateProductStatus() ────────────────────────────────────────────────────

describe('updateProductStatus()', () => {
  it('devuelve status 200 y el nuevo estado cuando la petición es válida', async () => {
    const result = await updateProductStatus('prod-001', 'PENDING_APPROVAL');

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe('PENDING_APPROVAL');
  });

  it('propaga el id del producto en la respuesta', async () => {
    const result = await updateProductStatus('prod-42', 'DRAFT');

    expect(result.data!.id).toBe('prod-42');
  });

  it('devuelve error 404 cuando el producto no existe', async () => {
    const result = await updateProductStatus('not-found', 'DRAFT');

    expect(result.error).toBeDefined();
    expect(result.status).toBe(404);
    expect(result.data).toBeUndefined();
  });

  it('devuelve error cuando el servidor responde 500', async () => {
    server.use(
      http.patch(`${BASE}/products/:id/status`, () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    );

    const result = await updateProductStatus('prod-001', 'DRAFT');

    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
  });
});

// ─── scheduleProduct() ────────────────────────────────────────────────────────

describe('scheduleProduct()', () => {
  it('devuelve status 200 y scheduledAt cuando la fecha es futura', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 días

    const result = await scheduleProduct('prod-001', futureDate);

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe('SCHEDULED');
    expect(result.data!.scheduledAt).toBeDefined();
  });

  it('el scheduledAt de la respuesta coincide con la fecha enviada', async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const result = await scheduleProduct('prod-001', futureDate);

    const returnedDate = new Date(result.data!.scheduledAt);
    expect(returnedDate.toDateString()).toBe(futureDate.toDateString());
  });

  it('devuelve error 400 cuando la fecha es pasada o inmediata', async () => {
    const pastDate = new Date(Date.now() - 1000); // 1 segundo en el pasado

    const result = await scheduleProduct('prod-001', pastDate);

    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
  });

  it('devuelve error 404 cuando el producto no existe', async () => {
    const futureDate = new Date(Date.now() + 86400_000);

    const result = await scheduleProduct('not-found', futureDate);

    expect(result.error).toBeDefined();
    expect(result.status).toBe(404);
  });

  it('devuelve error cuando el servidor responde 500', async () => {
    server.use(
      http.patch(`${BASE}/products/:id/schedule`, () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    );

    const futureDate = new Date(Date.now() + 86400_000);
    const result = await scheduleProduct('prod-001', futureDate);

    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
  });
});
