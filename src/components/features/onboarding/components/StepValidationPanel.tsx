'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Alert } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import type { StepIssue } from '@/lib/onboarding/validation';

interface StepValidationPanelProps {
  issues: StepIssue[];
  /** Lleva el foco al control indicado (o al primero pendiente si no se indica). */
  onFocusField: (fieldId?: string) => void;
  /** Reinicia el estado plegado al cambiar de paso. */
  stepKey?: number;
}

/**
 * Resumen de pendientes del paso: cada elemento es un botón que lleva al campo
 * concreto. En escritorio abierto por defecto; en móvil, plegado con el recuento.
 */
export function StepValidationPanel({ issues, onFocusField, stepKey }: StepValidationPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') setIsExpanded(window.innerWidth >= 1024);
  }, [stepKey]);

  if (issues.length === 0) return null;

  return (
    <Alert id="onboarding-step-validation" variant="warning" className="items-start">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-semibold">
            {issues.length === 1 ? 'Te falta 1 cosa para continuar' : `Te faltan ${issues.length} cosas para continuar`}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')} aria-hidden="true" />
        </button>

        {isExpanded && (
          <ul className="mt-1 space-y-0.5 text-sm">
            {issues.map((issue) => (
              <li key={`${issue.fieldId ?? ''}-${issue.message}`}>
                <button
                  type="button"
                  onClick={() => onFocusField(issue.fieldId)}
                  className="flex min-h-9 w-full items-start gap-2 py-1 text-left hover:underline"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
                  <span>{issue.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}

export default StepValidationPanel;
