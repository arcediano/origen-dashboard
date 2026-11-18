/**
 * @component AiWizardStepper
 * @description Indicador horizontal de pasos del asistente "Origen Assist" (solo ≥lg;
 * en móvil/tablet se usa la barra de progreso). Los pasos ya recorridos se pueden volver
 * a abrir; los siguientes no (cada paso se valida antes de avanzar, ver `AiProductWizard.handleNext`).
 */
'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  QUESTION_STEP_IDS,
  WIZARD_STEP_IDS,
  WIZARD_STEP_LABELS,
  type WizardStepId,
} from '@/lib/ai-assist/assisted-product';

interface AiWizardStepperProps {
  step: WizardStepId;
  onGoTo: (step: WizardStepId) => void;
  className?: string;
}

export function AiWizardStepper({ step, onGoTo, className }: AiWizardStepperProps) {
  const currentIndex = WIZARD_STEP_IDS.indexOf(step);

  return (
    <nav aria-label="Pasos del asistente" className={cn('overflow-x-auto', className)}>
      <ol className="flex items-center gap-1.5" data-testid="ai-wizard-steps">
        {QUESTION_STEP_IDS.map((id, i) => {
          const index = WIZARD_STEP_IDS.indexOf(id);
          const done = index < currentIndex;
          const current = id === step;
          return (
            <li key={id} className={cn('flex items-center gap-1.5', i < QUESTION_STEP_IDS.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onGoTo(id)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-1.5 py-1.5 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
                  current && 'font-semibold text-origen-bosque',
                  done && 'text-origen-oscuro hover:bg-origen-pastel/40',
                  !done && !current && 'cursor-default text-text-subtle',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    done && 'border-transparent bg-origen-bosque text-white',
                    current && 'border-origen-bosque bg-origen-pastel/60 text-origen-bosque',
                    !done && !current && 'border-border-subtle bg-white text-text-subtle',
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{WIZARD_STEP_LABELS[id]}</span>
              </button>
              {i < QUESTION_STEP_IDS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('h-px min-w-2 flex-1', done ? 'bg-origen-bosque/50' : 'bg-border-subtle')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
