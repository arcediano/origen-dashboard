/**
 * @component ProductFormSteps
 * @description AnimatePresence step renderer — shared between create and edit pages.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type Variants } from 'framer-motion';

import { StepBasic } from './steps/StepBasic';
import { StepImages } from './steps/StepImages';
import { StepPricingInventory } from './steps/StepPricingInventory';
import { StepNutritional } from './steps/StepNutritional';
import { StepProduction } from './steps/StepProduction';
import { StepCertificationsAttributes } from './steps/StepCertificationsAttributes';

import { defaultNutritionalInfo, defaultProductionInfo, type FormStepId } from '@/types/product';

// ─── Variantes ────────────────────────────────────────────────────────────────

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormStepsProps {
  activeTab: FormStepId;
  formData: any;
  completedTabs: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  onNestedChange: (section: string, field: string, value: any) => void;
  onImagesChange: (images: any[]) => void;
  skuSuggestion?: string;
  /** ID del producto en modo edición — permite llamadas granulares a la API de certs/variantes. */
  productId?: string;
  /** Indica si el producto está publicado (ACTIVE u OUT_OF_STOCK). Usado para mostrar indicadores de campos sensibles. */
  isPublishedProduct?: boolean;
  /** VariantsEditor notifica aquí tras guardar/eliminar variantes (dentro del paso unificado de precio/variantes/inventario). */
  onVariantsChange?: (count: number) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductFormSteps({
  activeTab,
  formData,
  completedTabs,
  onInputChange,
  onNestedChange,
  onImagesChange,
  skuSuggestion,
  productId,
  isPublishedProduct,
  onVariantsChange,
}: ProductFormStepsProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -20 }}
      >
        {activeTab === 'basic' && (
          <StepBasic
            formData={formData}
            errors={{}}
            touched={{}}
            onInputChange={onInputChange}
            completed={completedTabs.basic}
            isPublishedProduct={isPublishedProduct}
          />
        )}

        {activeTab === 'images' && (
          <StepImages
            gallery={formData.gallery}
            onImagesChange={onImagesChange}
            completed={completedTabs.images}
            isPublishedProduct={isPublishedProduct}
          />
        )}

        {activeTab === 'pricing' && (
          <StepPricingInventory
            formData={formData}
            onInputChange={onInputChange}
            onNestedChange={onNestedChange}
            completed={completedTabs.pricing}
            skuSuggestion={skuSuggestion}
            productId={productId}
            onVariantsChange={onVariantsChange}
          />
        )}

        {activeTab === 'nutritional' && (
          <StepNutritional
            nutritionalInfo={formData.nutritionalInfo || defaultNutritionalInfo}
            onNestedChange={onNestedChange}
            completed={completedTabs.nutritional}
            isPublishedProduct={isPublishedProduct}
          />
        )}

        {activeTab === 'production' && (
          <StepProduction
            productionInfo={formData.productionInfo || defaultProductionInfo}
            onNestedChange={onNestedChange}
            completed={completedTabs.production}
            isPublishedProduct={isPublishedProduct}
          />
        )}

        {activeTab === 'certifications' && (
          <StepCertificationsAttributes
            certifications={formData.certifications}
            attributes={formData.attributes}
            onCertificationsChange={(certs) => onInputChange('certifications', certs)}
            onAttributesChange={(attrs) => onInputChange('attributes', attrs)}
            completed={completedTabs.certifications}
            productCategory={formData.categoryName || formData.categoryId}
            productId={productId}
            isPublishedProduct={isPublishedProduct}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
