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

import { defaultNutritionalInfo, defaultProductionInfo, type FormStepId, type PriceTier } from '@/types/product';

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
  onPriceTiersChange: (tiers: PriceTier[]) => void;
  onImagesChange: (images: any[]) => void;
  skuSuggestion?: string;
  /** ID del producto en modo edición — permite llamadas granulares a la API de certs. */
  productId?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductFormSteps({
  activeTab,
  formData,
  completedTabs,
  onInputChange,
  onNestedChange,
  onPriceTiersChange,
  onImagesChange,
  skuSuggestion,
  productId,
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
          />
        )}

        {activeTab === 'images' && (
          <StepImages
            gallery={formData.gallery}
            onImagesChange={onImagesChange}
            completed={completedTabs.images}
          />
        )}

        {activeTab === 'pricing' && (
          <StepPricing
            formData={formData}
            errors={{}}
            touched={{}}
            onInputChange={onInputChange}
            onPriceTiersChange={onPriceTiersChange}
            completed={completedTabs.pricing}
          />
        )}

        {activeTab === 'nutritional' && (
          <StepNutritional
            nutritionalInfo={formData.nutritionalInfo || defaultNutritionalInfo}
            onNestedChange={onNestedChange}
            completed={completedTabs.nutritional}
          />
        )}

        {activeTab === 'production' && (
          <StepProduction
            productionInfo={formData.productionInfo || defaultProductionInfo}
            onNestedChange={onNestedChange}
            completed={completedTabs.production}
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
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
