/**
 * @file MoveToDraftConfirmDialog.tsx
 * @description Diálogo de confirmación al mover un producto activo/pausado a
 *              borrador. Delega toda la UI al componente reutilizable ConfirmDialog.
 */

'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { ConfirmDialog } from '@arcediano/ux-library';

// ============================================================================
// TIPOS
// ============================================================================

export interface MoveToDraftConfirmDialogProps {
  /** Control de apertura */
  open: boolean;
  /** Función para cambiar el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Función para confirmar el cambio a borrador */
  onConfirm: () => void;
  /** Muestra el spinner en el botón de confirmar mientras se guarda */
  isLoading?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Diálogo de confirmación para mover un producto activo o pausado a borrador.
 * A diferencia de "Pausar producto", esta transición saca al producto de la
 * tienda por completo y requiere volver a pasar por revisión del equipo de
 * Origen para publicarse de nuevo.
 */
export function MoveToDraftConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: MoveToDraftConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<FileText className="w-7 h-7" />}
      title="¿Mover a borrador?"
      description="El producto dejará de estar visible en la tienda."
      body="Si continúas, el producto dejará de estar visible en la tienda hasta que lo vuelvas a enviar a revisión y el equipo de Origen lo apruebe. ¿Quieres continuar?"
      confirmVariant="danger"
      confirmLabel="Mover a borrador"
      cancelLabel="Cancelar"
      onConfirm={onConfirm}
      isLoading={isLoading}
      loadingLabel="Actualizando..."
    />
  );
}
