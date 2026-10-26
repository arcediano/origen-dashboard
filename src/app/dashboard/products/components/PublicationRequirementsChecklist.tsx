/**
 * @file PublicationRequirementsChecklist.tsx
 * @description Checklist "Requisitos para publicar" -- refleja el estado
 * autoritativo del backend (GET /products/:id/publication-status), petición
 * del humano 2026-10-26 (ver claude-agile/proyectos/diseno-requisitos-publicacion-producto-2026-10-26.md).
 * Reutilizable entre el wizard de creación y el de edición. Si el producto
 * todavía no está persistido (sin id), no hay nada que consultar en servidor
 * -- se usa el checklist local (`clientMissing`, derivado de `getStepErrors`)
 * como aproximación hasta el primer guardado.
 */

'use client';

import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormStepId } from '@/types/product';
import { FORM_STEPS } from '@/types/product';
import type { PublicationStatus } from '@/lib/api/products';

export interface PublicationRequirementsChecklistProps {
  publicationStatus: PublicationStatus | null;
  /** Mensajes de respaldo (cliente) mientras no hay `publicationStatus` del servidor -- p.ej. producto aún sin guardar. */
  clientMissing: string[];
  onJumpToStep?: (step: FormStepId) => void;
  className?: string;
}

export function PublicationRequirementsChecklist({
  publicationStatus,
  clientMissing,
  onJumpToStep,
  className,
}: PublicationRequirementsChecklistProps) {
  const items = publicationStatus
    ? publicationStatus.missing.map((req) => ({
        message: req.message,
        stepId: req.stepId as FormStepId,
      }))
    : clientMissing.map((message) => ({ message, stepId: undefined }));

  if (items.length === 0) return null;

  return (
    <div className={cn('rounded-2xl border border-origen-pradera/20 bg-origen-crema/30 p-4', className)}>
      <p className="text-xs font-semibold text-origen-bosque mb-2">
        Requisitos para publicar ({items.length} pendiente{items.length === 1 ? '' : 's'})
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const stepLabel = item.stepId ? FORM_STEPS.find((s) => s.id === item.stepId)?.label : undefined;
          const clickable = !!(item.stepId && onJumpToStep);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJumpToStep!(item.stepId!)}
                className={cn(
                  'flex items-start gap-2 text-xs text-left w-full',
                  clickable ? 'hover:underline cursor-pointer' : 'cursor-default',
                )}
              >
                <Circle className="w-3 h-3 mt-0.5 shrink-0 text-feedback-warning" aria-hidden="true" />
                <span className="text-origen-oscuro">
                  {item.message}
                  {stepLabel && <span className="text-text-subtle"> · {stepLabel}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
