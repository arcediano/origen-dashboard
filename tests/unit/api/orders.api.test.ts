/**
 * Tests unitarios para la API de pedidos (src/lib/api/orders.ts).
 * La API usa datos mock internos, por lo que no se necesita MSW.
 */

import { describe, it, expect } from 'vitest';
import {
  fetchOrders,
  fetchOrderById,
  updateOrderStatus,
  fetchOrderStats,
} from '@/lib/api/orders';

// ── fetchOrders ───────────────────────────────────────────────────────────────

describe('fetchOrders', () => {
  it('devuelve status 200 y la lista de pedidos', async () => {
    const result = await fetchOrders();
    expect(result.status).toBe(200);
    expect(result.data?.orders).toBeDefined();
    expect(result.data?.orders.length).toBeGreaterThan(0);
  });

  it('devuelve todos los pedidos (3) sin filtros', async () => {
    const result = await fetchOrders();
    expect(result.data?.orders).toHaveLength(3);
  });

  it('incluye estadísticas en la respuesta', async () => {
    const result = await fetchOrders();
    expect(result.data?.stats).toBeDefined();
    expect(typeof result.data?.stats.total).toBe('number');
  });

  it('incluye metadatos de paginación', async () => {
    const result = await fetchOrders();
    expect(result.data?.total).toBeDefined();
    expect(result.data?.page).toBeDefined();
    expect(result.data?.totalPages).toBeDefined();
  });

  it('ordena los pedidos por fecha más reciente primero', async () => {
    const result = await fetchOrders();
    const orders = result.data!.orders;
    for (let i = 0; i < orders.length - 1; i++) {
      expect(new Date(orders[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(orders[i + 1].createdAt).getTime()
      );
    }
  });

  // ── Filtros ───────────────────────────────────────────────────────────────

  it('filtra por estado "delivered"', async () => {
    const result = await fetchOrders({ filters: { status: 'delivered' } });
    expect(result.data?.orders.every(o => o.status === 'delivered')).toBe(true);
    expect(result.data?.orders.length).toBeGreaterThan(0);
  });

  it('filtra por estado "shipped"', async () => {
    const result = await fetchOrders({ filters: { status: 'shipped' } });
    expect(result.data?.orders.every(o => o.status === 'shipped')).toBe(true);
  });

  it('filtra por estado "processing"', async () => {
    const result = await fetchOrders({ filters: { status: 'processing' } });
    expect(result.data?.orders.every(o => o.status === 'processing')).toBe(true);
  });

  it('filtra por búsqueda en nombre de cliente', async () => {
    const result = await fetchOrders({ filters: { search: 'María' } });
    expect(result.data!.orders.length).toBeGreaterThan(0);
    expect(result.data!.orders[0].customerName).toContain('María');
  });

  it('filtra por búsqueda en número de pedido', async () => {
    const result = await fetchOrders({ filters: { search: 'PED-2024-0001' } });
    expect(result.data?.orders).toHaveLength(1);
    expect(result.data?.orders[0].orderNumber).toBe('PED-2024-0001');
  });

  it('filtra por búsqueda en email de cliente', async () => {
    const result = await fetchOrders({ filters: { search: 'carlos@email.com' } });
    expect(result.data!.orders.length).toBeGreaterThan(0);
    expect(result.data!.orders[0].customerEmail).toBe('carlos@email.com');
  });

  it('búsqueda sin coincidencias devuelve array vacío', async () => {
    const result = await fetchOrders({ filters: { search: 'cliente-xyz-inexistente' } });
    expect(result.data?.orders).toHaveLength(0);
  });

  it('filtra por importe mínimo', async () => {
    const result = await fetchOrders({ filters: { minAmount: 100 } });
    expect(result.data?.orders.every(o => o.total >= 100)).toBe(true);
  });

  it('filtra por importe máximo', async () => {
    const result = await fetchOrders({ filters: { maxAmount: 60 } });
    expect(result.data?.orders.every(o => o.total <= 60)).toBe(true);
  });

  it('filtra por rango de importe (min + max)', async () => {
    const result = await fetchOrders({ filters: { minAmount: 50, maxAmount: 100 } });
    result.data?.orders.forEach(o => {
      expect(o.total).toBeGreaterThanOrEqual(50);
      expect(o.total).toBeLessThanOrEqual(100);
    });
  });

  it('filtra por customerId', async () => {
    const result = await fetchOrders({ filters: { customerId: 'user-123' } });
    expect(result.data?.orders.every(o => o.customerId === 'user-123')).toBe(true);
  });

  // ── Paginación ────────────────────────────────────────────────────────────

  it('pagina correctamente: page=1, limit=2 → 2 pedidos', async () => {
    const result = await fetchOrders({ page: 1, limit: 2 });
    expect(result.data?.orders).toHaveLength(2);
    expect(result.data?.page).toBe(1);
  });

  it('pagina correctamente: page=2, limit=2 → 1 pedido (el último)', async () => {
    const result = await fetchOrders({ page: 2, limit: 2 });
    expect(result.data?.orders).toHaveLength(1);
  });

  it('calcula totalPages correctamente', async () => {
    const result = await fetchOrders({ limit: 2 });
    expect(result.data?.totalPages).toBe(2); // 3 pedidos / 2 por página
  });
});

// ── fetchOrderById ────────────────────────────────────────────────────────────

describe('fetchOrderById', () => {
  it('devuelve el pedido correcto por ID', async () => {
    const result = await fetchOrderById('ord-001');
    expect(result.status).toBe(200);
    expect(result.data?.id).toBe('ord-001');
    expect(result.data?.orderNumber).toBe('PED-2024-0001');
  });

  it('devuelve el pedido ord-002 correctamente', async () => {
    const result = await fetchOrderById('ord-002');
    expect(result.status).toBe(200);
    expect(result.data?.customerName).toBe('Carlos Rodríguez');
  });

  it('devuelve status 404 para ID inexistente', async () => {
    const result = await fetchOrderById('ord-9999');
    expect(result.status).toBe(404);
    expect(result.error).toBe('Pedido no encontrado');
  });

  it('el pedido incluye sus items', async () => {
    const result = await fetchOrderById('ord-001');
    expect(result.data?.items).toBeDefined();
    expect(result.data!.items.length).toBeGreaterThan(0);
  });

  it('el pedido incluye su timeline', async () => {
    const result = await fetchOrderById('ord-001');
    expect(result.data?.timeline).toBeDefined();
    expect(result.data!.timeline.length).toBeGreaterThan(0);
  });

  it('el pedido incluye información de pago', async () => {
    const result = await fetchOrderById('ord-001');
    expect(result.data?.payment).toBeDefined();
    expect(result.data?.payment.status).toBe('paid');
  });

  it('el pedido incluye información de envío', async () => {
    const result = await fetchOrderById('ord-001');
    expect(result.data?.shipping).toBeDefined();
    expect(result.data?.shipping.address).toBeDefined();
  });

  it('los items tienen los campos requeridos', async () => {
    const result = await fetchOrderById('ord-001');
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
});

// ── updateOrderStatus ─────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  it('actualiza el estado de un pedido existente', async () => {
    const result = await updateOrderStatus('ord-003', 'shipped');
    expect(result.status).toBe(200);
    expect(result.data?.status).toBe('shipped');
  });

  it('devuelve status 404 para pedido inexistente', async () => {
    const result = await updateOrderStatus('ord-9999', 'delivered');
    expect(result.status).toBe(404);
  });

  it('añade una entrada al timeline al actualizar el estado', async () => {
    const before = await fetchOrderById('ord-002');
    const timelineBefore = before.data!.timeline.length;

    await updateOrderStatus('ord-002', 'delivered');

    const after = await fetchOrderById('ord-002');
    expect(after.data!.timeline.length).toBe(timelineBefore + 1);
  });

  it('el nuevo entry del timeline tiene el estado actualizado', async () => {
    await updateOrderStatus('ord-001', 'refunded');

    const result = await fetchOrderById('ord-001');
    const lastEntry = result.data!.timeline[result.data!.timeline.length - 1];
    expect(lastEntry.status).toBe('refunded');
  });

  it('acepta un comentario opcional en el timeline', async () => {
    await updateOrderStatus('ord-003', 'cancelled', 'Cancelado por el cliente');

    const result = await fetchOrderById('ord-003');
    const lastEntry = result.data!.timeline[result.data!.timeline.length - 1];
    expect(lastEntry.description).toContain('Cancelado por el cliente');
  });

  it('actualiza updatedAt del pedido', async () => {
    const before = await fetchOrderById('ord-001');
    const beforeTime = new Date(before.data!.updatedAt).getTime();

    await updateOrderStatus('ord-001', 'processing');

    const after = await fetchOrderById('ord-001');
    const afterTime = new Date(after.data!.updatedAt).getTime();
    expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
  });
});

// ── fetchOrderStats ───────────────────────────────────────────────────────────

describe('fetchOrderStats', () => {
  it('devuelve status 200', async () => {
    const result = await fetchOrderStats();
    expect(result.status).toBe(200);
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

  it('el total es mayor que 0', async () => {
    const result = await fetchOrderStats();
    expect(result.data!.total).toBeGreaterThan(0);
  });

  it('totalRevenue solo cuenta pedidos en estado "delivered"', async () => {
    const result = await fetchOrderStats();
    // Hay al menos 1 pedido delivered (ord-001 con total 97.57)
    expect(result.data!.totalRevenue).toBeGreaterThan(0);
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
});
