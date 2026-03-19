/**
 * @file top-products.tsx
 * @description Lista de productos destacados
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { SectionLoader } from '@/components/shared';
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
          // Estado de carga
          <div className="bg-surface-alt rounded-2xl border border-border shadow-origen">
            <SectionLoader message="Cargando productos..." />
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductItem key={product.id} {...product} />
          ))
        ) : (
          // Estado vacío
          <div className="bg-surface-alt rounded-2xl p-8 border border-border shadow-origen text-center">
            <div className="w-16 h-16 rounded-xl bg-origen-pastel mx-auto mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-origen-pino" />
            </div>
            <p className="text-muted-foreground mb-1">No hay productos registrados</p>
            <p className="text-sm text-text-subtle">Añade productos para verlos aquí</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
