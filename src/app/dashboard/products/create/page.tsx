/**
 * @page CreateProductPage
 * @description Página de creación de productos.
 */

'use client';

import { Package, ChevronLeft, ChevronRight, Save, Send, RefreshCw, X } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

import { PageHeader } from '@/app/dashboard/components/PageHeader';
import {
  CreateProductProgress,
  CreateProductNavigation,
  CreateProductCancelDialog,
  SuccessPublishModal,
} from '@/app/dashboard/products/components';
import { ProductFormSteps } from '@/app/dashboard/products/components/ProductFormSteps';
import { ProductFormSidebar } from '@/app/dashboard/products/components/ProductFormSidebar';

import { useProductForm } from '@/hooks/useProductForm';
import { useStepTips, KEY_FACTS_BY_STEP } from '@/hooks/useStepTips';
import { useHideBottomTabBar } from '@/hooks/useHideBottomTabBar';
import { FORM_STEPS, type FormStepId } from '@/types/product';
import {
  toast,
  appShellPaddingClass,
  appShellBottomOffsetClass,
  NAV_HEIGHT_MOBILE_DASHBOARD,
  ActionBar,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from '@arcediano/ux-library';
import { useEffect, useState } from 'react';

// ─── Animaciones ──────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateProductPage() {
  const {
    formData,
    activeTab,
    setActiveTab,
    completedTabs,
    error,
    isSaving,
    isAutoSaving,
    lastSaved,
    isPublishing,
    publishStatus,
    publishError,
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    allStepsCompleted,
    hasCertifications,
    certificationsApproved,
    hasPendingManualCerts,
    currentStepErrors,
    handleInputChange,
    handleNestedChange,
    handlePriceTiersChange,
    handleImagesChange,
    handleSave,
    handlePublish,
    handleCancel,
  } = useProductForm();

  useEffect(() => {
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'error' });
    }
  }, [error]);

  const stepNumber = FORM_STEPS.findIndex(s => s.id === activeTab) + 1;
  const tips = useStepTips(stepNumber, formData);

  const [showMobileErrors, setShowMobileErrors] = useState(false);

  const handleTabChange = (tab: FormStepId) => {
    setShowMobileErrors(false);
    setActiveTab(tab);
  };

  // Navegación por pasos para el ActionBar móvil — mismo patrón que
  // products/[id]/edit/page.tsx (CreateProductNavigation ya no reimplementa
  // su propia barra móvil, solo el bloque de escritorio).
  const currentIndex = FORM_STEPS.findIndex(s => s.id === activeTab);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === FORM_STEPS.length - 1;
  const prevStep = !isFirstStep ? FORM_STEPS[currentIndex - 1].id as FormStepId : null;
  const nextStep = !isLastStep ? FORM_STEPS[currentIndex + 1].id as FormStepId : null;
  const canPublish = allStepsCompleted && (!hasCertifications || certificationsApproved);

  const BLOCKING_STEPS: FormStepId[] = ['basic', 'images', 'pricing', 'inventory'];
  const isMobileStepBlocked = BLOCKING_STEPS.includes(activeTab) && currentStepErrors.length > 0;

  const handlePrev = () => {
    setShowMobileErrors(false);
    if (prevStep) { handleTabChange(prevStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handleNext = () => {
    if (isMobileStepBlocked) {
      setShowMobileErrors(true);
      return;
    }
    setShowMobileErrors(false);
    if (nextStep) { handleTabChange(nextStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  // Esta página renderiza su propia ActionBar móvil (fixed bottom-0) — oculta
  // el BottomTabBar global para que no se pinte encima de ella.
  useHideBottomTabBar();

  return (
    <div className="w-full">
      {/* Elementos decorativos — solo desktop */}
      <div className="hidden lg:block fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="hidden lg:block fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PageHeader
        title="Crear producto"
        description="Completa los pasos para publicar tu producto"
        badgeIcon={Package}
        badgeText="Nuevo producto"
        tooltip="Creación de producto"
        tooltipDetailed="Completa todos los pasos para publicar tu producto en el catálogo"
        showBackButton
        onBack={() => setShowCancelDialog(true)}
        actions={
          <div className="flex items-center gap-2">
            {/* Oculto en móvil: PageHeader coloca `actions` en un contenedor
                shrink-0 sin wrap junto al título -- este texto es el ancho
                justo para desbordar/aplastar el título a 375px. El estado de
                guardado ya se ve en el botón "Guardar" del ActionBar móvil. */}
            {lastSaved && (
              <span className="hidden sm:inline text-xs text-text-subtle">
                Último guardado: {lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <CreateProductProgress
          currentTab={activeTab}
          completedTabs={completedTabs}
          onTabChange={handleTabChange}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6"
        >
          {/* padding inferior móvil — reserva el alto del ActionBar fijo.
              ActionBar (showOnDesktop=false, por defecto) solo se oculta a
              partir de lg: (1024px) -- no de sm: -- así que el padding y el
              wrapper de CreateProductNavigation de abajo deben cancelarse/
              mostrarse en el MISMO breakpoint (lg:) o queda un hueco de
              640-1023px sin espacio reservado mientras la ActionBar sigue
              fija abajo, tapando el formulario. */}
          <div className={`lg:col-span-2 space-y-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 64)} lg:pb-0`}>
            <ProductFormSteps
              activeTab={activeTab}
              formData={formData}
              completedTabs={completedTabs}
              onInputChange={handleInputChange}
              onNestedChange={handleNestedChange}
              onPriceTiersChange={handlePriceTiersChange}
              onImagesChange={handleImagesChange}
            />

            {/* Navegación de pasos — sólo visible en ≥ lg; hasta ahí usa ActionBar */}
            <div className="hidden lg:block">
              <CreateProductNavigation
                currentTab={activeTab}
                onTabChange={handleTabChange}
                completedTabs={completedTabs}
                currentStepErrors={currentStepErrors}
                onSave={handleSave}
                isSaving={isSaving}
                allStepsCompleted={allStepsCompleted}
                hasCertifications={hasCertifications}
                certificationsApproved={certificationsApproved}
                hasPendingManualCerts={hasPendingManualCerts}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                publishStatus={publishStatus}
                publishError={publishError}
              />
            </div>
          </div>

          <ProductFormSidebar
            tips={tips}
            keyFact={KEY_FACTS_BY_STEP[stepNumber]}
          />
        </motion.div>
      </div>

      {/* Panel de errores móvil — aparece sobre el ActionBar */}
      {showMobileErrors && currentStepErrors.length > 0 && (
        <div className={`sm:hidden fixed ${appShellBottomOffsetClass(NAV_HEIGHT_MOBILE_DASHBOARD, 40)} left-0 right-0 z-50 mx-4`}>
          <Alert
            variant="error"
            className="shadow-lg"
            trailing={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileErrors(false)}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            }
          >
            <AlertTitle>Completa los campos obligatorios</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1 mt-1">
                {currentStepErrors.map((err, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-feedback-danger shrink-0" aria-hidden="true" />
                    {err}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ActionBar móvil — navegación entre pasos con pulgar */}
      <ActionBar
        primaryAction={{
          id: 'primary',
          label: isLastStep ? (!canPublish ? 'Completa todos los pasos' : 'Publicar') : (isMobileStepBlocked ? 'Completa este paso' : 'Siguiente'),
          onClick: isLastStep ? handlePublish : handleNext,
          disabled: isLastStep ? (isPublishing || !canPublish) : false,
          loading: isLastStep ? isPublishing : false,
          loadingText: 'Publicando...',
          rightIcon: !isLastStep ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : undefined,
          leftIcon: isLastStep ? <Send className="w-4 h-4" aria-hidden="true" /> : undefined,
        }}
        secondaryActions={[
          {
            id: 'prev',
            label: 'Anterior',
            onClick: handlePrev,
            disabled: isFirstStep,
            variant: 'secondary',
            leftIcon: <ChevronLeft className="w-4 h-4" aria-hidden="true" />,
          },
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Guardar',
            onClick: handleSave,
            disabled: isSaving,
            loading: isSaving,
            variant: 'secondary',
            leftIcon: isSaving
              ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Save className="w-4 h-4" aria-hidden="true" />,
          },
        ]}
      />

      <CreateProductCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
      />

      <SuccessPublishModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        productName={formData.name || 'Producto'}
      />

    </div>
  );
}
