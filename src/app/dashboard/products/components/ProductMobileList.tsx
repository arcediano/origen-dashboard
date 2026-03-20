/**
 * @component ProductMobileList
 * @description Lista de productos optimizada para móvil.
 *              Reemplaza ProductTable en pantallas < lg.
 *              Layout: thumbnail 72×72 a la izquierda, info a la derecha, badge top-right.
 *
 * Tokens Origen v3.0. Diseño nativo mobile-first.
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
  ChevronRight,
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
    chip: 'bg-origen-mandarina/10 text-origen-mandarina border-origen-mandarina/30',
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
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-[72px] h-[72px] rounded-2xl bg-origen-pastel/60 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="h-3.5 bg-origen-pastel rounded-lg w-3/4" />
        <div className="h-2.5 bg-origen-pastel/60 rounded-lg w-1/2" />
        <div className="flex items-center gap-3">
          <div className="h-4 bg-origen-pastel rounded-lg w-16" />
          <div className="h-3 bg-origen-pastel/60 rounded-lg w-12" />
        </div>
      </div>
      <div className="flex-shrink-0 w-14 h-5 bg-origen-pastel/60 rounded-full" />
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
        whileTap={{ scale: 0.985, backgroundColor: 'hsl(var(--crema))' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => onView(product.id)}
        className="flex items-center gap-3.5 px-4 py-3.5 w-full text-left active:bg-surface"
        aria-label={`Ver ${product.name}`}
      >
        {/* Thumbnail */}
        <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-origen-pastel flex-shrink-0 shadow-subtle">
          {mainImg ? (
            <img src={mainImg} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-origen-pastel to-origen-pradera/10">
              <Package className="w-8 h-8 text-origen-pradera/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Badge encima del nombre en móvil */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-origen-bosque truncate leading-tight flex-1">{product.name}</p>
            <StatusBadge status={product.status} />
          </div>
          <p className="text-[11px] text-text-subtle truncate">{product.sku} · {product.categoryName}</p>
          {/* Precio y stock en la misma fila, prominentes */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-bold text-origen-bosque">{product.basePrice.toFixed(2)} €</span>
            <span className="text-border-subtle">·</span>
            {product.status === 'out_of_stock' ? (
              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">Sin stock</span>
            ) : isLowStock ? (
              <span className="text-[11px] font-semibold text-origen-mandarina bg-origen-mandarina/10 px-1.5 py-0.5 rounded-md">Stock: {product.stock}</span>
            ) : (
              <span className="text-[11px] text-text-subtle">Stock: {product.stock}</span>
            )}
          </div>
        </div>

        {/* Chevron derecha */}
        <ChevronRight className="w-4 h-4 text-text-subtle/50 flex-shrink-0" aria-hidden />
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
