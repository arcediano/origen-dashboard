/**
 * @file orders.handlers.ts
 * @description MSW handlers para los endpoints de pedidos del productor.
 * Usados en tests de integración de la API y los hooks.
 */

import { http, HttpResponse } from 'msw';
import { TEST_API_BASE } from '../api-base';

const BASE = TEST_API_BASE;

// ─── Fixture de pedidos del backend ──────────────────────────────────────────

function makeBackendOrder(overrides: {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}) {
  return {
    id: overrides.id,
    orderNumber: overrides.orderNumber,
    status: overrides.status,
    shippingAddress: {
      fullName: 'Ana García',
      addressLine1: 'Calle Mayor 1',
      city: 'Madrid',
      postalCode: '28001',
      country: 'España',
      phone: '600123456',
      email: 'ana@ejemplo.es',
    },
    paymentMethod: 'card',
    subtotal: overrides.total - 4.95,
    shippingCost: 4.95,
    discountAmount: 0,
    total: overrides.total,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-01',
        productId: 'prod-01',
        productName: 'Queso Manchego',
        productImage: { id: 'img-01', url: '/queso.jpg', alt: 'Queso Manchego' },
        sellerName: 'La Granja',
        unit: 'ud',
        unitPrice: 22.50,
        quantity: 2,
        subtotal: 45.00,
      },
    ],
  };
}

export const mockSellerOrders = [
  makeBackendOrder({ id: 'ord-sel-001', orderNumber: 'ORG-2024-00001', status: 'pending',   total: 49.95 }),
  makeBackendOrder({ id: 'ord-sel-002', orderNumber: 'ORG-2024-00002', status: 'delivered', total: 32.50 }),
  makeBackendOrder({ id: 'ord-sel-003', orderNumber: 'ORG-2024-00003', status: 'shipped',   total: 78.20 }),
];

// ─── Handlers normales ────────────────────────────────────────────────────────

export const ordersHandlers = [
  // GET /orders/seller — lista paginada
  http.get(`${BASE}/orders/seller`, ({ request }) => {
    const url = new URL(request.url);
    const page  = parseInt(url.searchParams.get('page')  ?? '1',  10);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

    const start     = (page - 1) * limit;
    const paginated = mockSellerOrders.slice(start, start + limit);

    return HttpResponse.json({
      items: paginated,
      total: mockSellerOrders.length,
      page,
      limit,
    });
  }),

  // GET /orders/seller/:id — detalle
  http.get(`${BASE}/orders/seller/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = mockSellerOrders.find((o) => o.id === id);

    if (!found) {
      return HttpResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    return HttpResponse.json(found);
  }),

  // PATCH /orders/seller/:id/status — actualizar estado
  http.patch(`${BASE}/orders/seller/:id/status`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const found = mockSellerOrders.find((o) => o.id === id);

    if (!found) {
      return HttpResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as { status?: string };
    return HttpResponse.json({ ...found, status: body.status ?? found.status });
  }),
];

// ─── Override handlers para escenarios específicos ───────────────────────────

export const ordersEmptyHandler = http.get(`${BASE}/orders/seller`, () =>
  HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 }),
);

export const ordersErrorHandler = http.get(`${BASE}/orders/seller`, () =>
  HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
);
