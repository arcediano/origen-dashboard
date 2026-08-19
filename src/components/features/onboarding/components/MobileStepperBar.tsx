'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface StepInfo {
  id: number;
  title: string;
}

interface MobileStepperBarProps {
  steps: StepInfo[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function MobileStepperBar({ steps, currentStep, onStepClick }: MobileStepperBarProps) {
  const dotRefs = React.useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    const node = dotRefs.current[currentStep];
    if (!node) return;
    node.scrollIntoView({
      behavior: isMounted.current ? 'smooth' : 'auto',
      inline: 'center',
      block: 'nearest',
    });
    isMounted.current = true;
  }, [currentStep]);

  return (
    <div className="lg:hidden bg-surface-alt border-b border-border-subtle px-4 py-3">
      {/* Dot trail */}
      <div
        className="flex items-center flex-nowrap overflow-x-auto scrollbar-hide -mx-4 px-4"
        role="list"
        aria-label="Progreso del onboarding"
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          const dotContent = (
            <div
              className={cn(
                'rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0',
                isCompleted && 'w-11 h-11 bg-origen-hoja',
                isActive && 'w-11 h-11 bg-origen-pradera ring-2 ring-origen-pradera/30 ring-offset-2 ring-offset-surface-alt',
                !isCompleted && !isActive && 'w-2.5 h-2.5 bg-border',
                isClickable && 'cursor-pointer'
              )}>
              {isCompleted && <CheckCircle className="w-6 h-6 text-white" />}
              {isActive && <span className="w-4 h-4 rounded-full bg-surface-alt" />}
            </div>
          );

          return (
            <React.Fragment key={step.id}>
              {isClickable ? (
                <div role="listitem">
                  <button
                    ref={(el: HTMLButtonElement | null) => { dotRefs.current[index] = el; }}
                    type="button"
                    onClick={() => onStepClick(index)}
                    aria-label={`Ir al paso ${index + 1}: ${step.title}`}
                    aria-current={index === currentStep ? 'step' : undefined}
                    className="bg-transparent border-none p-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-bosque focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt"
                  >
                    {dotContent}
                  </button>
                </div>
              ) : (
                <div role="listitem">
                  {dotContent}
                </div>
              )}
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 min-w-6 max-w-16 transition-all duration-300',
                  index < currentStep ? 'bg-origen-pradera' : 'bg-border'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-xs text-muted-foreground mt-2">
        <span className="font-semibold text-origen-bosque">Paso {currentStep + 1} de {steps.length}</span>
        {' · '}
        {steps[currentStep]?.title}
      </p>
    </div>
  );
}

MobileStepperBar.displayName = 'MobileStepperBar';
export default MobileStepperBar;
