/**
 * @file DeleteProductDialog.tsx
 * @description Diálogo de confirmación para eliminar un producto
 */

'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { Modal } from '@/components/ui/atoms/dialog';
import { type Product } from '@/types/product';
import { deleteProduct } from '@/lib/api/products';

// ============================================================================
// TIPOS
// ============================================================================

export interface DeleteProductDialogProps {
  /** Control de apertura del diálogo */
  open: boolean;
  /** Función para cambiar el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Producto a eliminar */
  product: Product | null;
  /** Función a ejecutar tras confirmar (para actualizar UI) */
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
    } catch (err) {
      setError('Error al eliminar el producto. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="¿Eliminar producto?"
      description="Esta acción no se puede deshacer."
      icon={<Trash2 className="w-5 h-5 text-red-600" />}
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 hover:border-origen-pradera"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Eliminando...
              </span>
            ) : (
              'Eliminar permanentemente'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Se eliminará permanentemente el producto{' '}
          <span className="font-semibold text-origen-bosque">{product.name}</span> del catálogo,
          incluyendo todas sus variantes, imágenes y estadísticas asociadas.
        </p>

        {error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}