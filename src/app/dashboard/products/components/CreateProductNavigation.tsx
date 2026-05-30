/**
 * @file CreateProductNavigation.tsx
 * @description Botones de navegación entre pasos y acciones de guardar/publicar
 */

'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Send, RefreshCw, Shield, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@arcediano/ux-library';
import { FORM_STEPS, type FormStepId } from '@/types/product';
import { useHideBottomTabBar } from '@/hooks/useHideBottomTabBar';

// ============================================================================
// TIPOS - CORREGIDOS CON FormStepId
// ============================================================================

// Pasos que bloquean la navegación si están incompletos
const BLOCKING_STEPS: FormStepId[] = ['basic', 'images', 'pricing', 'inventory'];

export interface CreateProductNavigationProps {
  /** Paso actual */
  currentTab: FormStepId;
  /** Función para cambiar de paso */
  onTabChange: (tab: FormStepId) => void;
  /** Pasos completados */
  completedTabs: Record<FormStepId, boolean>;
  /** Errores del paso actual — lista de campos obligatorios pendientes */
  currentStepErrors?: string[];
  /** Función para guardar */
  onSave: () => void;
  /** Si está guardando */
  isSaving: boolean;
  /** Si todos los pasos están completados */
  allStepsCompleted: boolean;
  /** Si tiene certificaciones */
  hasCertifications: boolean;
  /** Si las certificaciones están aprobadas */
  certificationsApproved: boolean;
  /** Si hay certificaciones manuales pendientes de validación */
  hasPendingManualCerts: boolean;
  /** Función para publicar */
  onPublish: () => void;
  /** Si está publicando */
  isPublishing: boolean;
  /** Estado de publicación */
  publishStatus: 'idle' | 'success' | 'pending_approval' | 'error';
  /** Mensaje de error de publicación */
  publishError?: string | null;
  /** @deprecated Vista previa — disponible en PageHeader desktop */
  onPreview?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CreateProductNavigation({
  currentTab,
  onTabChange,
  completedTabs,
  currentStepErrors = [],
  onSave,
  isSaving,
  allStepsCompleted,
  hasCertifications,
  certificationsApproved,
  hasPendingManualCerts,
  onPublish,
  isPublishing,
  publishStatus,
  publishError,
  className,
}: CreateProductNavigationProps) {
  const [showStepErrors, setShowStepErrors] = useState(false);

  // Oculta el BottomTabBar global mientras esta barra de acciones está montada
  useHideBottomTabBar();

  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentTab);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === FORM_STEPS.length - 1;

  const prevStep = !isFirstStep ? FORM_STEPS[currentIndex - 1].id : null;
  const nextStep = !isLastStep ? FORM_STEPS[currentIndex + 1].id : null;

  const isBlockingStep = BLOCKING_STEPS.includes(currentTab);
  const hasErrors = currentStepErrors.length > 0;
  const isCurrentStepBlocked = isBlockingStep && hasErrors;

  const handleNext = () => {
    if (isCurrentStepBlocked) {
      setShowStepErrors(true);
      setTimeout(() => {
        document.getElementById('step-errors-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
      return;
    }
    setShowStepErrors(false);
    if (nextStep) {
      onTabChange(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setShowStepErrors(false);
    if (prevStep) {
      onTabChange(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canPublish = allStepsCompleted;

  const getPublishButtonText = () => {
    if (isPublishing) return 'Publicando...';
    if (!allStepsCompleted) return 'Completa todos los pasos';
    return 'Publicar';
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          MOBILE: Barra sticky full-width con texto en todos los botones
          Sigue el mismo patrón que ActionBar de @arcediano/ux-library
      ══════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Navegación de pasos"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 w-full border-t border-border bg-background/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(27,67,50,0.08)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      >
        {/* Panel de errores — flota encima de la barra */}
        {showStepErrors && hasErrors && (
          <div
            id="step-errors-panel"
            role="alert"
            aria-live="polite"
            className="mb-3 rounded-2xl border border-feedback-danger/30 bg-feedback-danger-subtle px-4 py-3"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <XCircle className="w-3.5 h-3.5 text-feedback-danger shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs font-semibold text-feedback-danger-text">
                Completa los campos obligatorios antes de continuar
              </p>
            </div>
            <ul className="space-y-0.5 pl-5">
              {currentStepErrors.map((err, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-feedback-danger-text">
                  <span className="w-1 h-1 rounded-full bg-feedback-danger shrink-0" aria-hidden="true" />
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Indicador de progreso */}
        <div
          className="flex items-center justify-center gap-[5px] mb-2"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={FORM_STEPS.length}
          aria-label={`Paso ${currentIndex + 1} de ${FORM_STEPS.length}`}
        >
          {FORM_STEPS.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentIndex
                  ? 'w-4 h-[5px] bg-origen-bosque'
                  : completedTabs[step.id]
                    ? 'w-[5px] h-[5px] bg-origen-pradera/60'
                    : 'w-[5px] h-[5px] border border-border-subtle bg-transparent',
              )}
            />
          ))}
          <span className="ml-1.5 text-[10px] font-semibold text-text-subtle leading-none">
            {currentIndex + 1}/{FORM_STEPS.length}
          </span>
        </div>

        {/* CTA principal — Siguiente o Publicar (full-width) */}
        {isLastStep ? (
          <Button
            type="button"
            variant="primary"
            onClick={onPublish}
            disabled={isPublishing || !canPublish}
            leftIcon={isPublishing
              ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Send className="w-4 h-4" aria-hidden="true" />
            }
            className={cn('w-full h-12', (isPublishing || !canPublish) && 'opacity-50')}
            aria-disabled={isPublishing || !canPublish}
            title={!canPublish ? 'Completa todos los pasos' : undefined}
          >
            {getPublishButtonText()}
          </Button>
        ) : (
          <Button
            type="button"
            variant={isCurrentStepBlocked ? 'secondary' : 'primary'}
            onClick={handleNext}
            rightIcon={isCurrentStepBlocked
              ? <AlertCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
              : <ChevronRight className="w-4 h-4" aria-hidden="true" />
            }
            className={cn(
              'w-full h-12',
              isCurrentStepBlocked && 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100',
            )}
          >
            {isCurrentStepBlocked ? 'Completa este paso' : 'Siguiente'}
          </Button>
        )}

        {/* Fila secundaria: Anterior + Guardar */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevious}
            disabled={isFirstStep}
            leftIcon={<ChevronLeft className="w-4 h-4" aria-hidden="true" />}
            className={cn('flex-1 h-11', isFirstStep && 'opacity-40')}
            aria-disabled={isFirstStep}
          >
            Anterior
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onSave}
            disabled={isSaving}
            leftIcon={isSaving
              ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Save className="w-4 h-4" aria-hidden="true" />
            }
            className="flex-1 h-11"
            aria-disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP (sm+): Botonera horizontal — igual que antes
      ══════════════════════════════════════════════════════════ */}
      <div className={cn(
        'hidden sm:flex flex-col gap-3 pt-6 mt-6 border-t border-border',
        className,
      )}>

        {/* Panel de errores del paso actual */}
        {showStepErrors && hasErrors && (
          <div
            id="step-errors-panel-desktop"
            className="rounded-2xl border border-feedback-danger/30 bg-feedback-danger-subtle p-4"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-2.5 mb-2">
              <XCircle className="w-4 h-4 text-feedback-danger shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-semibold text-feedback-danger-text">
                Completa los campos obligatorios antes de continuar
              </p>
            </div>
            <ul className="space-y-1 pl-6 ml-0.5">
              {currentStepErrors.map((err, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-feedback-danger-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-feedback-danger shrink-0" aria-hidden="true" />
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-3">
          {/* Botón anterior */}
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isFirstStep}
            leftIcon={<ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          >
            Anterior
          </Button>

          {/* Acciones centrales y CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onSave}
              disabled={isSaving}
              leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </Button>

            {isLastStep ? (
              <Button
                variant="primary"
                onClick={onPublish}
                disabled={isPublishing || !canPublish}
                leftIcon={isPublishing
                  ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  : <Send className="w-4 h-4" aria-hidden="true" />
                }
                className={cn(!canPublish && 'opacity-50 cursor-not-allowed')}
                title={!canPublish ? 'Completa todos los pasos' : undefined}
              >
                {getPublishButtonText()}
              </Button>
            ) : (
              <Button
                variant={isCurrentStepBlocked ? 'outline' : 'primary'}
                onClick={handleNext}
                rightIcon={isCurrentStepBlocked
                  ? <AlertCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                className={cn(isCurrentStepBlocked && 'border-amber-300 text-amber-700 hover:bg-amber-50')}
              >
                {isCurrentStepBlocked ? 'Completa este paso' : 'Siguiente'}
              </Button>
            )}
          </div>
        </div>

        {/* Mensajes de estado de publicación */}
        {isLastStep && publishStatus === 'error' && (
          <div className="p-3 bg-feedback-danger-subtle rounded-xl border border-feedback-danger/30 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-feedback-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-feedback-danger-text">Error al publicar</p>
              <p className="text-[10px] text-feedback-danger mt-0.5">
                {publishError ?? 'No se pudo publicar el producto. Revisa los datos e inténtalo de nuevo.'}
              </p>
            </div>
          </div>
        )}

        {isLastStep && publishStatus === 'success' && (
          <div className="p-3 bg-origen-pastel/20 rounded-xl border border-origen-pradera/30 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-origen-hoja shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-origen-bosque">¡Publicado con éxito!</p>
              <p className="text-[10px] text-origen-hoja mt-0.5">Tu producto ya está visible en el catálogo.</p>
            </div>
          </div>
        )}

        {isLastStep && hasCertifications && !certificationsApproved && allStepsCompleted && (
          <div className="p-3 bg-origen-crema/40 rounded-xl border border-origen-pradera/20 flex items-start gap-2">
            <Shield className="w-4 h-4 text-origen-pradera shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-origen-bosque">Certificaciones pendientes</p>
              <p className="text-[10px] text-origen-hoja mt-0.5">
                Revisaremos tus documentos en 24-48 horas.
              </p>
            </div>
          </div>
        )}

        {isLastStep && hasPendingManualCerts && allStepsCompleted && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-amber-800">Certificaciones manuales en revisión</p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Puedes publicar el producto ahora. Las certificaciones manuales no aparecerán en la ficha hasta que sean validadas por nuestro equipo (24-48 h).
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
