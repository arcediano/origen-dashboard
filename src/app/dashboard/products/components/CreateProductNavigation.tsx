/**
 * @file CreateProductNavigation.tsx
 * @description Botones de navegación entre pasos y acciones de guardar/publicar
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Save, Send, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { FORM_STEPS, type FormStepId } from '@/types/product';

// ============================================================================
// TIPOS - CORREGIDOS CON FormStepId
// ============================================================================

export interface CreateProductNavigationProps {
  /** Paso actual */
  currentTab: FormStepId;  // ← Cambiado de string a FormStepId
  /** Función para cambiar de paso */
  onTabChange: (tab: FormStepId) => void;  // ← Cambiado de string a FormStepId
  /** Pasos completados */
  completedTabs: Record<FormStepId, boolean>;  // ← Cambiado a Record con FormStepId
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
  /** Función para publicar */
  onPublish: () => void;
  /** Si está publicando */
  isPublishing: boolean;
  /** Estado de publicación */
  publishStatus: 'idle' | 'success' | 'pending_approval' | 'error';
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Botones de navegación entre pasos y acciones de guardar/publicar
 */
export function CreateProductNavigation({
  currentTab,
  onTabChange,
  completedTabs,
  onSave,
  isSaving,
  allStepsCompleted,
  hasCertifications,
  certificationsApproved,
  onPublish,
  isPublishing,
  publishStatus,
  className,
}: CreateProductNavigationProps) {
  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentTab);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === FORM_STEPS.length - 1;
  
  // Obtener el paso anterior y siguiente con el tipo correcto
  const prevStep = !isFirstStep ? FORM_STEPS[currentIndex - 1].id : null;
  const nextStep = !isLastStep ? FORM_STEPS[currentIndex + 1].id : null;

  const handleNext = () => {
    if (nextStep) {
      onTabChange(nextStep);  // ← Ahora nextStep es FormStepId
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (prevStep) {
      onTabChange(prevStep);  // ← Ahora prevStep es FormStepId
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Verificar si se puede publicar
  const canPublish = allStepsCompleted && (!hasCertifications || certificationsApproved);

  // Determinar el texto del botón según el estado
  const getPublishButtonText = () => {
    if (isPublishing) return 'Publicando...';
    if (!allStepsCompleted) return 'Completa todos los pasos';
    if (hasCertifications && !certificationsApproved) return 'Pendiente de verificación';
    return 'Publicar';
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-200', className)}>
      {/* Botón anterior */}
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstStep}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
        className="w-full sm:w-auto"
      >
        Anterior
      </Button>

      {/* Acciones centrales */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {/* Botón guardar */}
        <Button
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Guardando...' : 'Guardar borrador'}
        </Button>

        {/* Botón siguiente o publicar */}
        {isLastStep ? (
          <Button
            variant="primary"
            onClick={onPublish}
            disabled={isPublishing || !canPublish}
            leftIcon={isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            className={cn(
              "w-full sm:w-auto",
              !canPublish && "opacity-50 cursor-not-allowed"
            )}
            title={!canPublish ? "Completa todos los pasos y verifica las certificaciones" : undefined}
          >
            {getPublishButtonText()}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Siguiente
          </Button>
        )}
      </div>

      {/* Mensajes de estado */}
      {isLastStep && publishStatus === 'pending_approval' && (
        <div className="mt-4 w-full p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-800">Pendiente de verificación</p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              Tus certificaciones están siendo verificadas. Te notificaremos cuando estén aprobadas.
            </p>
          </div>
        </div>
      )}

      {isLastStep && publishStatus === 'success' && (
        <div className="mt-4 w-full p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-green-800">¡Publicado con éxito!</p>
            <p className="text-[10px] text-green-600 mt-0.5">
              Tu producto ya está visible en el catálogo.
            </p>
          </div>
        </div>
      )}

      {isLastStep && hasCertifications && !certificationsApproved && allStepsCompleted && (
        <div className="mt-4 w-full p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-800">Certificaciones pendientes</p>
            <p className="text-[10px] text-blue-600 mt-0.5">
              Revisaremos tus documentos en 24-48 horas. Mientras tanto, puedes guardar el borrador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}