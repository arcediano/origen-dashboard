import { useState } from 'react';
import type { DashboardStats, Order, TopProduct } from '../types';
import { MOCK_STATS, MOCK_ORDERS, MOCK_PRODUCTS } from '../data';

interface UseMockDataResult {
  isMockMode: boolean;
  toggleMockMode: () => void;
  getMockStats: () => DashboardStats;
  getMockOrders: (limit?: number) => Order[];
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

  const getMockOrders = (limit?: number): Order[] => 
    isMockMode 
      ? limit ? MOCK_ORDERS.slice(0, limit) : MOCK_ORDERS
      : [];

  const getMockProducts = (limit?: number): TopProduct[] =>
    isMockMode
      ? limit ? MOCK_PRODUCTS.slice(0, limit) : MOCK_PRODUCTS
      : [];

  return {
    isMockMode,
    toggleMockMode,
    getMockStats,
    getMockOrders,
    getMockProducts
  };
}