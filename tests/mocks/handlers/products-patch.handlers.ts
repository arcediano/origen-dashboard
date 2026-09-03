/**
 * @file products-patch.handlers.ts
 * @description Handlers MSW para PATCH /products/:id/status.
 *              Se usan exclusivamente en tests de products.api.test.ts (override con server.use).
 */

import { http, HttpResponse } from 'msw';
import { TEST_API_BASE } from '../api-base';

const BASE = TEST_API_BASE;

export const productPatchHandlers = [
  // PATCH /products/:id/status
  http.patch(`${BASE}/products/:id/status`, async ({ params, request }) => {
    const body = await request.json() as { status?: string };
    const { id } = params;

    if (id === 'not-found') {
      return HttpResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }
    if (!body.status) {
      return HttpResponse.json({ message: 'status es obligatorio' }, { status: 400 });
    }

    return HttpResponse.json({ id, status: body.status });
  }),
];
