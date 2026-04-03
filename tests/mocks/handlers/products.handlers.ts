import { http, HttpResponse } from 'msw';
import { buildProduct, buildProductList } from '../../factories/product.factory';

const BASE = 'http://localhost:3001/api/v1';

// ─── Fixture ApiProduct para my-products ─────────────────────────────────────

function buildApiProduct(overrides: {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  stock: number;
  sales: number;
}) {
  return {
    id: overrides.id,
    producerId: 'producer-test-01',
    name: overrides.name,
    slug: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    shortDescription: `${overrides.name} artesanal de calidad`,
    fullDescription: 'Descripción completa del producto de prueba.',
    categoryId: 'quesos',
    categoryName: 'Quesos',
    subcategoryId: undefined,
    tags: [],
    basePrice: overrides.basePrice,
    comparePrice: undefined,
    sku: overrides.sku,
    stock: overrides.stock,
    reservedStock: 0,
    lowStockThreshold: 5,
    reorderPoint: 3,
    maxStock: undefined,
    trackInventory: true,
    allowBackorders: false,
    mainImage: { key: `s3-key-${overrides.id}`, url: `/${overrides.id}.jpg` },
    gallery: [],
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    publishedAt: '2024-01-01T00:00:00.000Z',
    rating: 4.5,
    reviewCount: 10,
    sales: overrides.sales,
    revenue: overrides.basePrice * overrides.sales,
    views: 100,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

export const mockMyProducts = [
  buildApiProduct({ id: 'top-prod-001', name: 'Queso Curado 6 meses', sku: 'QSC-001', basePrice: 24.50, stock: 23, sales: 45 }),
  buildApiProduct({ id: 'top-prod-002', name: 'Queso Semi 3 meses',   sku: 'QSS-002', basePrice: 19.00, stock: 15, sales: 38 }),
  buildApiProduct({ id: 'top-prod-003', name: 'Queso Fresco de Cabra', sku: 'QFC-003', basePrice: 13.00, stock: 8,  sales: 32 }),
];

export const productsHandlers = [
  // GET /products/producer/my-products — listado paginado del productor
  // Debe declararse ANTES de /products/:id para que el router de MSW no lo confunda
  http.get(`${BASE}/products/producer/my-products`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);
    const page  = parseInt(url.searchParams.get('page')  ?? '1',  10);

    const start     = (page - 1) * limit;
    const paginated = mockMyProducts.slice(start, start + limit);

    return HttpResponse.json({
      data:  paginated,
      total: mockMyProducts.length,
      page,
      limit,
    });
  }),

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
