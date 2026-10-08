/**
 * @component ProductFormSteps
 * @description AnimatePresence step renderer — shared between create and edit pages.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type Variants } from 'framer-motion';

import { StepBasic } from './steps/StepBasic';
import { StepImages } from './steps/StepImages';
import { StepPricing } from './steps/StepPricing';
import { StepNutritional } from './steps/StepNutritional';
import { StepProduction } from './steps/StepProduction';
import { StepInventory } from './steps/StepInventory';
import { StepCertificationsAttributes } from './steps/StepCertificationsAttributes';
import { StepVariants } from './steps/StepVariants';

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
  /** ID del producto en modo edición — permite llamadas granulares a la API de certs. */
  productId?: string;
  /** Indica si el producto está publicado (ACTIVE u OUT_OF_STOCK). Usado para mostrar indicadores de campos sensibles. */
  isPublishedProduct?: boolean;
  /** Clave de cupo del asistente de IA en modo creación (en edición se usa `productId`). */
  aiAssistKey?: string | null;
  /** Notifica que el asistente de IA ha consumido cupo en este producto. */
  onAiAssistUsed?: () => void;
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
  aiAssistKey,
  onAiAssistUsed,
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
            aiAssistKey={aiAssistKey ?? productId ?? null}
            onAiAssistUsed={onAiAssistUsed}
            aiAssistUnlimited={!!productId}
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
          <StepPricing
            formData={formData}
            errors={{}}
            touched={{}}
            onInputChange={onInputChange}
            completed={completedTabs.pricing}
          />
        )}

        {activeTab === 'nutritional' && (
          <StepNutritional
            nutritionalInfo={formData.nutritionalInfo || defaultNutritionalInfo}
            onNestedChange={onNestedChange}
            completed={completedTabs.nutritional}
            isPublishedProduct={isPublishedProduct}
            aiAssistKey={aiAssistKey ?? productId ?? null}
            onAiAssistUsed={onAiAssistUsed}
            aiAssistUnlimited={!!productId}
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

        {activeTab === 'inventory' && (
          <StepInventory
            formData={formData}
            onInputChange={onInputChange}
            onNestedChange={onNestedChange}
            completed={completedTabs.inventory}
            skuSuggestion={skuSuggestion}
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

        {activeTab === 'variants' && (
          <StepVariants
            productId={productId}
            basePrice={formData.basePrice}
            completed={completedTabs.variants}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
