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

// ============================================================================
// TIPOS - CORREGIDOS CON FormStepId
// ============================================================================

// Pasos que bloquean la navegación si están incompletos
const BLOCKING_STEPS: FormStepId[] = ['basic', 'images', 'pricing', 'inventory'];

/**
 * Botonera de navegación entre pasos — solo desktop (`hidden sm:flex`).
 * En móvil, tanto `products/create` como `products/[id]/edit` usan su propia
 * `ActionBar` de @arcediano/ux-library a nivel de página, no este componente
 * (evita duplicar markup: antes este componente reimplementaba ActionBar a
 * mano para móvil).
 */
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
  /** Si el formulario está en modo edición (producto existente) en lugar de creación */
  isEditMode?: boolean;
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
  isEditMode = false,
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

  // Igual que el ActionBar móvil de página (products/create y products/[id]/edit):
  // no basta con completar los pasos, las certificaciones también deben estar
  // aprobadas (o no tener ninguna) antes de permitir publicar.
  const canPublish = allStepsCompleted && (!hasCertifications || certificationsApproved);

  const getPublishButtonText = () => {
    if (isPublishing) return 'Publicando...';
    if (!canPublish) return 'Completa todos los pasos';
    return 'Publicar';
  };

  return (
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
              {isSaving ? 'Guardando...' : (isEditMode ? 'Guardar cambios' : 'Guardar borrador')}
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
                  ? <AlertCircle className="w-4 h-4 text-feedback-warning" aria-hidden="true" />
                  : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                className={cn(isCurrentStepBlocked && 'border-feedback-warning/40 text-feedback-warning-text hover:bg-feedback-warning-subtle')}
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
            <Shield className="w-4 h-4 text-hoja-tinta shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-origen-bosque">Certificaciones pendientes</p>
              <p className="text-[10px] text-origen-hoja mt-0.5">
                Revisaremos tus documentos en 24-48 horas.
              </p>
            </div>
          </div>
        )}

        {isLastStep && hasPendingManualCerts && allStepsCompleted && (
          <div className="p-3 bg-feedback-warning-subtle rounded-xl border border-feedback-warning/30 flex items-start gap-2">
            <Clock className="w-4 h-4 text-feedback-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-feedback-warning-text">Certificaciones manuales en revisión</p>
              <p className="text-[10px] text-feedback-warning-text/90 mt-0.5">
                Puedes publicar el producto ahora. Las certificaciones manuales no aparecerán en la ficha hasta que sean validadas por nuestro equipo (24-48 h).
              </p>
            </div>
          </div>
        )}
      </div>
  );
}
