/**
 * @file products-update-status.api.test.ts
 * @description Regresión: updateProduct(id, { status }) debe enviar el campo
 * `status` en el cuerpo del PUT /products/:id para las transiciones que un
 * productor puede iniciar (incluida 'active' -- reactivación directa de un
 * producto pausado sin cambios sin revisar, botón "Volver a activar" de
 * StatusCard). El allowlist `PRODUCER_PUT_ALLOWED_STATUSES` de
 * `partialProductToApiBody()` (src/lib/api/products.ts) omitía 'active',
 * así que el campo se descartaba antes de llegar a la red y el botón no
 * hacía nada -- el backend (origen-master-microservices) ya soporta esta
 * transición (ProductsService.update(), con su propia validación de
 * hasUnreviewedChanges), el bug era puramente de este allowlist.
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { updateProduct } from '@/lib/api/products';
import { buildProduct } from '../../factories/product.factory';
import { TEST_API_BASE } from '../../mocks/api-base';

const BASE = TEST_API_BASE;

describe('updateProduct() — campo status en el body del PUT', () => {
  it('incluye status: "ACTIVE" al reactivar un producto pausado', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.put(`${BASE}/products/:id`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: buildProduct({ id: 1 }) });
      }),
    );

    await updateProduct('1', { status: 'active' });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.status).toBe('ACTIVE');
  });

  it('incluye status para el resto de transiciones que ya funcionaban (draft, pending_approval, inactive)', async () => {
    const cases: Array<['draft' | 'pending_approval' | 'inactive', string]> = [
      ['draft', 'DRAFT'],
      ['pending_approval', 'PENDING_APPROVAL'],
      ['inactive', 'INACTIVE'],
    ];

    for (const [frontendStatus, apiStatus] of cases) {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.put(`${BASE}/products/:id`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ success: true, data: buildProduct({ id: 1 }) });
        }),
      );

      await updateProduct('1', { status: frontendStatus });

      expect(capturedBody!.status).toBe(apiStatus);
    }
  });

  it('no envía status cuando la actualización no lo incluye (p. ej. edición normal de un campo)', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.put(`${BASE}/products/:id`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: buildProduct({ id: 1 }) });
      }),
    );

    await updateProduct('1', { name: 'Nuevo nombre' });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.status).toBeUndefined();
  });

  it('nunca envía visibility (toggle manual retirado, redundante con status -- decisión del humano 2026-09-03)', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.put(`${BASE}/products/:id`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: buildProduct({ id: 1 }) });
      }),
    );

    await updateProduct('1', { status: 'active', name: 'Nuevo nombre' });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody).not.toHaveProperty('visibility');
  });
});
