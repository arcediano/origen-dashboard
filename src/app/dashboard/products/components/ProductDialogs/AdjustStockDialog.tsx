/**
 * @file AdjustStockDialog.tsx
 * @description Diálogo para ajustar el stock de un producto
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Minus, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@origen/ux-library';
import { Modal } from '@origen/ux-library';
import { type Product } from '@/types/product';
import { updateProductStock } from '@/lib/api/products';

// ============================================================================
// TIPOS
// ============================================================================

export interface AdjustStockDialogProps {
  /** Control de apertura del diálogo */
  open: boolean;
  /** Función para cambiar el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Producto seleccionado */
  product: Product | null;
  /** Función a ejecutar tras confirmar (para actualizar UI) */
  onConfirm: (productId: string, newStock: number) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: AdjustStockDialogProps) {
  const [stockValue, setStockValue] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'remove'>('set');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setStockValue(product.stock);
      setAdjustmentType('set');
      setError(null);
    }
  }, [product]);

  if (!product) return null;

  const resultValue =
    adjustmentType === 'set'
      ? stockValue
      : adjustmentType === 'add'
      ? product.stock + stockValue
      : Math.max(0, product.stock - stockValue);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateProductStock(product.id, resultValue);

      if (response.error) {
        setError(response.error);
        return;
      }

      onConfirm(product.id, resultValue);
      onOpenChange(false);
    } catch (err) {
      setError('Error al actualizar el stock. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Ajustar stock"
      description={`Modifica el stock de ${product.name}`}
      icon={<Package className="w-5 h-5 text-origen-pradera" />}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Confirmar
              </span>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Información del producto */}
        <div className="p-4 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
          <p className="text-sm font-medium text-origen-bosque">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
        </div>

        {/* Selector de tipo de ajuste */}
        <div className="flex gap-2">
          <button
            onClick={() => setAdjustmentType('set')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
              adjustmentType === 'set'
                ? 'bg-origen-pradera text-white border-origen-pradera'
                : 'bg-surface-alt text-foreground border-border hover:border-origen-pradera'
            )}
          >
            Fijar
          </button>
          <button
            onClick={() => setAdjustmentType('add')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
              adjustmentType === 'add'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-surface-alt text-foreground border-border hover:border-green-600'
            )}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Añadir
          </button>
          <button
            onClick={() => setAdjustmentType('remove')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
              adjustmentType === 'remove'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-surface-alt text-foreground border-border hover:border-amber-600'
            )}
          >
            <Minus className="w-4 h-4 inline mr-1" />
            Retirar
          </button>
        </div>

        {/* Input de cantidad */}
        <div>
          <label htmlFor="stock-value" className="text-xs text-muted-foreground block mb-1">
            {adjustmentType === 'set' && 'Nuevo stock'}
            {adjustmentType === 'add' && 'Cantidad a añadir'}
            {adjustmentType === 'remove' && 'Cantidad a retirar'}
          </label>
          <input
            id="stock-value"
            type="number"
            value={stockValue}
            onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full h-10 text-sm border border-border rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
            autoFocus
          />
        </div>

        {/* Resumen del ajuste */}
        <div className="p-3 bg-origen-crema/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Stock actual:</span> {product.stock} unidades
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">Resultado:</span> {resultValue} unidades
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-feedback-danger-subtle rounded-lg border border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}