'use client';

import * as React from 'react';
import { Button } from '@/components/ui/atoms/button';
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
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
      {/* Back button */}
      {currentStep > 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-12 w-12 p-0 border-gray-300 text-origen-bosque flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      ) : (
        <div className="w-12 flex-shrink-0" />
      )}

      {/* Skip button */}
      {currentStep >= 1 && !isLastStep && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-shrink-0 h-12 text-xs text-gray-500 hover:text-gray-700"
        >
          Más tarde
        </Button>
      )}

      {/* Continue / Finish button */}
      <Button
        type="button"
        variant="primary"
        onClick={onNext}
        disabled={!canContinue || isSubmitting}
        loading={isSubmitting}
        loadingText="Guardando..."
        className="flex-1 h-12"
        rightIcon={!isSubmitting && !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined}
      >
        {isLastStep ? 'Finalizar' : 'Continuar'}
      </Button>
    </div>
  );
}

MobileNavBar.displayName = 'MobileNavBar';
export default MobileNavBar;
