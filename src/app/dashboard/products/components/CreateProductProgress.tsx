/**
 * @file CreateProductProgress.tsx
 * @description Barra de progreso y navegaciÃ³n de pasos para creaciÃ³n de productos
 */

'use client';

import React from 'react';
import { Package, Camera, DollarSign, FlaskConical, Leaf, ShoppingBag, Award, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@arcediano/ux-library';
import { Progress } from '@arcediano/ux-library';
import { Badge } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import { FORM_STEPS, type FormStepId } from '@/types/product';

// ============================================================================
// MAPA DE ICONOS
// ============================================================================

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  FlaskConical: <FlaskConical className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface CreateProductProgressProps {
  /** Paso actual */
  currentTab: FormStepId;
  /** Pasos completados */
  completedTabs: Record<string, boolean>;
  /** FunciÃ³n para cambiar de paso */
  onTabChange: (tab: FormStepId) => void;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Barra de progreso y navegaciÃ³n de pasos para creaciÃ³n de productos
 */
export function CreateProductProgress({
  currentTab,
  completedTabs,
  onTabChange,
  className,
}: CreateProductProgressProps) {
  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentTab);
  const progress = ((currentIndex + 1) / FORM_STEPS.length) * 100;

  return (
    <div className={cn('sticky top-16 z-20 bg-gradient-to-b from-origen-crema/30 to-transparent pt-2 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6', className)}>
      <Card variant="elevated" className="p-4 sm:p-5">
        {/* Cabecera con progreso */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-origen-pradera" />
            </div>
            <span className="text-xs font-medium text-origen-bosque">Progreso general</span>
            <Tooltip 
              content="Completa todos los pasos"
              detailed="Cada paso debe estar completado para poder publicar el producto"
              size="sm"
            />
          </div>
          <Badge variant="leaf" size="sm" className="bg-origen-pradera/10">
            {Math.round(progress)}% completado
          </Badge>
        </div>
        
        {/* Barra de progreso */}
        <Progress value={progress} variant="leaf" size="sm" showLabel={false} className="mb-4 sm:mb-5" />
        
        {/* NavegaciÃ³n de pasos */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-origen">
          {FORM_STEPS.map((step, index) => {
            const isActive = step.id === currentTab;
            const isCompleted = completedTabs[step.id];
            const isClickable = index <= currentIndex + 1;
            
            return (
              <button
                key={step.id}
                onClick={() => isClickable && onTabChange(step.id as FormStepId)}
                className={cn(
                  "group/step relative flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 flex-shrink-0",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                )}
                disabled={!isClickable}
                aria-label={`Ir al paso ${step.label}`}
                aria-current={isActive ? "step" : undefined}
              >
                <div className={cn(
                  "relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                  isActive && "border-origen-pradera bg-origen-pradera/10 shadow-lg shadow-origen-pradera/20",
                  isCompleted && !isActive && "border-origen-pradera bg-origen-pradera text-white",
                  !isActive && !isCompleted && "border-border bg-surface-alt text-text-subtle"
                )}>
                  {isCompleted && !isActive ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    iconMap[step.icon]
                  )}
                </div>
                <span className={cn(
                  "text-[8px] sm:text-[10px] font-medium text-center max-w-[40px] sm:max-w-[60px] truncate",
                  isActive && "text-origen-bosque",
                  isCompleted && !isActive && "text-origen-pradera",
                  !isActive && !isCompleted && "text-text-subtle"
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
