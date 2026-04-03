/**
 * @file use-dashboard-stats.ts
 * @description Hook para obtener estadísticas del dashboard.
 * Sprint 16: conectado a datos reales via fetchOrderStats().
 *
 * Campos con endpoint disponible:
 *   - orders.today    → fetchOrderStats() → OrderStats.todayOrders
 *   - revenue.today   → fetchOrderStats() → OrderStats.todayRevenue
 *   - totalOrders     → OrderStats.total
 *   - pendingOrders   → OrderStats.pending
 *   - totalRevenue    → OrderStats.totalRevenue
 *
 * Campos sin endpoint real aún (devuelven 0):
 *   - profileViews  → TODO: conectar a /api/v1/producers/me/profile-views cuando esté disponible
 *   - rating        → TODO: conectar a reviews-service cuando esté disponible
 */

import { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { fetchOrderStats } from '@/lib/api/orders';

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
      const result = await fetchOrderStats();

      if (result.error || !result.data) {
        setError(result.error ?? 'Error al cargar estadísticas');
        return;
      }

      const orderStats = result.data;

      // Exponer campos raw para testabilidad directa
      setTotalOrders(orderStats.total);
      setPendingOrders(orderStats.pending);
      setTotalRevenue(orderStats.totalRevenue);

      setStats({
        // TODO: conectar a /api/v1/producers/me/profile-views cuando esté disponible
        profileViews: { today: 0 },
        orders: {
          today: orderStats.todayOrders,
        },
        revenue: {
          today: orderStats.todayRevenue,
        },
        // TODO: conectar a reviews-service cuando esté disponible el endpoint de ratings
        rating: { average: 0, total: 0 },
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
