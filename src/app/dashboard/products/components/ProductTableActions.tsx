/**
 * @file ProductTableActions.tsx
 * @description Acciones unificadas para la fila de la tabla de productos - VERSIÓN RESPONSIVE
 */

'use client';

import React from 'react';
import { Button } from '@arcediano/ux-library';
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
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onAdjustStock(product);
        }}
        title="Ajustar stock"
        aria-label="Ajustar stock"
        className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
      >
        <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      {/* Botón de ver producto */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onView(product.id);
        }}
        title="Ver producto"
        aria-label="Ver producto"
        className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
      >
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      {/* Botón de editar producto */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(product.id);
        }}
        title="Editar producto"
        aria-label="Editar producto"
        className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
      >
        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      {/* Enviar a revisión — solo para borradores */}
      {canSubmit && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange!(product, 'pending_approval');
          }}
          title="Enviar a revisión"
          aria-label="Enviar a revisión"
          className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-hoja-tinta hover:text-hoja-tinta hover:bg-feedback-success-subtle"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      )}

      {/* Volver a borrador — solo para pendientes */}
      {canRetract && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange!(product, 'draft');
          }}
          title="Volver a borrador"
          aria-label="Volver a borrador"
          className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-feedback-warning-text hover:text-feedback-warning-text hover:bg-feedback-warning-subtle"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      )}
    </div>
  );
}
