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
          MOBILE: Isla flotante compacta (62 px) — mismo estilo que BottomTabBar
          Oculto en sm+ donde se muestra la versión desktop de abajo
      ══════════════════════════════════════════════════════════ */}
      <div
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex justify-center items-end px-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
      >
        {/* Panel de errores — flota encima de la isla */}
        {showStepErrors && hasErrors && (
          <div
            id="step-errors-panel"
            role="alert"
            aria-live="polite"
            className="absolute bottom-full mb-2 left-4 right-4 rounded-2xl border border-feedback-danger/30 bg-feedback-danger-subtle px-4 py-3 shadow-lg"
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

        {/* Isla flotante */}
        <div className={cn(
          'relative flex items-center w-full max-w-[360px] h-[62px] px-3 gap-2',
          'bg-background/95 backdrop-blur-sm',
          'rounded-[28px]',
          'border border-border-subtle',
          'shadow-[0_10px_40px_rgba(27,67,50,0.18),0_2px_8px_rgba(27,67,50,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]',
        )}>

          {/* ← Anterior */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep}
            aria-label="Paso anterior"
            aria-disabled={isFirstStep}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
              'text-text-subtle hover:bg-origen-bosque/8 transition-colors',
              isFirstStep && 'opacity-30 pointer-events-none',
            )}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Dots de progreso + etiqueta de paso */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-[5px]" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={FORM_STEPS.length} aria-label={`Paso ${currentIndex + 1} de ${FORM_STEPS.length}`}>
              {FORM_STEPS.map((step, i) => (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === currentIndex
                      ? 'w-4 h-[6px] bg-origen-bosque'
                      : completedTabs[step.id]
                        ? 'w-[6px] h-[6px] bg-origen-pradera/60'
                        : 'w-[6px] h-[6px] border border-border-subtle bg-transparent',
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-text-subtle leading-none">
              Paso {currentIndex + 1}/{FORM_STEPS.length}
            </span>
          </div>

          {/* 💾 Guardar borrador */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            aria-label={isSaving ? 'Guardando...' : 'Guardar borrador'}
            aria-disabled={isSaving}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
              'text-text-subtle hover:bg-origen-bosque/8 transition-colors',
              isSaving && 'opacity-70 pointer-events-none',
            )}
          >
            {isSaving
              ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Save className="w-4 h-4" aria-hidden="true" />
            }
          </button>

          {/* CTA principal — Siguiente o Publicar */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing || !canPublish}
              aria-label={getPublishButtonText()}
              aria-disabled={isPublishing || !canPublish}
              title={!canPublish ? 'Completa todos los pasos' : undefined}
              className={cn(
                'h-11 px-4 rounded-2xl flex items-center gap-1.5 flex-shrink-0',
                'bg-gradient-to-br from-origen-bosque via-origen-pino to-origen-hoja',
                'text-white text-[11px] font-bold',
                'shadow-[0_4px_14px_rgba(27,67,50,0.35)]',
                (isPublishing || !canPublish) && 'opacity-50 pointer-events-none',
              )}
            >
              {isPublishing
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                : <Send className="w-3.5 h-3.5" aria-hidden="true" />
              }
              {isPublishing ? 'Publicando' : 'Publicar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              aria-label={isCurrentStepBlocked ? 'Completa este paso para continuar' : 'Siguiente paso'}
              className={cn(
                'h-11 px-4 rounded-2xl flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold transition-colors',
                isCurrentStepBlocked
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-gradient-to-br from-origen-bosque via-origen-pino to-origen-hoja text-white shadow-[0_4px_14px_rgba(27,67,50,0.35)]',
              )}
            >
              {isCurrentStepBlocked
                ? <AlertCircle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                : <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              }
              {isCurrentStepBlocked ? 'Pendiente' : 'Siguiente'}
            </button>
          )}
        </div>
      </div>

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
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            leftIcon={<ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          >
            Anterior
          </Button>

          {/* Acciones centrales y CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
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
