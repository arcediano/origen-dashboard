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
   * El productor ha usado el asistente de IA en este producto: desde la
   * petición del humano de 2026-10-09, eso implica que el borrador ya está
   * guardado como producto real -- salir ahora no lo descarta, solo deja sin
   * guardar los cambios hechos en esta sesión de revisión.
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
          ? 'El borrador ya está guardado en «Mis productos» con lo que preparó la IA: no se pierde, aunque salgas ahora. Solo perderás los cambios que hayas hecho en esta revisión sin guardar. ¿Seguro que quieres salir?'
          : 'Si cancelas ahora, perderás todos los cambios que no hayas guardado. ¿Estás seguro de que quieres salir?'
      }
      confirmVariant="danger"
      confirmLabel={aiAssistUsed ? 'Salir' : 'Descartar'}
      cancelLabel="Continuar"
      onConfirm={onConfirm}
    />
  );
}
