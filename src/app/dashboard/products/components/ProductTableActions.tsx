/**
 * @file ProductTableActions.tsx
 * @description Acciones unificadas para la fila de la tabla de productos - VERSIÓN RESPONSIVE
 */

'use client';

import React from 'react';
import { PlusCircle, Eye, Edit, Send, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';

export interface ProductTableActionsProps {
  product: Product;
  onAdjustStock: (product: Product) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange?: (product: Product, newStatus: 'draft' | 'pending_approval') => void;
  className?: string;
}

export function ProductTableActions({
  product,
  onAdjustStock,
  onView,
  onEdit,
  onStatusChange,
  className,
}: ProductTableActionsProps) {
  const canSubmit  = product.status === 'draft' && onStatusChange;
  const canRetract = product.status === 'pending_approval' && onStatusChange;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Botón de ajuste de stock */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdjustStock(product);
        }}
        className="p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-origen-pradera hover:bg-origen-pradera/10 transition-all group relative"
        title="Ajustar stock"
        aria-label="Ajustar stock"
      >
        <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden sm:block">
          Ajustar stock
        </span>
      </button>

      {/* Botón de ver producto */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(product.id);
        }}
        className="p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-origen-pradera hover:bg-origen-pradera/10 transition-all group relative"
        title="Ver producto"
        aria-label="Ver producto"
      >
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden sm:block">
          Ver producto
        </span>
      </button>

      {/* Botón de editar producto */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(product.id);
        }}
        className="p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-origen-pradera hover:bg-origen-pradera/10 transition-all group relative"
        title="Editar producto"
        aria-label="Editar producto"
      >
        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden sm:block">
          Editar producto
        </span>
      </button>

      {/* Enviar a revisión — solo para borradores */}
      {canSubmit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange!(product, 'pending_approval');
          }}
          className="p-1.5 sm:p-2 rounded-md text-green-600 hover:text-white hover:bg-green-600 transition-all group relative"
          title="Enviar a revisión"
          aria-label="Enviar a revisión"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden sm:block">
            Enviar a revisión
          </span>
        </button>
      )}

      {/* Volver a borrador — solo para pendientes */}
      {canRetract && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange!(product, 'draft');
          }}
          className="p-1.5 sm:p-2 rounded-md text-amber-600 hover:text-white hover:bg-amber-500 transition-all group relative"
          title="Volver a borrador"
          aria-label="Volver a borrador"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden sm:block">
            Volver a borrador
          </span>
        </button>
      )}
    </div>
  );
}