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
}

export function MobileStepperBar({ steps, currentStep }: MobileStepperBarProps) {
  return (
    <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3">
      {/* Dot trail */}
      <div className="flex items-center gap-1 mb-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className={cn(
                'rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0',
                isCompleted && 'w-5 h-5 bg-green-500',
                isActive && 'w-5 h-5 bg-origen-pradera ring-2 ring-origen-pradera/30',
                !isCompleted && !isActive && 'w-2.5 h-2.5 bg-gray-300'
              )}>
                {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 transition-all duration-300',
                  index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-origen-bosque">Paso {currentStep + 1} de {steps.length}</span>
        {' · '}
        {steps[currentStep]?.title}
      </p>
    </div>
  );
}

MobileStepperBar.displayName = 'MobileStepperBar';
export default MobileStepperBar;
