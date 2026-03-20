/**
 * @component ProductMobileList
 * @description Lista de productos optimizada para móvil.
 *              Reemplaza ProductTable en pantallas < lg.
 *              Layout: thumbnail 64×64 a la izquierda, info a la derecha, badge top-right.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Eye,
  XCircle,
  BarChart2,
  ChevronsLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';
import { SwipeableRow } from '@/components/shared/mobile';

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

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
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  out_of_stock: {
    label: 'Agotado',
    icon: AlertCircle,
    chip: 'bg-red-50 text-red-700 border-red-200',
  },
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function ProductRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="flex-shrink-0 w-16 h-6 bg-gray-200 rounded-full" />
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

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

// ─── ROW ──────────────────────────────────────────────────────────────────────

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
      color:   'blue' as const,
      onPress: () => onEdit(product.id),
    },
    {
      label:    'Stock',
      icon:     BarChart2,
      color:    'amber' as const,
      onPress:  () => onAdjustStock?.(product),
      disabled: !onAdjustStock,
    },
  ];

  return (
    <SwipeableRow actions={swipeActions} className="border-b border-border-subtle last:border-0">
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => onView(product.id)}
        className="flex items-center gap-3 px-3 py-3 w-full text-left"
        aria-label={`Ver ${product.name}`}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-origen-pastel flex-shrink-0">
          {mainImg ? (
            <img src={mainImg} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-7 h-7 text-origen-pradera/60" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-origen-bosque truncate leading-tight">{product.name}</p>
          <p className="text-[11px] text-text-subtle truncate mt-0.5">{product.sku} · {product.categoryName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-origen-bosque">{product.basePrice.toFixed(2)} €</span>
            {product.status === 'out_of_stock' ? (
              <span className="text-[10px] font-medium text-red-600">Sin stock</span>
            ) : isLowStock ? (
              <span className="text-[10px] font-medium text-amber-600">Stock: {product.stock}</span>
            ) : (
              <span className="text-[10px] text-text-subtle">Stock: {product.stock}</span>
            )}
          </div>
        </div>

        {/* Status badge + hint de swipe */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={product.status} />
          <ChevronsLeft className="w-4 h-4 text-text-subtle/40" aria-hidden />
        </div>
      </motion.button>
    </SwipeableRow>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export interface ProductMobileListProps {
  products:       Product[];
  onView:         (id: string) => void;
  onEdit:         (id: string) => void;
  onAdjustStock?: (product: Product) => void;
  isLoading?:     boolean;
  className?:     string;
}

/**
 * Lista compacta de productos para pantallas móvil (< lg).
 * Cada fila tiene swipe-to-reveal: Ver · Editar · Stock
 * Se muestra con `block lg:hidden` en la página padre.
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
      <div className={cn('rounded-xl border border-border-subtle bg-surface overflow-hidden', className)}>
        {Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-border-subtle bg-surface overflow-hidden', className)}>
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
