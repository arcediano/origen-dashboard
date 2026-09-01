/**
 * @file OfferConflictDialog.tsx
 * @description Diálogo de confirmación para el conflicto 409 EXCLUSIVE_OFFER_CONFLICT
 *              al guardar descuentos por cantidad sobre un producto con una oferta
 *              flash ya activa/programada. Delega la UI a ConfirmDialog, igual que
 *              el resto de diálogos de confirmación de este repo.
 */

'use client';

import { Zap } from 'lucide-react';
import { ConfirmDialog } from '@arcediano/ux-library';

export interface OfferConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function OfferConflictDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: OfferConflictDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Zap className="w-7 h-7" />}
      title="Ya tienes una oferta flash activa"
      description="Un producto no puede tener a la vez una oferta flash y descuentos por cantidad."
      body="Si continúas, la oferta flash activa (o programada) se desactivará automáticamente y se activarán estos descuentos por cantidad en su lugar."
      confirmVariant="primary"
      confirmLabel="Reemplazar oferta"
      loadingLabel="Reemplazando..."
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
