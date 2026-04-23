/**
 * @file use-dashboard-stats.ts
 * @description Hook para obtener estadísticas del dashboard.
 * Sprint 16: conectado a datos reales via fetchOrderStats().
 * Sprint 31: rating conectado a fetchProductStats() → getProducerStats() en products-service.
 *            Agrega reseñas aprobadas por producerId directamente en la BD (Review.producerId).
 *
 * Campos conectados:
 *   - orders.today    → fetchOrderStats() → OrderStats.todayOrders
 *   - revenue.today   → fetchOrderStats() → OrderStats.todayRevenue
 *   - totalOrders     → OrderStats.total
 *   - pendingOrders   → OrderStats.pending
 *   - totalRevenue    → OrderStats.totalRevenue
 *   - rating          → fetchProductStats() → ProductStats.rating.{average, total}
 *
 * Campos sin endpoint real aún (devuelven 0):
 *   - profileViews  → TODO: conectar a /api/v1/producers/me/profile-views cuando esté disponible
 */

import { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { fetchOrderStats } from '@/lib/api/orders';
import { fetchProductStats } from '@/lib/api/products';

interface UseDashboardStatsResult {
  stats: DashboardStats | null;
  /** Total de pedidos del productor (todos los estados) */
  totalOrders: number;
  /** Pedidos en estado "pending" */
  pendingOrders: number;
  /** Ingresos totales de pedidos entregados */
  totalRevenue: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [orderResult, productResult] = await Promise.all([
        fetchOrderStats(),
        fetchProductStats(),
      ]);

      if (orderResult.error || !orderResult.data) {
        setError(orderResult.error ?? 'Error al cargar estadísticas');
        return;
      }

      const orderStats = orderResult.data;

      // Exponer campos raw para testabilidad directa
      setTotalOrders(orderStats.total);
      setPendingOrders(orderStats.pending);
      setTotalRevenue(orderStats.totalRevenue);

      const ratingAverage = productResult.data?.rating?.average ?? 0;
      const ratingTotal   = productResult.data?.rating?.total   ?? 0;

      setStats({
        // TODO: conectar a /api/v1/producers/me/profile-views cuando esté disponible
        profileViews: { today: 0 },
        orders: {
          today: orderStats.todayOrders,
        },
        revenue: {
          today: orderStats.todayRevenue,
        },
        rating: { average: ratingAverage, total: ratingTotal },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    totalOrders,
    pendingOrders,
    totalRevenue,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
