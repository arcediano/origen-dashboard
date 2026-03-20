import type { DashboardStats, Order, TopProduct } from './types';
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
    orderNumber: 'ORD-2024-0001',
    date: '12 Mar',
    status: 'pending',
    total: 49.99,
    items: 3,
    customer: 'Cliente Ejemplo'
  },
];

export const MOCK_PRODUCTS: TopProduct[] = [
  {
    id: 'prod_1',
    name: 'Producto Destacado',
    sku: 'PROD-001',
    price: 19.99,
    stock: 10,
    sales: 15,
    trend: 5
  },
];

export { MOCK_PRODUCER, MOCK_ALERTS };
