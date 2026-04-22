/**
 * @file DeleteProductDialog.tsx
 * @description Diálogo de confirmación para eliminar un producto
 */

'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@arcediano/ux-library';
import { type Product } from '@/types/product';
import { deleteProduct } from '@/lib/api/products';

// ============================================================================
// TIPOS
// ============================================================================

export interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (productId: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: DeleteProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await deleteProduct(product.id);

      if (response.error) {
        setError(response.error);
        return;
      }

      onConfirm(product.id);
      onOpenChange(false);
    } catch {
      setError('Error al eliminar el producto. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">

        <DialogHeader>
          {/* Icono central */}
          <div className="flex flex-col items-center text-center gap-3 pb-1">
            <div className="w-14 h-14 rounded-2xl bg-feedback-danger-subtle flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-feedback-danger" />
            </div>
            <div>
              <DialogTitle className="text-lg text-origen-bosque">
                ¿Eliminar producto?
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Esta acción es permanente y no se puede deshacer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Nombre del producto destacado */}
          <div className="px-4 py-3 rounded-xl bg-origen-crema/60 border border-origen-pradera/20">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-subtle mb-0.5">
              Producto a eliminar
            </p>
            <p className="text-sm font-semibold text-origen-bosque">{product.name}</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Se eliminará permanentemente del catálogo, incluyendo todas sus imágenes,
            variantes y estadísticas asociadas.
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-feedback-danger/20 bg-feedback-danger-subtle px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-feedback-danger shrink-0 mt-0.5" />
              <p className="text-xs text-feedback-danger">{error}</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl border-border hover:border-origen-pradera hover:text-origen-pradera"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-feedback-danger hover:bg-feedback-danger/90 text-white border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Eliminando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar producto
              </span>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
