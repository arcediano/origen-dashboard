'use client';

import * as React from 'react';
import { ActionBar } from '@arcediano/ux-library';
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
  totalSteps: _totalSteps,
  onBack,
  onNext,
  onSkip,
  canContinue,
  isSubmitting,
  isLastStep,
}: MobileNavBarProps) {
  const secondaryActions = [];

  if (currentStep > 0) {
    secondaryActions.push({
      id: 'back',
      label: 'Anterior',
      onClick: onBack,
      disabled: isSubmitting,
      variant: 'outline' as const,
      leftIcon: <ChevronLeft className="w-4 h-4" />,
      className: 'border-border text-origen-bosque',
    });
  }

  if (currentStep >= 1 && !isLastStep) {
    secondaryActions.push({
      id: 'skip',
      label: 'Más tarde',
      onClick: onSkip,
      disabled: isSubmitting,
      variant: 'ghost' as const,
      className: 'text-sm text-muted-foreground hover:text-foreground',
    });
  }

  return (
    <ActionBar
      primaryAction={{
        id: 'next',
        label: isLastStep ? 'Finalizar' : 'Continuar',
        onClick: onNext,
        disabled: !canContinue || isSubmitting,
        loading: isSubmitting,
        loadingText: 'Guardando...',
        variant: 'primary',
        rightIcon: !isSubmitting && !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined,
        className: 'text-white !text-white disabled:text-white/90',
      }}
      secondaryActions={secondaryActions}
      fixed
      showOnDesktop={false}
    />
  );
}

MobileNavBar.displayName = 'MobileNavBar';
export default MobileNavBar;

