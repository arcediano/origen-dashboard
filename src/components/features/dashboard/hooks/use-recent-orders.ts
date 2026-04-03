/**
 * @file use-recent-orders.ts
 * @description Hook para obtener los pedidos recientes del productor desde la API real.
 * Sprint 16: reemplaza el mock en-memoria por fetchSellerOrders real.
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order } from '../types';
import { fetchSellerOrders } from '@/lib/api/orders';

interface UseRecentOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Mapea el status completo de la API al OrderStatus reducido del dashboard.
 * 'refunded' no existe en el tipo dashboard → se trata como 'cancelled'.
 */
function mapStatus(status: string): Order['status'] {
  const valid: Order['status'][] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  return valid.includes(status as Order['status'])
    ? (status as Order['status'])
    : 'cancelled';
}

export function useRecentOrders(limit?: number): UseRecentOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchSellerOrders({ limit: limit ?? 5 });

      if (res.error || !res.data) {
        setError(res.error ?? 'Error al cargar pedidos');
      } else {
        setOrders(
          res.data.orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.customerName,
            items: o.items.length,
            total: o.total,
            status: mapStatus(o.status),
            date: format(o.createdAt, 'dd MMM', { locale: es }),
          })),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar pedidos',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return {
    orders,
    isLoading,
    error,
    refetch: loadOrders,
  };
}
