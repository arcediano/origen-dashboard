/**
 * @page EditProductPage
 * @description Página de edición de productos.
 */

'use client';

import { useParams } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Package, ChevronLeft, ChevronRight, Save, Send, RefreshCw } from 'lucide-react';

import { Badge, ActionBar } from '@arcediano/ux-library';
import { PageHeader } from '../../../components/PageHeader';
import { PageLoader } from '@/components/shared/loading/page-loader';
import { PageError } from '@/components/shared/error/page-error';

import {
  CreateProductProgress,
  CreateProductNavigation,
  CreateProductCancelDialog,
  SuccessPublishModal,
} from '../../components';
import { ProductFormSteps } from '../../components/ProductFormSteps';
import { ProductFormSidebar } from '../../components/ProductFormSidebar';

import { useProductForm } from '@/hooks/useProductForm';
import { useStepTips, KEY_FACTS_BY_STEP } from '@/hooks/useStepTips';
import { FORM_STEPS, type FormStepId } from '@/types/product';

// ─── Animaciones ──────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const {
    formData,
    activeTab,
    setActiveTab,
    completedTabs,
    isLoading,
    error,
    isSaving,
    isAutoSaving,
    lastSaved,
    isPublishing,
    publishStatus,
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    skuSuggestion,
    allStepsCompleted,
    hasCertifications,
    certificationsApproved,
    isEditMode,
    handleInputChange,
    handleNestedChange,
    handlePriceTiersChange,
    handleImagesChange,
    handleSave,
    handlePublish,
    handleCancel,
    reloadProduct,
  } = useProductForm(productId);

  const stepNumber = FORM_STEPS.findIndex(s => s.id === activeTab) + 1;
  const tips = useStepTips(stepNumber, formData);

  const handleTabChange = (tab: FormStepId) => setActiveTab(tab);

  // ─── Navegación por pasos (usado por ActionBar móvil) ─────────────────────
  const currentIndex = FORM_STEPS.findIndex(s => s.id === activeTab);
  const isFirstStep  = currentIndex === 0;
  const isLastStep   = currentIndex === FORM_STEPS.length - 1;
  const prevStep     = !isFirstStep ? FORM_STEPS[currentIndex - 1].id as FormStepId : null;
  const nextStep     = !isLastStep  ? FORM_STEPS[currentIndex + 1].id as FormStepId : null;
  const canPublish   = allStepsCompleted && (!hasCertifications || certificationsApproved);

  const handlePrev = () => {
    if (prevStep) { handleTabChange(prevStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handleNext = () => {
    if (nextStep) { handleTabChange(nextStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  if (isLoading) return <PageLoader message="Cargando producto..." />;
  if (error) return <PageError title="Error al cargar" message={error} onRetry={reloadProduct} />;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Elementos decorativos — solo desktop */}
      <div className="hidden lg:block fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="hidden lg:block fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PageHeader
        title="Editar producto"
        description={`Editando: ${formData.name || 'Producto sin nombre'} · ${formData.sku || 'SKU no asignado'}`}
        badgeIcon={Package}
        badgeText={isEditMode ? 'Editando producto' : 'Nuevo producto'}
        tooltip="Edición de producto"
        tooltipDetailed="Modifica la información de tu producto existente"
        showBackButton
        onBack={() => setShowCancelDialog(true)}
        actions={
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-text-subtle">
                {isAutoSaving ? 'Guardando...' : `Guardado ${lastSaved.toLocaleTimeString()}`}
              </span>
            )}
            {isEditMode && formData.sku && (
              <Badge variant="leaf" size="sm" className="hidden sm:flex items-center gap-1">
                <Package className="w-3 h-3" />
                SKU: {formData.sku}
              </Badge>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(152px+env(safe-area-inset-bottom))] lg:pb-8">
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
          <div className="lg:col-span-2 space-y-6">
            <ProductFormSteps
              activeTab={activeTab}
              formData={formData}
              completedTabs={completedTabs}
              onInputChange={handleInputChange}
              onNestedChange={handleNestedChange}
              onPriceTiersChange={handlePriceTiersChange}
              onImagesChange={handleImagesChange}
              skuSuggestion={skuSuggestion}
              productId={productId}
            />

            {/* Navegación de pasos — sólo visible en ≥ sm; en móvil usa ActionBar */}
            <div className="hidden sm:block">
              <CreateProductNavigation
                currentTab={activeTab}
                onTabChange={handleTabChange}
                completedTabs={completedTabs}
                onSave={handleSave}
                isSaving={isSaving}
                allStepsCompleted={allStepsCompleted}
                hasCertifications={hasCertifications}
                certificationsApproved={certificationsApproved}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                publishStatus={publishStatus}
              />
            </div>
          </div>

          <ProductFormSidebar
            tips={tips}
            keyFact={KEY_FACTS_BY_STEP[stepNumber]}
          />
        </motion.div>
      </div>

      {/* ── ActionBar móvil — navegación entre pasos con pulgar ── */}
      <ActionBar
        primaryAction={{
          id: 'primary',
          label: isLastStep ? 'Publicar' : 'Siguiente',
          onClick: isLastStep ? handlePublish : handleNext,
          disabled: isLastStep ? (isPublishing || !canPublish) : false,
          loading: isLastStep ? isPublishing : false,
          loadingText: isPublishing ? 'Publicando...' : undefined,
          rightIcon: !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined,
          leftIcon: isLastStep ? <Send className="w-4 h-4" /> : undefined,
        }}
        secondaryActions={[
          {
            id: 'prev',
            label: 'Anterior',
            onClick: handlePrev,
            disabled: isFirstStep,
            leftIcon: <ChevronLeft className="w-4 h-4" />,
          },
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Guardar',
            onClick: handleSave,
            disabled: isSaving,
            loading: isSaving,
            leftIcon: isSaving
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />,
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

