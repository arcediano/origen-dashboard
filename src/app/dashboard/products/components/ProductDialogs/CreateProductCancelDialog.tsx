/**
 * @file CreateProductCancelDialog.tsx
 * @description Diálogo de confirmación para cancelar la creación de producto
 */

'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@arcediano/ux-library';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <DialogTitle>¿Cancelar creación?</DialogTitle>
          </div>
          <DialogDescription>Los datos no guardados se perderán.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground px-6 pt-4">
          Si cancelas ahora, perderás todos los cambios que no hayas guardado.
          ¿Estás seguro de que quieres salir?
        </p>
        <div className="flex justify-end gap-2 px-6 pb-6 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Continuar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Descartar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
