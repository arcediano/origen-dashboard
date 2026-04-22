/**
 * @page CreateProductPage
 * @description Página de creación de productos.
 */

'use client';

import { Package } from 'lucide-react';
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
import { FORM_STEPS, type FormStepId } from '@/types/product';
import { toast } from '@arcediano/ux-library';
import { useEffect } from 'react';

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
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    allStepsCompleted,
    hasCertifications,
    certificationsApproved,
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

  const handleTabChange = (tab: FormStepId) => setActiveTab(tab);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
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
          lastSaved && (
            <span className="text-xs text-text-subtle">
              Último guardado: {lastSaved.toLocaleTimeString()}
            </span>
          )
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
          <div className="lg:col-span-2 space-y-6">
            <ProductFormSteps
              activeTab={activeTab}
              formData={formData}
              completedTabs={completedTabs}
              onInputChange={handleInputChange}
              onNestedChange={handleNestedChange}
              onPriceTiersChange={handlePriceTiersChange}
              onImagesChange={handleImagesChange}
            />

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
              onPublish={handlePublish}
              isPublishing={isPublishing}
              publishStatus={publishStatus}
            />
          </div>

          <ProductFormSidebar
            tips={tips}
            keyFact={KEY_FACTS_BY_STEP[stepNumber]}
          />
        </motion.div>
      </div>

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
