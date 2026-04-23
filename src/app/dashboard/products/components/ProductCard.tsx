/**
 * @file ProductCard.tsx
 * @description Tarjeta de producto para vista en cuadrícula — estilo dashboard Origen.
 */

'use client';

import React from 'react';
import { Edit, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, Button, ProductImage } from '@arcediano/ux-library';
import { type Product } from '@/types/product';

export interface ProductCardProps {
  product: Product;
  onAdjustStock: (product: Product) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  className?: string;
}

export function ProductCard({
  product,
  onAdjustStock,
  onView,
  onEdit,
  className,
}: ProductCardProps) {
  const stock     = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 5;
  const stockColor =
    stock === 0             ? 'bg-feedback-danger text-white' :
    stock <= threshold      ? 'bg-feedback-warning-subtle text-feedback-warning border-feedback-warning/30' :
                              'bg-origen-pastel text-origen-bosque border-origen-pradera/20';

  const mainImage = product.mainImage || product.gallery?.[0];

  // Calcular % de completitud solo para borradores
  const isDraft = product.status === 'draft';
  const completionChecks = isDraft
    ? [
        !!(product.name && product.categoryId),
        !!(product.gallery?.length > 0 || product.mainImage),
        !!(product.basePrice && product.basePrice > 0),
        !!(product.sku),
      ]
    : [];
  const completionPct = isDraft
    ? Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100)
    : 100;

  return (
    <div
      className={cn(
        'rounded-[24px] border border-border bg-surface-alt shadow-subtle cursor-pointer group',
        'hover:border-origen-pradera/30 hover:shadow-origen transition-all duration-200',
        className,
      )}
      onClick={() => onView(product.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onView(product.id)}
      aria-label={`Ver ${product.name}`}
    >
      {/* Imagen */}
      <div className="aspect-square w-full rounded-t-[22px] bg-origen-crema/50 overflow-hidden border-b border-border-subtle">
        {mainImage
          ? <ProductImage src={mainImage.url} alt={mainImage.alt || product.name} />
          : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-origen-pradera/25" />
            </div>
          )
        }
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Nombre + estado */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-origen-bosque line-clamp-2 leading-snug flex-1" title={product.name}>
            {product.name}
          </p>
          <StatusBadge status={product.status as import('@arcediano/ux-library').StatusType} size="xs" />
        </div>

        {/* Barra de completitud para borradores */}
        {isDraft && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-subtle">Completitud</span>
              <span className={cn(
                'text-[10px] font-semibold',
                completionPct === 100 ? 'text-origen-hoja' : completionPct >= 50 ? 'text-feedback-warning' : 'text-feedback-danger',
              )}>
                {completionPct}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-border-subtle overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  completionPct === 100 ? 'bg-origen-hoja' : completionPct >= 50 ? 'bg-feedback-warning' : 'bg-feedback-danger',
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Categoría */}
        <p className="text-[11px] text-text-subtle mb-3 truncate">
          {product.categoryName || product.sku}
        </p>

        {/* Precio + Stock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-bold text-origen-bosque tabular-nums">
              {product.basePrice.toFixed(2)} €
            </p>
            {product.comparePrice && product.comparePrice > product.basePrice && (
              <p className="text-[10px] text-text-subtle line-through tabular-nums">
                {product.comparePrice.toFixed(2)} €
              </p>
            )}
          </div>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-1 rounded-lg border',
            stockColor,
          )}>
            {stock === 0 ? 'Agotado' : `${stock} uds`}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t border-border-subtle">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={e => { e.stopPropagation(); onAdjustStock(product); }}
          >
            Ajustar stock
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={e => { e.stopPropagation(); onEdit(product.id); }}
            aria-label="Editar producto"
          />
        </div>
      </div>
    </div>
  );
}

