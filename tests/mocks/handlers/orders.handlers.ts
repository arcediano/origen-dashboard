/**
 * @file orders.handlers.ts
 * @description MSW handlers para los endpoints de pedidos del productor.
 * Usados en tests de integración de la API y los hooks.
 */

import { http, HttpResponse } from 'msw';
import { TEST_API_BASE } from '../api-base';

const BASE = TEST_API_BASE;

// ─── Fixture de pedidos del backend ──────────────────────────────────────────

export function makeBackendOrder(overrides: {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}) {
  return {
    id: overrides.id,
    orderNumber: overrides.orderNumber,
    status: overrides.status,
    // El backend (toSellerOrderResponse) nunca incluye email en
    // shippingAddress para el endpoint de vendedor (saneado por privacidad,
    // sanitizeSellerShippingAddress) — el email del comprador llega por
    // contactEmail, aparte.
    contactEmail: 'ana@ejemplo.es',
    shippingAddress: {
      fullName: 'Ana García',
      addressLine1: 'Calle Mayor 1',
      city: 'Madrid',
      postalCode: '28001',
      country: 'España',
      phone: '600123456',
    },
    paymentMethod: 'card',
    subtotal: overrides.total - 4.95,
    shippingCost: 4.95,
    discountAmount: 0,
    total: overrides.total,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    invoice: {
      id: `inv-${overrides.id}`,
      invoiceNumber: `INV-${overrides.orderNumber}`,
      status: overrides.status === 'pending' ? 'draft' : 'issued',
      issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      hasPdf: overrides.status !== 'pending',
    },
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
        commissionRate: 15,
        commissionAmount: 6.75,
      },
    ],
    // timeline real (order_status_history), ordenado createdAt desc — igual
    // que lo devuelve toSellerOrderResponse() en el backend.
    timeline: [
      {
        id: `hist-${overrides.id}-2`,
        status: overrides.status,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `hist-${overrides.id}-1`,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export const mockSellerOrders = [
  makeBackendOrder({ id: 'ord-sel-001', orderNumber: 'ORG-2024-00001', status: 'pending',   total: 49.95 }),
  makeBackendOrder({ id: 'ord-sel-002', orderNumber: 'ORG-2024-00002', status: 'delivered', total: 32.50 }),
  makeBackendOrder({ id: 'ord-sel-003', orderNumber: 'ORG-2024-00003', status: 'shipped',   total: 78.20 }),
];

// ─── Estadísticas agregadas (mismo cálculo que OrdersService.getSellerStats) ──

function computeMockStats() {
  const delivered = mockSellerOrders.filter((o) => o.status === 'delivered');
  const totalRevenue = delivered.reduce((acc, o) => acc + o.total, 0);

  return {
    total: mockSellerOrders.length,
    pending: mockSellerOrders.filter((o) => o.status === 'pending').length,
    processing: mockSellerOrders.filter((o) => o.status === 'processing').length,
    shipped: mockSellerOrders.filter((o) => o.status === 'shipped').length,
    delivered: delivered.length,
    cancelled: mockSellerOrders.filter((o) => o.status === 'cancelled').length,
    refunded: mockSellerOrders.filter((o) => o.status === 'refunded').length,
    totalRevenue,
    averageOrderValue: delivered.length > 0 ? totalRevenue / delivered.length : 0,
    todayOrders: 0,
    todayRevenue: 0,
  };
}

// ─── Cuenta atrás de cobros pendientes (payouts) ──────────────────────────────

export const mockSellerPayouts = [
  {
    orderId: 'ord-sel-002',
    orderNumber: 'ORG-2024-00002',
    productName: 'Queso Manchego',
    quantity: 2,
    deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    transferScheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    netAmountCents: 3825,
  },
];

// ─── Handlers normales ────────────────────────────────────────────────────────

export const ordersHandlers = [
  // GET /orders/seller/stats — estadísticas agregadas del vendedor
  // IMPORTANTE: declarado antes de /orders/seller/:id para que MSW no lo
  // confunda con una petición de detalle (mismo criterio que el backend real).
  http.get(`${BASE}/orders/seller/stats`, () => {
    return HttpResponse.json(computeMockStats());
  }),

  // GET /orders/seller/payouts — cuenta atrás de Transfers pendientes
  // IMPORTANTE: declarado antes de /orders/seller/:id (mismo criterio que
  // stats/invoices, y que el backend real).
  http.get(`${BASE}/orders/seller/payouts`, ({ request }) => {
    const url = new URL(request.url);
    const page  = parseInt(url.searchParams.get('page')  ?? '1',  10);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

    const start     = (page - 1) * limit;
    const paginated = mockSellerPayouts.slice(start, start + limit);

    return HttpResponse.json({
      items: paginated,
      total: mockSellerPayouts.length,
      page,
      limit,
    });
  }),

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

  // GET /orders/seller/:id/invoice — descarga de factura
  http.get(`${BASE}/orders/seller/:id/invoice`, ({ params }) => {
    const { id } = params as { id: string };
    const found = mockSellerOrders.find((o) => o.id === id);

    if (!found) {
      return HttpResponse.json({ message: 'Factura no encontrada' }, { status: 404 });
    }

    return HttpResponse.json({
      invoice: found.invoice,
      downloadUrl: found.invoice?.hasPdf ? 'https://signed.example.com/invoice.pdf' : null,
      expiresIn: 120,
    });
  }),
];

// ─── Override handlers para escenarios específicos ───────────────────────────

export const ordersEmptyHandler = http.get(`${BASE}/orders/seller`, () =>
  HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 }),
);

export const ordersErrorHandler = http.get(`${BASE}/orders/seller`, () =>
  HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
);

export const ordersStatsEmptyHandler = http.get(`${BASE}/orders/seller/stats`, () =>
  HttpResponse.json({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayOrders: 0,
    todayRevenue: 0,
  }),
);

export const ordersStatsErrorHandler = http.get(`${BASE}/orders/seller/stats`, () =>
  HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
);

export const ordersPayoutsEmptyHandler = http.get(`${BASE}/orders/seller/payouts`, () =>
  HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 }),
);

export const ordersPayoutsErrorHandler = http.get(`${BASE}/orders/seller/payouts`, () =>
  HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
);
