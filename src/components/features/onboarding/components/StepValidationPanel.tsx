'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';

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
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="text-sm font-semibold text-amber-800">
              Tienes {messages.length} pendiente{messages.length > 1 ? 's' : ''} para continuar
            </span>
            <ChevronDown
              className={cn('h-4 w-4 text-amber-700 transition-transform', isExpanded && 'rotate-180')}
            />
          </button>

          <div className={cn('overflow-hidden transition-all', isExpanded ? 'mt-2 max-h-72' : 'max-h-0')}>
            <ul className="space-y-1 text-xs text-amber-700">
              {messages.map((message) => (
                <li key={message} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                  <span>{message}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onFocusFirstIncompleteField}
              className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
            >
              Ir al primer campo pendiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepValidationPanel;
