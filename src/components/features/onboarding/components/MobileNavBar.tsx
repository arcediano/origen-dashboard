'use client';

import * as React from 'react';
import { Button } from '@arcediano/ux-library';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileNavBarProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canContinue: boolean;
  isSubmitting: boolean;
  isLastStep: boolean;
}

export function MobileNavBar({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  canContinue,
  isSubmitting,
  isLastStep,
}: MobileNavBarProps) {
  const showSecondaryRow = currentStep > 0 || (currentStep >= 1 && !isLastStep);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-alt border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2">
      <Button
        type="button"
        variant="primary"
        onClick={onNext}
        disabled={!canContinue || isSubmitting}
        loading={isSubmitting}
        loadingText="Guardando..."
        className="w-full h-12 text-white !text-white disabled:text-white/90"
        rightIcon={!isSubmitting && !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined}
        aria-label={isLastStep ? 'Finalizar onboarding' : 'Continuar al siguiente paso'}
      >
        {isLastStep ? 'Finalizar' : 'Continuar'}
      </Button>

      {showSecondaryRow && (
        <div className="flex items-center gap-2">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="h-11 flex-1 border-border text-origen-bosque"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              aria-label="Volver al paso anterior"
            >
              Anterior
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {currentStep >= 1 && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              className="h-11 flex-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Más tarde
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

MobileNavBar.displayName = 'MobileNavBar';
export default MobileNavBar;

