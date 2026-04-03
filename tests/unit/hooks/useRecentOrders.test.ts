/**
 * @file useRecentOrders.test.ts
 * @description Tests de integración para el hook useRecentOrders.
 * Usa MSW para interceptar las llamadas reales a fetchSellerOrders.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  ordersEmptyHandler,
  ordersErrorHandler,
} from '../../mocks/handlers/orders.handlers';
import { useRecentOrders } from '@/components/features/dashboard/hooks/use-recent-orders';

// next/navigation no es usado por useRecentOrders directamente, pero lo requieren
// importaciones transitivas de Next.js en el entorno happy-dom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

describe('useRecentOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('comienza en estado de carga con array vacío', () => {
    const { result } = renderHook(() => useRecentOrders());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.orders).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('devuelve los pedidos mapeados desde la API real', async () => {
    const { result } = renderHook(() => useRecentOrders(3));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.orders.length).toBeGreaterThan(0);
  });

  it('mapea los campos del pedido al formato del dashboard', async () => {
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const first = result.current.orders[0];
    expect(first.id).toBe('ord-sel-001');
    expect(first.orderNumber).toBe('ORG-2024-00001');
    expect(first.customer).toBe('Ana García');
    expect(typeof first.items).toBe('number');
    expect(first.items).toBeGreaterThanOrEqual(1);
    expect(typeof first.total).toBe('number');
    expect(first.status).toBe('pending');
    expect(typeof first.date).toBe('string');
    expect(first.date.length).toBeGreaterThan(0);
  });

  it('respeta el límite pasado como argumento', async () => {
    const { result } = renderHook(() => useRecentOrders(1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // MSW pagina: limit=1 → 1 orden devuelta
    expect(result.current.orders.length).toBeLessThanOrEqual(1);
  });

  it('los status de los pedidos son valores válidos del tipo dashboard', async () => {
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const order of result.current.orders) {
      expect(validStatuses).toContain(order.status);
    }
  });

  it('muestra lista vacía cuando la API no devuelve pedidos', async () => {
    server.use(ordersEmptyHandler);
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.orders).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('establece error cuando la API falla', async () => {
    server.use(ordersErrorHandler);
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.orders).toHaveLength(0);
  });

  it('refetch vuelve a cargar los pedidos correctamente', async () => {
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const countBefore = result.current.orders.length;

    await result.current.refetch();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.orders.length).toBe(countBefore);
    expect(result.current.error).toBeNull();
  });

  it('se recupera tras un error al hacer refetch con la API disponible', async () => {
    // Primera carga con error
    server.use(ordersErrorHandler);
    const { result } = renderHook(() => useRecentOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();

    // La API vuelve a funcionar: resetHandlers restaura los handlers originales
    server.resetHandlers();

    await result.current.refetch();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.orders.length).toBeGreaterThan(0);
  });

  it('expone la función refetch', () => {
    const { result } = renderHook(() => useRecentOrders());
    expect(typeof result.current.refetch).toBe('function');
  });
});
