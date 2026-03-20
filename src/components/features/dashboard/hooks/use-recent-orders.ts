/**
 * @file use-recent-orders.ts
 * @description Hook para obtener pedidos recientes
 */

import { useState, useEffect } from 'react';
import type { Order } from '../types';
import { MOCK_ORDERS as MOCK_RECENT_ORDERS } from '../data';

interface UseRecentOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentOrders(limit?: number): UseRecentOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con llamada real a API
      // const response = await fetch(`/api/dashboard/orders/recent?limit=${limit}`);
      // const data = await response.json();
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const data = limit ? MOCK_RECENT_ORDERS.slice(0, limit) : MOCK_RECENT_ORDERS;
      setOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [limit]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
