/**
 * @file DeleteProductDialog.tsx
 * @description Diálogo de confirmación para eliminar un producto.
 *              Delega toda la UI al componente reutilizable ConfirmDialog.
 */

'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@arcediano/ux-library';
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar producto?"
      description="Esta acción es permanente y no se puede deshacer."
      highlightLabel="Producto a eliminar"
      highlightValue={product.name}
      body="Se eliminará permanentemente del catálogo, incluyendo todas sus imágenes, variantes y estadísticas asociadas."
      confirmVariant="danger"
      confirmLabel="Eliminar producto"
      loadingLabel="Eliminando..."
      isLoading={isLoading}
      onConfirm={handleConfirm}
      error={error}
    />
  );
}
