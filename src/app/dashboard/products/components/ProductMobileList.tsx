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
  MoreVertical,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';

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
  product: Product;
  onView:  (id: string) => void;
  onEdit:  (id: string) => void;
}

function ProductRow({ product, onView, onEdit }: ProductRowProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera
  React.useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const mainImg = product.mainImage?.url;
  const isLowStock =
    product.stock > 0 && product.stock <= product.lowStockThreshold;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-3 px-3 py-3 border-b border-border-subtle last:border-0 relative"
    >
      {/* Thumbnail */}
      <button
        onClick={() => onView(product.id)}
        className="w-16 h-16 rounded-xl overflow-hidden bg-origen-pastel flex-shrink-0 focus:outline-none"
        aria-label={`Ver ${product.name}`}
      >
        {mainImg ? (
          <img
            src={mainImg}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-7 h-7 text-origen-pradera/60" />
          </div>
        )}
      </button>

      {/* Info — clickable area */}
      <button
        onClick={() => onView(product.id)}
        className="flex-1 min-w-0 text-left focus:outline-none"
      >
        {/* Nombre */}
        <p className="text-sm font-semibold text-origen-bosque truncate leading-tight">
          {product.name}
        </p>

        {/* SKU + categoría */}
        <p className="text-[11px] text-text-subtle truncate mt-0.5">
          {product.sku} · {product.categoryName}
        </p>

        {/* Precio + stock */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-sm font-bold text-origen-bosque">
            {product.basePrice.toFixed(2)} €
          </span>

          {/* Stock badge */}
          {product.status === 'out_of_stock' ? (
            <span className="text-[10px] font-medium text-red-600">Sin stock</span>
          ) : isLowStock ? (
            <span className="text-[10px] font-medium text-amber-600">
              Stock: {product.stock}
            </span>
          ) : (
            <span className="text-[10px] text-text-subtle">
              Stock: {product.stock}
            </span>
          )}
        </div>
      </button>

      {/* Status badge + kebab */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0" ref={menuRef}>
        <StatusBadge status={product.status} />

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-text-subtle hover:bg-surface-alt"
          aria-label="Más acciones"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-14 z-20 w-40 bg-surface rounded-xl shadow-lg border border-border-subtle overflow-hidden"
          >
            <button
              onClick={() => { onView(product.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-origen-bosque hover:bg-surface-alt"
            >
              <Eye className="w-4 h-4 text-origen-pino" />
              Ver detalle
            </button>
            <button
              onClick={() => { onEdit(product.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-origen-bosque hover:bg-surface-alt"
            >
              <FileEdit className="w-4 h-4 text-origen-pino" />
              Editar
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export interface ProductMobileListProps {
  products:  Product[];
  onView:    (id: string) => void;
  onEdit:    (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Lista compacta de productos para pantallas móvil (< lg).
 * Se muestra con `block lg:hidden` en la página padre.
 */
export function ProductMobileList({
  products,
  onView,
  onEdit,
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
        />
      ))}
    </div>
  );
}
