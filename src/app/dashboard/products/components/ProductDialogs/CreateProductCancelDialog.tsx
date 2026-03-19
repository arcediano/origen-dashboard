/**
 * @file CreateProductCancelDialog.tsx
 * @description Diálogo de confirmación para cancelar la creación de producto
 */

'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/atoms/dialog';

// ============================================================================
// TIPOS
// ============================================================================

export interface CreateProductCancelDialogProps {
  /** Control de apertura */
  open: boolean;
  /** Función para cambiar el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Función para confirmar cancelación */
  onConfirm: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Diálogo de confirmación para cancelar la creación de producto
 */
export function CreateProductCancelDialog({
  open,
  onOpenChange,
  onConfirm,
}: CreateProductCancelDialogProps) {
  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="¿Cancelar creación?"
      description="Los datos no guardados se perderán."
      icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
      size="sm"
      footer={
        <>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface-alt border-2 border-border rounded-lg hover:border-origen-pradera transition-colors"
          >
            Continuar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Descartar
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Si cancelas ahora, perderás todos los cambios que no hayas guardado.
        ¿Estás seguro de que quieres salir?
      </p>
    </Modal>
  );
}