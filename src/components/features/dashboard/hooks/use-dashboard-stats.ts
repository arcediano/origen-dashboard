/**
 * @file use-dashboard-stats.ts
 * @description Hook para obtener estadísticas del dashboard
 */

import { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { MOCK_STATS } from '../data';

interface UseDashboardStatsResult {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con llamada real a API
      // const response = await fetch('/api/dashboard/stats');
      // const data = await response.json();
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStats(MOCK_STATS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
