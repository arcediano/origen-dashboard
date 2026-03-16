import type { DashboardStats, Order, TopProduct, Producer, DashboardAlert } from './types';
import { MOCK_PRODUCER } from './data/mock-producer';
import { MOCK_ALERTS } from './data/mock-orders';

export const MOCK_STATS: DashboardStats = {
  profileViews: { today: 42, trend: { value: 15, isPositive: true } },
  orders: { today: 5, trend: { value: 10, isPositive: true } },
  revenue: { today: 249, trend: { value: 20, isPositive: true } },
  rating: { average: 4.5, total: 24 }
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_1',
    date: new Date(),
    status: 'completed',
    total: 49.99,
    items: 3,
    customer: 'Cliente Ejemplo'
  },
  // ...otros pedidos mock
];

export const MOCK_PRODUCTS: TopProduct[] = [
  {
    id: 'prod_1',
    name: 'Producto Destacado',
    sales: 15,
    revenue: 199.99,
    rating: 4.8
  },
  // ...otros productos mock
];

export { MOCK_PRODUCER, MOCK_ALERTS };