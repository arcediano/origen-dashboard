/**
 * @file ProductCard.tsx
 * @description Tarjeta de producto para vista en cuadrícula - VERSIÓN RESPONSIVE
 */

'use client';

import React from 'react';
import { Eye, Edit, PlusCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/atoms/card';
import { StatusBadge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { ProductImage } from '@/components/ui/atoms/product-image';
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
  const stockColor = product.stock === 0 
    ? 'bg-red-500' 
    : product.lowStockThreshold && product.stock <= product.lowStockThreshold 
    ? 'bg-amber-500' 
    : 'bg-green-500';

  const mainImage = product.mainImage || product.gallery?.[0];

  return (
    <Card
      variant="elevated"
      hoverEffect="organic"
      className={cn('p-3 sm:p-4 cursor-pointer', className)}
      onClick={() => onView(product.id)}
    >
      {/* Imagen del producto - responsive */}
      <div className="aspect-square w-full bg-gradient-to-br from-origen-crema to-gray-100 rounded-lg mb-2 sm:mb-3 overflow-hidden">
        <ProductImage src={mainImage?.url} alt={mainImage?.alt || product.name} />
      </div>

      {/* Cabecera con nombre y estado */}
      <div className="flex justify-between items-start gap-1 mb-1 sm:mb-2">
        <h3 className="font-semibold text-origen-bosque text-sm sm:text-base line-clamp-2 flex-1" title={product.name}>
          {product.name}
        </h3>
        <StatusBadge status={product.status} size="xs" />
      </div>

      {/* SKU - visible solo en móvil? mejor siempre visible pero pequeño */}
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 truncate">{product.sku}</p>

      {/* Precio y stock */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div>
          <span className="text-base sm:text-lg font-bold text-origen-pradera">
            {product.basePrice.toFixed(2)}€
          </span>
          {product.comparePrice && (
            <span className="text-[10px] sm:text-xs text-text-subtle line-through ml-1 sm:ml-2">
              {product.comparePrice.toFixed(2)}€
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', stockColor)} />
          <span className="text-[10px] sm:text-xs text-muted-foreground">{product.stock} uds</span>
        </div>
      </div>

      {/* Valoración (si existe) */}
      {product.rating ? (
        <div className="flex items-center gap-1 mb-2 sm:mb-3">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-[10px] sm:text-xs font-medium text-origen-bosque">
            {product.rating.toFixed(1)}
          </span>
          {product.reviewCount && (
            <span className="text-[10px] text-text-subtle">({product.reviewCount})</span>
          )}
        </div>
      ) : (
        <div className="h-4 sm:h-5 mb-2 sm:mb-3" /> /* Espaciador para mantener altura consistente */
      )}

      {/* Acciones */}
      <div className="flex gap-2 mt-1 sm:mt-2 pt-2 border-t border-border-subtle">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdjustStock(product);
          }}
          className="flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs bg-origen-pradera/10 text-origen-pradera rounded-md hover:bg-origen-pradera/20 transition-colors"
          aria-label="Ajustar stock"
        >
          Ajustar stock
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product.id);
          }}
          className="p-1.5 sm:p-2 text-muted-foreground hover:text-origen-pradera hover:bg-origen-pradera/10 rounded-md transition-colors"
          aria-label="Editar producto"
        >
          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </Card>
  );
}