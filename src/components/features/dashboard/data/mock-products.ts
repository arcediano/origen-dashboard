/**
 * @file mock-products.ts
 * @description Datos mock de productos
 */

import type { TopProduct } from '../types';

export const MOCK_TOP_PRODUCTS: TopProduct[] = [
  {
    id: 'prod_1',
    name: 'Queso Curado 6 meses',
    sku: 'QSC-001',
    price: 24.50,
    stock: 23,
    sales: 45,
    trend: 15,
  },
  {
    id: 'prod_2',
    name: 'Queso Semi 3 meses',
    sku: 'QSS-002',
    price: 19.00,
    stock: 15,
    sales: 38,
    trend: 8,
  },
  {
    id: 'prod_3',
    name: 'Queso Fresco de Cabra',
    sku: 'QFC-003',
    price: 13.00,
    stock: 8,
    sales: 32,
    trend: 22,
  },
];
