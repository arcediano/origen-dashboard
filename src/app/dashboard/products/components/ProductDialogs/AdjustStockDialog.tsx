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
  /** Función a ejecutar tras confirmar (para actualizar UI) — ahora recibe el Product completo del servidor */
  onConfirm: (productId: string, updatedProduct: Product) => void;
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
  const [stockValue, setStockValue] = useState<string>(''); // Mantener como string para validación (H10)
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'remove'>('set');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null); // Error de validación de entrada (H7)

  useEffect(() => {
    if (product) {
      setStockValue(String(product.stock));
      setAdjustmentType('set');
      setError(null);
      setInputError(null);
    }
  }, [product]);

  if (!product) return null;

  // Validación mínima de entrada (H7)
  const isValidInput = stockValue !== '' && !isNaN(parseInt(stockValue)) && parseInt(stockValue) >= 0;
  const stockValueNum = parseInt(stockValue) || 0;

  // Estimación del resultado (solo para display, no usada para decisión)
  const estimatedResult =
    adjustmentType === 'set'
      ? stockValueNum
      : adjustmentType === 'add'
      ? product.stock + stockValueNum
      : Math.max(0, product.stock - stockValueNum);

  // Mapear nombres para el backend (H3)
  const modeMap: Record<'set' | 'add' | 'remove', 'set' | 'increment' | 'decrement'> = {
    'set': 'set',
    'add': 'increment',
    'remove': 'decrement',
  };

  const handleConfirm = async () => {
    // Validación previa al envío (H7, H10)
    if (!isValidInput) {
      setInputError('Por favor, introduce un número válido >= 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInputError(null);

    try {
      const mode = modeMap[adjustmentType];
      const response = await updateProductStock(product.id, mode, stockValueNum);

      if (response.error) {
        // Diferenciar errores HTTP específicos (H14 - veremos si es 409)
        setError(response.error);
        return;
      }

      if (response.data) {
        // Usar el Product completo devuelto del backend como fuente de verdad (H9)
        onConfirm(product.id, response.data);
        onOpenChange(false);
      }
    } catch (err) {
      setError('Error al actualizar el stock. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // H10: Distinguir entre "campo vacío" (no actualizar) y "no-numérico" (mostrar error)
    if (value === '') {
      setStockValue('');
      setInputError(null); // Sin error si está vacío, solo no permitir envío
      return;
    }

    if (isNaN(parseInt(value))) {
      setInputError('Introduce un número válido');
      return;
    }

    setStockValue(value);
    setInputError(null);
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
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2',
              adjustmentType === 'add'
                ? 'bg-origen-hoja text-white border-origen-hoja'
                : 'bg-surface-alt text-origen-bosque border-border-subtle hover:border-origen-hoja'
            )}
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
          <button
            onClick={() => setAdjustmentType('remove')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2',
              adjustmentType === 'remove'
                ? 'bg-origen-menta text-white border-origen-menta'
                : 'bg-surface-alt text-origen-bosque border-border-subtle hover:border-origen-menta'
            )}
          >
            <Minus className="w-4 h-4" />
            Retirar
          </button>
        </div>

        {/* Input de cantidad (H7, H10) */}
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
            onChange={handleStockValueChange}
            min={0}
            autoFocus
            error={inputError || undefined}
          />
          {inputError && (
            <p className="text-xs text-feedback-danger mt-1">{inputError}</p>
          )}
        </div>

        {/* Resumen del ajuste (H8 — estimación, el backend decide) */}
        {stockValue !== '' && (
          <div className="p-3 bg-surface rounded-lg border border-border-subtle">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Stock actual:</span> {product.stock} unidades
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Resultado estimado:</span>{' '}
              <span className={cn('font-semibold', estimatedResult === 0 ? 'text-feedback-danger' : 'text-origen-hoja')}>
                {estimatedResult} unidades
              </span>
            </p>
            {(product.reservedStock ?? 0) > 0 && estimatedResult < (product.reservedStock ?? 0) && (
              <p className="text-xs text-feedback-danger mt-2">
                ⚠️ El resultado ({estimatedResult}) sería menor que lo reservado ({product.reservedStock}). El servidor rechazará esto.
              </p>
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-feedback-danger-subtle rounded-lg border border-feedback-danger/30">
            <p className="text-xs text-feedback-danger-text">{error}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 px-6 pb-6">
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !isValidInput}
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
