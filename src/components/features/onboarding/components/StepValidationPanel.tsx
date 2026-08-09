'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Alert } from '@arcediano/ux-library';

interface StepValidationPanelProps {
  messages: string[];
  onFocusFirstIncompleteField: () => void;
  currentStep?: number;
}

export function StepValidationPanel({
  messages,
  onFocusFirstIncompleteField,
  currentStep,
}: StepValidationPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    // En desktop abierta por defecto; en mobile abrimos por defecto el paso Capacidad (step 4)
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        setIsExpanded(true);
      } else {
        setIsExpanded(currentStep === 4);
      }
    }
  }, [currentStep]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <Alert id="onboarding-step-validation" variant="warning" className="mt-4 items-start">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-semibold">
            Tienes {messages.length} pendiente{messages.length > 1 ? 's' : ''} para continuar
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')}
          />
        </button>

        <div className={cn('overflow-hidden transition-all', isExpanded ? 'mt-2 max-h-72' : 'max-h-0')}>
          <ul className="space-y-1 text-xs">
            {messages.map((message) => (
              <li key={message} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current/70" />
                <span>{message}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onFocusFirstIncompleteField}
            className="mt-2 text-xs font-medium underline underline-offset-2 hover:opacity-80"
          >
            Ir al primer campo pendiente
          </button>
        </div>
      </div>
    </Alert>
  );
}

export default StepValidationPanel;
