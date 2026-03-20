/**
 * @file use-top-products.ts
 * @description Hook para obtener productos top
 */

import { useState, useEffect } from 'react';
import type { TopProduct } from '../types';
import { MOCK_PRODUCTS as MOCK_TOP_PRODUCTS } from '../data';

interface UseTopProductsResult {
  products: TopProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTopProducts(limit?: number): UseTopProductsResult {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con llamada real a API
      // const response = await fetch(`/api/dashboard/products/top?limit=${limit}`);
      // const data = await response.json();
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const data = limit ? MOCK_TOP_PRODUCTS.slice(0, limit) : MOCK_TOP_PRODUCTS;
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [limit]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
