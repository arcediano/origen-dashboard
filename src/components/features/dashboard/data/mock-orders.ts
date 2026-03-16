/**
 * @file mock-orders.ts
 * @description Datos mock de pedidos
 */

import type { Order, DashboardAlert } from '../types';

export const MOCK_RECENT_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-1234',
    customer: 'Ana García Martínez',
    items: 3,
    total: 89.70,
    status: 'pending',
    date: '12 Mar',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-1233',
    customer: 'Carlos Rodríguez López',
    items: 2,
    total: 45.90,
    status: 'processing',
    date: '11 Mar',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-1232',
    customer: 'María López Sánchez',
    items: 1,
    total: 28.50,
    status: 'shipped',
    date: '10 Mar',
  },
];

export const MOCK_ALERTS: DashboardAlert[] = [
  {
    id: 'alert_1',
    type: 'warning',
    title: 'Stock bajo: Queso Fresco (8 uds)',
    description: 'Revisa el inventario para reabastecer.',
    dismissible: true,
    action: {
      label: 'Ver inventario',
      href: '/dashboard/products/inventory',
    },
  },
  {
    id: 'alert_2',
    type: 'accent',
    title: 'Certificación por renovar',
    description: 'Bienestar Animal expira en 30 días.',
    dismissible: true,
    action: {
      label: 'Gestionar',
      href: '/dashboard/profile/certifications',
    },
  },
];
