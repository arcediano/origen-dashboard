
/**
 * @file CreateProductProgress.tsx
 * @description Barra de progreso y navegación de pasos para creación de productos.
 * Envoltorio fino sobre `WizardProgress` (compartido con el onboarding).
 */

'use client';

import React from 'react';
import { Package, Camera, DollarSign, FlaskConical, Leaf, ShoppingBag, Award, Boxes } from 'lucide-react';
import { WizardProgress } from '@/components/shared/wizard-progress';
import { FORM_STEPS, type FormStepId } from '@/types/product';

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  FlaskConical: <FlaskConical className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  Boxes: <Boxes className="w-4 h-4" />,
};

const PRODUCT_STEPS = FORM_STEPS.map((s) => ({ id: s.id, label: s.label, icon: iconMap[s.icon] }));

export interface CreateProductProgressProps {
  /** Paso actual */
  currentTab: FormStepId;
  /** Pasos completados */
  completedTabs: Record<string, boolean>;
  /** Función para cambiar de paso */
  onTabChange: (tab: FormStepId) => void;
  /** Para usarlo dentro de la columna lateral (junto a "Consejos útiles"), con su propio `sticky` — ver `WizardProgress`. */
  embedded?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/** Progreso y navegación de pasos para creación de productos (solo se puede saltar al siguiente). */
export function CreateProductProgress({
  currentTab,
  completedTabs,
  onTabChange,
  embedded,
  className,
}: CreateProductProgressProps) {
  return (
    <WizardProgress
      steps={PRODUCT_STEPS}
      currentId={currentTab}
      completed={completedTabs}
      onStepChange={(id) => onTabChange(id as FormStepId)}
      idPrefix="create-product"
      tooltip={{
        content: 'Completa todos los pasos',
        detailed: 'Cada paso debe estar completado para poder publicar el producto',
      }}
      embedded={embedded}
      className={className}
    />
  );
}
