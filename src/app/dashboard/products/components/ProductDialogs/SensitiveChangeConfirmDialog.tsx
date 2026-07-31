/**
 * @component SensitiveChangeConfirmDialog
 * @description Modal de confirmación para cambios en campos sensibles.
 * Aparece cuando el usuario intenta guardar cambios en campos que disparan revisión automática.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Button,
} from '@arcediano/ux-library';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';

interface SensitiveChangeConfirmDialogProps {
  open: boolean;
  sensitiveDirtyFields: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function SensitiveChangeConfirmDialog({
  open,
  sensitiveDirtyFields,
  onConfirm,
  onCancel,
  isSaving = false,
}: SensitiveChangeConfirmDialogProps) {
  const fieldLabels = sensitiveDirtyFields
    .map((field) => SENSITIVE_FIELD_LABELS[field]?.label)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}>
      <DialogContent className="max-w-sm">
        <DialogTitle>
          Este cambio enviará tu producto a revisión
        </DialogTitle>

        <DialogDescription className="space-y-3">
          <p>
            Mientras un administrador revisa estos cambios, tu producto dejará de
            mostrarse en el catálogo público. El resto de tus productos no se ve
            afectado.
          </p>
        </DialogDescription>

        <div className="py-3 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Has modificado:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-text-default">
            {fieldLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex justify-between sm:justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Seguir editando
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isSaving}
            loading={isSaving}
          >
            Guardar y enviar a revisión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
