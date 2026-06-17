/**
 * @file top-products.tsx
 * @description Lista de productos destacados
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { Card, EmptyState } from '@arcediano/ux-library';
import { ProductItem } from '../recent/product-item';
import { itemVariants } from '../layout/dashboard-shell';
import type { TopProduct } from '../../types';

interface TopProductsProps {
  products: TopProduct[];
  isLoading?: boolean;
  className?: string;
}

export function TopProducts({ products, isLoading = false, className }: TopProductsProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`space-y-4 ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle uppercase tracking-wider">
          Productos top
        </h3>
        <Link
          href="/dashboard/products"
          className="text-sm text-origen-pradera hover:text-origen-hoja flex items-center gap-1"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Estado de carga con skeleton
          <Card>
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-origen-pastel rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-origen-pastel rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          </Card>
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductItem key={product.id} {...product} />
          ))
        ) : (
          // Estado vacío
          <Card>
            <EmptyState
              size="sm"
              icon={<Package className="w-6 h-6" />}
              title="Sin productos"
              description="Añade productos para verlos aquí."
            />
          </Card>
        )}
      </div>
    </motion.div>
  );
}
