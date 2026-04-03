import { useState } from 'react';
import type { DashboardStats, TopProduct } from '../types';
import { MOCK_STATS, MOCK_PRODUCTS } from '../data';

interface UseMockDataResult {
  isMockMode: boolean;
  toggleMockMode: () => void;
  getMockStats: () => DashboardStats;
  getMockProducts: (limit?: number) => TopProduct[];
}

export function useMockData(): UseMockDataResult {
  const [isMockMode, setIsMockMode] = useState(false);

  const toggleMockMode = () => setIsMockMode(!isMockMode);

  const getMockStats = (): DashboardStats => ({
    ...MOCK_STATS,
    profileViews: {
      today: isMockMode ? 42 : 0,
      trend: { value: isMockMode ? 15 : 0, isPositive: isMockMode }
    },
    orders: {
      today: isMockMode ? 5 : 0,
      trend: { value: isMockMode ? 10 : 0, isPositive: isMockMode }
    },
    revenue: {
      today: isMockMode ? 249 : 0,
      trend: { value: isMockMode ? 20 : 0, isPositive: isMockMode }
    }
  });

  const getMockProducts = (limit?: number): TopProduct[] =>
    isMockMode
      ? limit ? MOCK_PRODUCTS.slice(0, limit) : MOCK_PRODUCTS
      : [];

  return {
    isMockMode,
    toggleMockMode,
    getMockStats,
    getMockProducts
  };
}
