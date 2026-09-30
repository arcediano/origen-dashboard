'use client';

import * as React from 'react';
import { ActionBar } from '@arcediano/ux-library';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  canContinue: boolean;
  isSubmitting: boolean;
  isLastStep: boolean;
  /** Etiqueta del botón principal del último paso. */
  finishLabel?: string;
}

/**
 * Barra de acciones fija en móvil (`ActionBar` de la librería): botón principal
 * siempre accesible y "Anterior" debajo. "Guardar y continuar más tarde" vive en
 * la cabecera de la página para que la barra ocupe lo mínimo.
 */
export function MobileNavBar({
  currentStep,
  onBack,
  onNext,
  canContinue,
  isSubmitting,
  isLastStep,
  finishLabel = 'Finalizar',
}: MobileNavBarProps) {
  const secondaryActions = [];

  if (currentStep > 0) {
    secondaryActions.push({
      id: 'back',
      label: 'Anterior',
      onClick: onBack,
      disabled: isSubmitting,
      variant: 'outline' as const,
      leftIcon: <ChevronLeft className="h-4 w-4" />,
      className: 'border-border text-origen-bosque',
    });
  }

  return (
    <ActionBar
      primaryAction={{
        id: 'next',
        label: isLastStep ? finishLabel : 'Continuar',
        // No se deshabilita nativamente cuando faltan campos: un botón disabled no
        // dispara onClick y en móvil (barra fija separada del contenido) no daría
        // ningún feedback. `onNext` ya guía al primer campo pendiente.
        onClick: onNext,
        disabled: isSubmitting,
        loading: isSubmitting,
        loadingText: 'Guardando...',
        variant: 'primary',
        rightIcon: !isSubmitting && !isLastStep ? <ChevronRight className="h-4 w-4" /> : undefined,
        className: cn('text-white !text-white disabled:text-white/90', !canContinue && !isSubmitting && 'opacity-60'),
      }}
      secondaryActions={secondaryActions}
      fixed
      showOnDesktop={false}
    />
  );
}

MobileNavBar.displayName = 'MobileNavBar';
export default MobileNavBar;
