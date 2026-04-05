/**
 * @component ProductMobileList
 * @description Lista de productos optimizada para mÃ³vil.
 *              Reemplaza ProductTable en pantallas < lg.
 *              Layout: thumbnail 72Ã—72 a la izquierda, info a la derecha, badge top-right.
 *
 * Tokens Origen v3.0. DiseÃ±o nativo mobile-first.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Eye,
  XCircle,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';
import { SwipeableRow } from '@/components/shared/mobile';
import { ProductImage } from '@origen/ux-library';

// â”€â”€â”€ STATUS CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ProductStatus = Product['status'];

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: React.ElementType; chip: string }
> = {
  active: {
    label: 'Activo',
    icon: CheckCircle2,
    chip: 'bg-origen-pastel text-origen-bosque border-origen-pradera/30',
  },
  draft: {
    label: 'Borrador',
    icon: FileEdit,
    chip: 'bg-surface-alt text-text-subtle border-border-subtle',
  },
  inactive: {
    label: 'Inactivo',
    icon: XCircle,
    chip: 'bg-origen-mandarina/10 text-origen-mandarina border-origen-mandarina/30',
  },
  out_of_stock: {
    label: 'Agotado',
    icon: AlertCircle,
    chip: 'bg-feedback-danger-subtle text-red-700 border-red-200',
  },
};

// â”€â”€â”€ SKELETON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProductRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-origen-pastel/60 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-origen-pastel rounded-lg w-3/4" />
        <div className="flex items-center justify-between gap-2">
          <div className="h-2.5 bg-origen-pastel/60 rounded-lg w-1/3" />
          <div className="h-4 bg-origen-pastel/60 rounded-full w-14" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-origen-pastel rounded-lg w-12" />
          <div className="h-2.5 bg-origen-pastel/60 rounded-lg w-16" />
        </div>
      </div>
      <div className="w-4 h-4 bg-origen-pastel/40 rounded flex-shrink-0" />
    </div>
  );
}

// â”€â”€â”€ BADGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        cfg.chip,
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// â”€â”€â”€ ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ProductRowProps {
  product:        Product;
  onView:         (id: string) => void;
  onEdit:         (id: string) => void;
  onAdjustStock?: (product: Product) => void;
}

function ProductRow({ product, onView, onEdit, onAdjustStock }: ProductRowProps) {
  const mainImg    = product.mainImage?.url;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  const swipeActions = [
    {
      label:   'Ver',
      icon:    Eye,
      color:   'bosque' as const,
      onPress: () => onView(product.id),
    },
    {
      label:   'Editar',
      icon:    FileEdit,
      color:   'pino' as const,
      onPress: () => onEdit(product.id),
    },
    {
      label:    'Stock',
      icon:     BarChart2,
      color:    'mandarina' as const,
      onPress:  () => onAdjustStock?.(product),
      disabled: !onAdjustStock,
    },
  ];

  return (
    <SwipeableRow actions={swipeActions} className="border-b border-border-subtle last:border-0">
      <motion.button
        whileTap={{ scale: 0.985, backgroundColor: 'hsl(var(--crema))' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => onView(product.id)}
        className="flex items-center gap-3.5 px-4 py-3.5 w-full text-left active:bg-surface"
        aria-label={`Ver ${product.name}`}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-origen-pastel flex-shrink-0 shadow-subtle">
          <ProductImage src={mainImg} alt={product.name} />
        </div>

        {/* Info â€” 3 lÃ­neas con jerarquÃ­a clara */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* L1: nombre â€” lÃ­nea completa sin competencia */}
          <p className="text-sm font-semibold text-origen-bosque truncate leading-snug">
            {product.name}
          </p>

          {/* L2: categorÃ­a (izq) + estado (der) */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-text-subtle truncate flex-1">{product.categoryName}</p>
            <StatusBadge status={product.status} />
          </div>

          {/* L3: precio + indicador de stock */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm font-bold text-origen-bosque tabular-nums">
              {product.basePrice.toFixed(2)} â‚¬
            </span>
            <span className="text-border-subtle" aria-hidden>Â·</span>
            {product.status === 'out_of_stock' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-feedback-danger flex-shrink-0" />
                Sin stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-origen-mandarina">
                <span className="w-1.5 h-1.5 rounded-full bg-origen-mandarina flex-shrink-0" />
                Stock: {product.stock}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-origen-pradera/60 flex-shrink-0" />
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>

        {/* Chevron derecha */}
        <ChevronRight className="w-4 h-4 text-text-subtle/50 flex-shrink-0" aria-hidden />
      </motion.button>
    </SwipeableRow>
  );
}

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ProductMobileListProps {
  products:       Product[];
  onView:         (id: string) => void;
  onEdit:         (id: string) => void;
  onAdjustStock?: (product: Product) => void;
  isLoading?:     boolean;
  className?:     string;
}

/**
 * Lista compacta de productos para pantallas mÃ³vil (< lg).
 * Cada fila tiene swipe-to-reveal: Ver Â· Editar Â· Stock
 * Se muestra con `block lg:hidden` en la pÃ¡gina padre.
 */
export function ProductMobileList({
  products,
  onView,
  onEdit,
  onAdjustStock,
  isLoading = false,
  className,
}: ProductMobileListProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-subtle', className)}>
        {Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={cn('rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-subtle', className)}>
      {products.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          onView={onView}
          onEdit={onEdit}
          onAdjustStock={onAdjustStock}
        />
      ))}
    </div>
  );
}

