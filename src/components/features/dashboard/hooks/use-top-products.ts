/**
 * @file use-top-products.ts
 * @description Hook para obtener los productos más vendidos del productor.
 * Sprint 16: conectado a datos reales via fetchProducts().
 * Sprint 31: confirmado soporte de sort=sales en products-service (campo sales Int en schema).
 */

import { useState, useEffect } from 'react';
import type { TopProduct } from '../types';
import type { Product } from '@/types/product';
import { fetchProducts } from '@/lib/api/products';

interface UseTopProductsResult {
  products: TopProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function mapProductToTopProduct(p: Product): TopProduct {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.basePrice,
    stock: p.stock,
    sales: p.sales ?? 0,
    imageUrl: p.mainImage?.url,
  };
}

export function useTopProducts(limit?: number): UseTopProductsResult {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProducts({
        sortBy: 'sales-desc',
        limit: limit ?? 5,
      });

      if (result.error || !result.data) {
        setError(result.error ?? 'Error al cargar productos');
        return;
      }

      setProducts(result.data.items.map(mapProductToTopProduct));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTopProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchTopProducts,
  };
}
