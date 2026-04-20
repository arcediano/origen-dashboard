/**
 * @file AdjustStockDialog.tsx
 * @description Diálogo para ajustar el stock de un producto
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Minus, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@arcediano/ux-library';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@arcediano/ux-library';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-origen-pradera" />
            <DialogTitle>Ajustar stock</DialogTitle>
          </div>
          <DialogDescription>{`Modifica el stock de ${product.name}`}</DialogDescription>
        </DialogHeader>
      <div className="px-6 py-4 space-y-4">
        {/* Información del producto */}
        <div className="p-4 bg-surface rounded-lg border border-border-subtle">
          <p className="text-sm font-medium text-origen-bosque">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
        </div>

        {/* Selector de tipo de ajuste */}
        <div className="flex gap-2">
          <button
            onClick={() => setAdjustmentType('set')}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2',
              adjustmentType === 'set'
                ? 'bg-origen-bosque text-white border-origen-bosque'
                : 'bg-surface-alt text-origen-bosque border-border-subtle hover:border-origen-pradera'
            )}
          >
            Fijar
          </button>
          <button
            onClick={() => setAdjustmentType('add')}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2',
              adjustmentType === 'add'
                ? 'bg-origen-hoja text-white border-origen-hoja'
                : 'bg-surface-alt text-origen-bosque border-border-subtle hover:border-origen-hoja'
            )}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Añadir
          </button>
          <button
            onClick={() => setAdjustmentType('remove')}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2',
              adjustmentType === 'remove'
                ? 'bg-origen-menta text-white border-origen-menta'
                : 'bg-surface-alt text-origen-bosque border-border-subtle hover:border-origen-menta'
            )}
          >
            <Minus className="w-4 h-4 inline mr-1" />
            Retirar
          </button>
        </div>

        {/* Input de cantidad */}
        <div>
          <Input
            id="stock-value"
            type="number"
            label={
              adjustmentType === 'set' ? 'Nuevo stock' :
              adjustmentType === 'add' ? 'Cantidad a añadir' :
              'Cantidad a retirar'
            }
            value={stockValue}
            onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
            min={0}
            autoFocus
          />
        </div>

        {/* Resumen del ajuste */}
        <div className="p-3 bg-surface rounded-lg border border-border-subtle">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Stock actual:</span> {product.stock} unidades
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-medium text-foreground">Resultado:</span>{' '}
            <span className={cn('font-semibold', resultValue === 0 ? 'text-feedback-danger' : 'text-origen-hoja')}>
              {resultValue} unidades
            </span>
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-feedback-danger-subtle rounded-lg border border-feedback-danger/30">
            <p className="text-xs text-feedback-danger-text">{error}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 px-6 pb-6">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
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
      </div>
      </DialogContent>
    </Dialog>
  );
}
