import { http, HttpResponse } from 'msw';
import { buildProduct, buildProductList } from '../../factories/product.factory';

const BASE = 'http://localhost:3001/api/v1';

export const productsHandlers = [
  // Listar productos
  http.get(`${BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '10');

    return HttpResponse.json({
      success: true,
      data: buildProductList(limit),
      meta: { page, limit, total: 50, totalPages: 5 },
    });
  }),

  // Obtener producto por ID
  http.get(`${BASE}/products/:id`, ({ params }) => {
    const id = parseInt(params.id as string);

    if (id === 9999) {
      return HttpResponse.json(
        { success: false, message: 'Producto no encontrado' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      success: true,
      data: buildProduct({ id }),
    });
  }),

  // Crear producto
  http.post(`${BASE}/products`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: buildProduct({ name: body.name as string }),
    }, { status: 201 });
  }),

  // Actualizar producto
  http.put(`${BASE}/products/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = parseInt(params.id as string);
    return HttpResponse.json({
      success: true,
      data: buildProduct({ id, ...body as object }),
    });
  }),

  // Eliminar producto
  http.delete(`${BASE}/products/:id`, () => {
    return HttpResponse.json({ success: true, message: 'Producto eliminado' });
  }),

  // Sugerir SKU
  http.post(`${BASE}/products/suggest-sku`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { sku: `SKU-${String(body.name).substring(0, 3).toUpperCase()}-001` },
    });
  }),
];
