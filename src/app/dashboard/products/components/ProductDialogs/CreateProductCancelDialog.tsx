/**
 * @file CreateProductCancelDialog.tsx
 * @description Diálogo de confirmación para cancelar la creación de producto.
 *              Delega toda la UI al componente reutilizable ConfirmDialog.
 */

'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '@arcediano/ux-library';

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
  /**
   * El productor ha usado el asistente de IA en este producto sin guardarlo:
   * salir sin guardar consume igualmente una de sus plazas de producto con IA.
   */
  aiAssistUsed?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Diálogo de confirmación para cancelar la creación de producto.
 */
export function CreateProductCancelDialog({
  open,
  onOpenChange,
  onConfirm,
  aiAssistUsed = false,
}: CreateProductCancelDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<AlertCircle className="w-7 h-7" />}
      title="¿Cancelar creación?"
      description="Los datos no guardados se perderán."
      body={
        aiAssistUsed
          ? 'Si cancelas ahora, el producto no se guarda como borrador: se descarta. Ya has usado un crédito del asistente de IA en este producto y no se recupera. ¿Estás seguro de que quieres salir?'
          : 'Si cancelas ahora, perderás todos los cambios que no hayas guardado. ¿Estás seguro de que quieres salir?'
      }
      confirmVariant="danger"
      confirmLabel="Descartar"
      cancelLabel="Continuar"
      onConfirm={onConfirm}
    />
  );
}
