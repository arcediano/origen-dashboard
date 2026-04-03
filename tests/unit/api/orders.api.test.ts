/**
 * Tests unitarios/integración para la API de pedidos (src/lib/api/orders.ts).
 * Sprint 16: reemplaza los tests basados en mocks en-memoria por tests con MSW.
 *
 * MSW intercepta las llamadas reales a gatewayClient y devuelve respuestas
 * controladas — idéntico al comportamiento en producción.
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  fetchSellerOrders,
  fetchSellerOrderById,
  fetchOrders,
  fetchOrderById,
  updateOrderStatus,
  fetchOrderStats,
} from '@/lib/api/orders';
import {
  mockSellerOrders,
  ordersEmptyHandler,
  ordersErrorHandler,
} from '../../mocks/handlers/orders.handlers';

const BASE = 'http://localhost:3001/api/v1';

// ── fetchSellerOrders ─────────────────────────────────────────────────────────

describe('fetchSellerOrders', () => {
  it('devuelve status 200 y la lista de pedidos', async () => {
    const result = await fetchSellerOrders();
    expect(result.status).toBe(200);
    expect(result.data?.orders).toBeDefined();
    expect(result.data?.orders.length).toBeGreaterThan(0);
  });

  it('mapea id y orderNumber correctamente', async () => {
    const result = await fetchSellerOrders();
    const first = result.data!.orders[0];
    expect(first.id).toBe('ord-sel-001');
    expect(first.orderNumber).toBe('ORG-2024-00001');
  });

  it('mapea customerName desde shippingAddress.fullName', async () => {
    const result = await fetchSellerOrders();
    expect(result.data!.orders[0].customerName).toBe('Ana García');
  });

  it('mapea customerEmail desde shippingAddress.email', async () => {
    const result = await fetchSellerOrders();
    expect(result.data!.orders[0].customerEmail).toBe('ana@ejemplo.es');
  });

  it('mapea item.totalPrice desde item.subtotal del backend', async () => {
    const result = await fetchSellerOrders();
    const item = result.data!.orders[0].items[0];
    expect(item.productName).toBe('Queso Manchego');
    expect(item.totalPrice).toBe(45.00);
    expect(item.quantity).toBe(2);
  });

  it('incluye metadatos de paginación', async () => {
    const result = await fetchSellerOrders({ page: 1, limit: 2 });
    expect(result.data?.total).toBe(mockSellerOrders.length);
    expect(result.data?.page).toBe(1);
    expect(result.data?.limit).toBe(2);
  });

  it('pagina correctamente: page=2, limit=2 → 1 pedido', async () => {
    const result = await fetchSellerOrders({ page: 2, limit: 2 });
    expect(result.data!.orders).toHaveLength(1);
  });

  it('devuelve error cuando la API responde 500', async () => {
    server.use(ordersErrorHandler);
    const result = await fetchSellerOrders();
    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
  });

  it('devuelve lista vacía cuando la API no devuelve pedidos', async () => {
    server.use(ordersEmptyHandler);
    const result = await fetchSellerOrders();
    expect(result.status).toBe(200);
    expect(result.data?.orders).toHaveLength(0);
    expect(result.data?.total).toBe(0);
  });

  it('el payment.method se mapea desde paymentMethod del backend', async () => {
    const result = await fetchSellerOrders();
    expect(result.data!.orders[0].payment.method).toBe('card');
  });

  it('el shipping.address.city se mapea desde shippingAddress.city', async () => {
    const result = await fetchSellerOrders();
    expect(result.data!.orders[0].shipping.address.city).toBe('Madrid');
  });

  it('timeline es un array vacío (el backend no lo expone al vendedor)', async () => {
    const result = await fetchSellerOrders();
    expect(result.data!.orders[0].timeline).toEqual([]);
  });
});

// ── fetchSellerOrderById ──────────────────────────────────────────────────────

describe('fetchSellerOrderById', () => {
  it('devuelve el pedido correcto por ID', async () => {
    const result = await fetchSellerOrderById('ord-sel-001');
    expect(result.status).toBe(200);
    expect(result.data?.id).toBe('ord-sel-001');
    expect(result.data?.orderNumber).toBe('ORG-2024-00001');
  });

  it('devuelve el pedido ord-sel-002 correctamente', async () => {
    const result = await fetchSellerOrderById('ord-sel-002');
    expect(result.status).toBe(200);
    expect(result.data?.status).toBe('delivered');
  });

  it('devuelve status 404 para ID inexistente', async () => {
    const result = await fetchSellerOrderById('no-existe');
    expect(result.status).toBe(404);
    expect(result.error).toBe('Pedido no encontrado');
  });

  it('el pedido incluye sus items', async () => {
    const result = await fetchSellerOrderById('ord-sel-001');
    expect(result.data?.items).toBeDefined();
    expect(result.data!.items.length).toBeGreaterThan(0);
  });

  it('el pedido incluye información de pago mapeada', async () => {
    const result = await fetchSellerOrderById('ord-sel-001');
    expect(result.data?.payment).toBeDefined();
    expect(result.data?.payment.method).toBe('card');
  });

  it('el pedido incluye dirección de envío completa', async () => {
    const result = await fetchSellerOrderById('ord-sel-001');
    expect(result.data?.shipping.address).toBeDefined();
    expect(result.data?.shipping.address.city).toBe('Madrid');
    expect(result.data?.shipping.address.country).toBe('España');
  });

  it('los items tienen los campos requeridos', async () => {
    const result = await fetchSellerOrderById('ord-sel-001');
    const item = result.data!.items[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      productId: expect.any(String),
      productName: expect.any(String),
      quantity: expect.any(Number),
      unitPrice: expect.any(Number),
      totalPrice: expect.any(Number),
    });
  });

  it('devuelve error 403 como acceso denegado', async () => {
    server.use(
      http.get(`${BASE}/orders/seller/:id`, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 }),
      ),
    );
    const result = await fetchSellerOrderById('ord-sel-001');
    expect(result.status).toBe(403);
    expect(result.error).toContain('Acceso denegado');
  });
});

// ── fetchOrders (wrapper) ─────────────────────────────────────────────────────

describe('fetchOrders', () => {
  it('delega a fetchSellerOrders y devuelve OrdersResponse', async () => {
    const result = await fetchOrders();
    expect(result.status).toBe(200);
    expect(result.data?.orders).toBeDefined();
    expect(result.data?.stats).toBeDefined();
    expect(result.data?.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('incluye metadatos de paginación', async () => {
    const result = await fetchOrders({ page: 1, limit: 2 });
    expect(result.data?.total).toBe(mockSellerOrders.length);
    expect(result.data?.page).toBe(1);
    expect(result.data?.limit).toBe(2);
  });

  it('calcula totalPages correctamente (3 pedidos / 2 por página = 2 páginas)', async () => {
    const result = await fetchOrders({ limit: 2 });
    expect(result.data?.totalPages).toBe(2);
  });

  it('incluye estadísticas computadas con todos los campos', async () => {
    const result = await fetchOrders();
    const stats = result.data!.stats;
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.pending).toBe('number');
    expect(typeof stats.delivered).toBe('number');
    expect(typeof stats.totalRevenue).toBe('number');
    expect(typeof stats.averageOrderValue).toBe('number');
  });

  it('propaga el error de fetchSellerOrders', async () => {
    server.use(ordersErrorHandler);
    const result = await fetchOrders();
    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
  });
});

// ── fetchOrderById (wrapper) ──────────────────────────────────────────────────

describe('fetchOrderById', () => {
  it('delega a fetchSellerOrderById correctamente', async () => {
    const result = await fetchOrderById('ord-sel-002');
    expect(result.status).toBe(200);
    expect(result.data?.id).toBe('ord-sel-002');
  });

  it('propaga el error 404 de fetchSellerOrderById', async () => {
    const result = await fetchOrderById('no-existe');
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });
});

// ── updateOrderStatus ─────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  it('actualiza el estado del pedido correctamente', async () => {
    const result = await updateOrderStatus('ord-sel-001', 'processing');
    expect(result.status).toBe(200);
    expect(result.data?.status).toBe('processing');
  });

  it('devuelve status 404 para pedido inexistente', async () => {
    const result = await updateOrderStatus('no-existe', 'delivered');
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('devuelve error cuando la API responde 500', async () => {
    server.use(
      http.patch(`${BASE}/orders/seller/:id/status`, () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    );
    const result = await updateOrderStatus('ord-sel-001', 'shipped');
    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
  });
});

// ── fetchOrderStats ───────────────────────────────────────────────────────────

describe('fetchOrderStats', () => {
  it('devuelve status 200 con estadísticas', async () => {
    const result = await fetchOrderStats();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
  });

  it('contiene todos los campos de estadísticas', async () => {
    const result = await fetchOrderStats();
    expect(result.data).toMatchObject({
      total: expect.any(Number),
      pending: expect.any(Number),
      processing: expect.any(Number),
      shipped: expect.any(Number),
      delivered: expect.any(Number),
      cancelled: expect.any(Number),
      refunded: expect.any(Number),
      totalRevenue: expect.any(Number),
      averageOrderValue: expect.any(Number),
      todayOrders: expect.any(Number),
      todayRevenue: expect.any(Number),
    });
  });

  it('totalRevenue solo cuenta pedidos en estado "delivered"', async () => {
    const result = await fetchOrderStats();
    // ord-sel-002 es 'delivered' con total 32.50
    expect(result.data!.totalRevenue).toBeCloseTo(32.50, 1);
  });

  it('averageOrderValue es correcto para pedidos entregados', async () => {
    const result = await fetchOrderStats();
    const { totalRevenue, delivered, averageOrderValue } = result.data!;
    if (delivered > 0) {
      expect(averageOrderValue).toBeCloseTo(totalRevenue / delivered, 2);
    } else {
      expect(averageOrderValue).toBe(0);
    }
  });

  it('devuelve error cuando la API responde 500', async () => {
    server.use(ordersErrorHandler);
    const result = await fetchOrderStats();
    expect(result.error).toBeDefined();
  });
});
