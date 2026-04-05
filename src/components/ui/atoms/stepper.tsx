/**
 * @file stepper.tsx
 * @description Componente Stepper para formularios multi-paso
 * @package @origen/ui/navigation
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './button';
import { successStates, warningStates } from '@/lib/utils/colors';

// ============================================================================
// TIPOS
// ============================================================================

export type StepStatus = 'completed' | 'active' | 'pending' | 'error';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status: StepStatus;
  disabled?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pasos del stepper */
  steps: Step[];
  /** Paso actual (0-based index) */
  currentStep: number;
  /** Callback cuando se cambia de paso */
  onStepChange?: (step: number) => void;
  /** Variante visual */
  variant?: 'default' | 'minimal' | 'card' | 'arrow';
  /** Orientación */
  orientation?: 'horizontal' | 'vertical';
  /** Mostrar descripciones */
  showDescriptions?: boolean;
  /** Permitir navegación a pasos completados */
  allowBackwardNavigation?: boolean;
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg';
}

export interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface StepperFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Paso actual */
  currentStep: number;
  /** Total de pasos */
  totalSteps: number;
  /** Callback para siguiente paso */
  onNext?: () => void;
  /** Callback para paso anterior */
  onPrevious?: () => void;
  /** Texto del botón siguiente */
  nextLabel?: string;
  /** Texto del botón final */
  finishLabel?: string;
  /** Texto del botón anterior */
  previousLabel?: string;
  /** Mostrar botón anterior */
  showPrevious?: boolean;
  /** Deshabilitar botón siguiente */
  nextDisabled?: boolean;
  /** Cargando */
  loading?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENTE STEPPER PRINCIPAL
// ============================================================================

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className = '',
      steps,
      currentStep,
      onStepChange,
      variant = 'default',
      orientation = 'horizontal',
      showDescriptions = true,
      allowBackwardNavigation = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const handleStepClick = (index: number) => {
      const step = steps[index];

      // Solo permitir clic si el paso está habilitado
      if (step.disabled) return;

      // Permitir navegación a pasos completados o al siguiente paso pendiente
      const canNavigate =
        index === currentStep + 1 || // Siguiente paso
        (allowBackwardNavigation && index < currentStep) || // Pasos anteriores
        (allowBackwardNavigation && steps[index].status === 'completed'); // Pasos completados

      if (canNavigate && onStepChange) {
        onStepChange(index);
      }
    };

    const getStepIcon = (step: Step, index: number) => {
      if (step.status === 'completed') {
        return (
          <CheckCircle2
            className={cn(
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-5 w-5',
              size === 'lg' && 'h-6 w-6',
              'text-white'
            )}
          />
        );
      }

      if (step.status === 'active') {
        return step.icon || (
          <Circle
            className={cn(
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-5 w-5',
              size === 'lg' && 'h-6 w-6',
              'text-origen-pradera animate-pulse'
            )}
          />
        );
      }

      if (step.status === 'error') {
        return (
          <Circle
            className={cn(
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-5 w-5',
              size === 'lg' && 'h-6 w-6',
              'text-red-500'
            )}
          />
        );
      }

      return (
        <Circle
          className={cn(
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6',
            'text-text-disabled'
          )}
        />
      );
    };

    const getStepClasses = (step: Step, index: number) => {
      const isClickable = !step.disabled && (
        index === currentStep + 1 ||
        (allowBackwardNavigation && index < currentStep) ||
        (allowBackwardNavigation && step.status === 'completed')
      );

      return cn(
        'relative flex items-center',
        orientation === 'vertical' && 'flex-row',
        orientation === 'horizontal' && 'flex-col',
        isClickable && 'cursor-pointer',
        isClickable && !step.disabled && 'hover:opacity-80 transition-opacity',
        step.disabled && 'opacity-50 cursor-not-allowed'
      );
    };

    const getStepConnectorClasses = (index: number) => {
      const isCompleted = index < currentStep || steps[index].status === 'completed';

      return cn(
        'absolute',
        orientation === 'horizontal'
          ? 'top-1/2 left-0 w-full -translate-y-1/2 h-0.5'
          : 'top-0 left-1/2 h-full -translate-x-1/2 w-0.5',
        isCompleted
          ? 'bg-origen-pradera'
          : 'bg-border'
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          orientation === 'horizontal' && 'flex items-center justify-between',
          orientation === 'vertical' && 'flex flex-col space-y-4',
          className
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div
                className={getStepClasses(step, index)}
                onClick={() => handleStepClick(index)}
                role="button"
                tabIndex={!step.disabled ? 0 : -1}
                aria-label={step.title}
                aria-current={step.status === 'active' ? 'step' : undefined}
              >
                {/* Step Number/Icon */}
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
                    size === 'sm' && 'h-8 w-8 text-xs',
                    size === 'md' && 'h-10 w-10 text-sm',
                    size === 'lg' && 'h-12 w-12 text-base',
                    step.status === 'completed' &&
                      'bg-origen-pradera border-origen-pradera text-white',
                    step.status === 'active' &&
                      'bg-white border-origen-pradera text-origen-pradera',
                    step.status === 'error' &&
                      'bg-red-50 border-red-500 text-red-500',
                    step.status === 'pending' &&
                      'bg-surface-alt border-border-subtle text-text-disabled'
                  )}
                >
                  {getStepIcon(step, index)}
                </div>

                {/* Step Title and Description */}
                <div
                  className={cn(
                    'absolute',
                    orientation === 'horizontal'
                      ? 'top-full left-1/2 -translate-x-1/2 mt-3 text-center'
                      : 'left-full ml-4 top-1/2 -translate-y-1/2',
                    orientation === 'horizontal' && 'w-32'
                  )}
                >
                  <p
                    className={cn(
                      'font-semibold',
                      size === 'sm' && 'text-xs',
                      size === 'md' && 'text-sm',
                      size === 'lg' && 'text-base',
                      step.status === 'active' && 'text-origen-bosque',
                      step.status === 'completed' && 'text-origen-hoja',
                      step.status === 'pending' && 'text-muted-foreground',
                      step.status === 'error' && 'text-red-500'
                    )}
                  >
                    {step.title}
                  </p>
                  {showDescriptions && step.description && (
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        step.status === 'active' ? 'text-muted-foreground' : 'text-text-disabled'
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line (not for last step) */}
              {!isLast && (
                <div className={getStepConnectorClasses(index)} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';

// ============================================================================
// STEPPER CONTENT
// ============================================================================

const StepperContent = React.forwardRef<HTMLDivElement, StepperContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </div>
  )
);

StepperContent.displayName = 'StepperContent';

// ============================================================================
// STEPPER FOOTER
// ============================================================================

const StepperFooter = React.forwardRef<HTMLDivElement, StepperFooterProps>(
  (
    {
      className,
      currentStep,
      totalSteps,
      onNext,
      onPrevious,
      nextLabel = 'Siguiente',
      finishLabel = 'Finalizar',
      previousLabel = 'Atrás',
      showPrevious = true,
      nextDisabled = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between pt-6 mt-6 border-t border-border',
          className
        )}
        {...props}
      >
        {/* Previous Button */}
        {showPrevious && !isFirstStep && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onPrevious}
            disabled={loading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {previousLabel}
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next/Finish Button */}
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onNext}
          disabled={nextDisabled || loading}
          loading={loading}
          className="gap-2"
        >
          {isLastStep ? finishLabel : nextLabel}
          {!isLastStep && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    );
  }
);

StepperFooter.displayName = 'StepperFooter';

// ============================================================================
// STEPPER HEADER (Compact)
// ============================================================================

export interface StepperHeaderProps {
  /** Pasos del stepper */
  steps: Step[];
  /** Paso actual */
  currentStep: number;
  /** Título del paso actual */
  title?: string;
  /** Descripción del paso actual */
  description?: string;
  className?: string;
}

const StepperHeader = React.forwardRef<HTMLDivElement, StepperHeaderProps>(
  ({ className, steps, currentStep, title, description, ...props }, ref) => {
    const currentStepData = steps[currentStep];

  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {/* Progress Bar */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            steps[currentStep]?.status === 'error'
              ? 'bg-red-500'
              : 'bg-origen-pradera'
          )}
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      {/* Step Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-origen-bosque">
            {title || currentStepData?.title}
          </h2>
          <span className="text-sm text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </span>
        </div>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

StepperHeader.displayName = 'StepperHeader';

// ============================================================================
// EXPORTACIONES
// ============================================================================

export {
  Stepper,
  StepperContent,
  StepperFooter,
  StepperHeader,
};

// ============================================================================
// UTILIDAD: Crear pasos con estado predeterminado
// ============================================================================

export function createSteps(
  stepDefinitions: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }>,
  currentStep: number,
  errorStep?: number
): Step[] {
  return stepDefinitions.map((step, index) => ({
    ...step,
    status: errorStep === index
      ? 'error'
      : index < currentStep
      ? 'completed'
      : index === currentStep
      ? 'active'
      : 'pending',
  }));
}
