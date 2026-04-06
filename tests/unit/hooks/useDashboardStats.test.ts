/**
 * @file useDashboardStats.test.ts
 * @description Tests de integración para el hook useDashboardStats.
 * Usa MSW para interceptar las llamadas reales a fetchOrderStats (vía fetchSellerOrders).
 *
 * Fixture de MSW (mockSellerOrders en orders.handlers.ts):
 *   - ord-sel-001: status=pending,   total=49.95, createdAt=2 días atrás
 *   - ord-sel-002: status=delivered, total=32.50, createdAt=2 días atrás
 *   - ord-sel-003: status=shipped,   total=78.20, createdAt=2 días atrás
 *
 * computeStats produce:
 *   total=3, pending=1, totalRevenue=32.50 (solo delivered),
 *   todayOrders=0 (ninguno es de hoy), todayRevenue=0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import {
  ordersEmptyHandler,
  ordersErrorHandler,
} from '../../mocks/handlers/orders.handlers';
import { useDashboardStats } from '@/components/features/dashboard/hooks/use-dashboard-stats';

// next/navigation es requerido por importaciones transitivas de Next.js en happy-dom
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('comienza en estado de carga con stats nulas', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.totalOrders).toBe(0);
    expect(result.current.pendingOrders).toBe(0);
    expect(result.current.totalRevenue).toBe(0);
  });

  it('devuelve stats no nulas tras cargar correctamente', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.stats).not.toBeNull();
  });

  it('calcula totalOrders correctamente desde los pedidos reales', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 3 pedidos en el fixture de MSW
    expect(result.current.totalOrders).toBe(3);
  });

  it('calcula pendingOrders correctamente', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1 pedido en estado "pending" en el fixture (ord-sel-001)
    expect(result.current.pendingOrders).toBe(1);
  });

  it('calcula totalRevenue correctamente (solo pedidos entregados)', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Solo ord-sel-002 (delivered) cuenta: total=32.50
    expect(result.current.totalRevenue).toBe(32.5);
  });

  it('stats.orders.today es 0 cuando no hay pedidos creados hoy', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Todos los pedidos del fixture se crearon hace 2 días
    expect(result.current.stats?.orders.today).toBe(0);
  });

  it('stats.revenue.today es 0 cuando no hay ingresos de hoy', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats?.revenue.today).toBe(0);
  });

  it('stats.profileViews.today es 0 (sin endpoint real aún)', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats?.profileViews.today).toBe(0);
  });

  it('stats.rating inicia en 0 (sin endpoint real aún)', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats?.rating.average).toBe(0);
    expect(result.current.stats?.rating.total).toBe(0);
  });

  it('devuelve stats vacías (ceros) cuando no hay pedidos', async () => {
    server.use(ordersEmptyHandler);
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.totalOrders).toBe(0);
    expect(result.current.pendingOrders).toBe(0);
    expect(result.current.totalRevenue).toBe(0);
    expect(result.current.stats?.orders.today).toBe(0);
    expect(result.current.stats?.revenue.today).toBe(0);
  });

  it('establece error cuando la API falla', async () => {
    server.use(ordersErrorHandler);
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.stats).toBeNull();
    expect(result.current.totalOrders).toBe(0);
  });

  it('refetch recarga los datos correctamente', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const countBefore = result.current.totalOrders;

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalOrders).toBe(countBefore);
    });
  });

  it('se recupera de un error al hacer refetch con la API disponible', async () => {
    server.use(ordersErrorHandler);
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();

    server.resetHandlers();

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalOrders).toBe(3);
    });
  });

  it('expone la función refetch', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(typeof result.current.refetch).toBe('function');
  });
});
