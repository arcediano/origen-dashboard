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
  return (
    <div className="lg:hidden bg-surface-alt border-b border-border-subtle px-4 py-3">
      {/* Dot trail */}
      <div className="flex items-center gap-1 mb-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          const dotContent = (
            <div className={cn(
              'rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0',
              isCompleted && 'w-5 h-5 bg-origen-hoja',
              isActive && 'w-5 h-5 bg-origen-pradera ring-2 ring-origen-pradera/30',
              !isCompleted && !isActive && 'w-2.5 h-2.5 bg-border',
              isClickable && 'cursor-pointer'
            )}>
              {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
              {isActive && <span className="w-2 h-2 rounded-full bg-surface-alt" />}
            </div>
          );

          return (
            <React.Fragment key={step.id}>
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  aria-label={`Ir al paso ${index + 1}: ${step.title}`}
                  aria-current={index === currentStep ? 'step' : undefined}
                  className="bg-transparent border-none p-0 flex items-center justify-center"
                >
                  {dotContent}
                </button>
              ) : (
                dotContent
              )}
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 transition-all duration-300',
                  index < currentStep ? 'bg-origen-pradera' : 'bg-border'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-origen-bosque">Paso {currentStep + 1} de {steps.length}</span>
        {' · '}
        {steps[currentStep]?.title}
      </p>
    </div>
  );
}

MobileStepperBar.displayName = 'MobileStepperBar';
export default MobileStepperBar;
