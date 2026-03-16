/**
 * @file mock-stats.ts
 * @description Datos mock de estadísticas del dashboard
 */

import type { DashboardStats } from '../types';

export const MOCK_STATS: DashboardStats = {
  profileViews: { today: 245, trend: { value: 12.5, isPositive: true } },
  orders: { today: 18, trend: { value: 8.3, isPositive: true } },
  revenue: { today: 1230, trend: { value: 24.8, isPositive: true } },
  rating: { average: 4.9, total: 128 },
};
