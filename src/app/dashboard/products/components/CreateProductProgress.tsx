/**
 * @file CreateProductProgress.tsx
 * @description Barra de progreso y navegación de pasos para creación de productos.
 *
 * Mobile: versión compacta sticky (sin Card) pegada al top justo bajo MobileTopBar.
 *   - Muestra: nombre del paso actual + porcentaje + barra de progreso + iconos de pasos.
 *   - Altura total ~85px (vs ~180px de la versión anterior).
 * Desktop: versión completa con Card, igual que antes.
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
  Package:     <Package     className="w-3.5 h-3.5" />,
  Camera:      <Camera      className="w-3.5 h-3.5" />,
  DollarSign:  <DollarSign  className="w-3.5 h-3.5" />,
  FlaskConical:<FlaskConical className="w-3.5 h-3.5" />,
  Leaf:        <Leaf        className="w-3.5 h-3.5" />,
  ShoppingBag: <ShoppingBag className="w-3.5 h-3.5" />,
  Award:       <Award       className="w-3.5 h-3.5" />,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface CreateProductProgressProps {
  currentTab: FormStepId;
  completedTabs: Record<string, boolean>;
  onTabChange: (tab: FormStepId) => void;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CreateProductProgress({
  currentTab,
  completedTabs,
  onTabChange,
  className,
}: CreateProductProgressProps) {
  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentTab);
  const currentStep  = FORM_STEPS[currentIndex];
  const progress     = ((currentIndex + 1) / FORM_STEPS.length) * 100;

  return (
    <div
      className={cn(
        // Sticky: top-14 en mobile (56px = altura de MobileTopBar), top-16 en desktop
        'sticky top-14 lg:top-16 z-20',
        // Margen negativo para sangrar al ancho completo del container
        '-mx-4 sm:-mx-6 px-4 sm:px-6',
        className
      )}
    >

      {/* ── MÓVIL: barra compacta ────────────────────────────────────────────── */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-border pt-2.5 pb-3">

        {/* Fila 1: nombre del paso actual + porcentaje */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-origen-bosque truncate">
            <span className="text-origen-pradera mr-1">
              {currentIndex + 1}/{FORM_STEPS.length}.
            </span>
            {currentStep?.label}
          </span>
          <span className="text-xs font-medium text-origen-pradera shrink-0">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Fila 2: barra de progreso */}
        <Progress value={progress} variant="leaf" size="sm" showLabel={false} className="mb-2.5" />

        {/* Fila 3: iconos de pasos (sin etiquetas de texto) */}
        <div className="flex items-center justify-between gap-1">
          {FORM_STEPS.map((step, index) => {
            const isActive    = step.id === currentTab;
            const isCompleted = completedTabs[step.id];
            const isClickable = index <= currentIndex + 1;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onTabChange(step.id as FormStepId)}
                disabled={!isClickable}
                aria-label={`Ir a paso: ${step.label}`}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200',
                  isActive     && 'border-origen-pradera bg-origen-pradera/10 shadow-sm shadow-origen-pradera/20',
                  isCompleted  && !isActive && 'border-origen-pradera bg-origen-pradera text-white',
                  !isActive    && !isCompleted && 'border-border bg-surface-alt text-text-subtle',
                  !isClickable && 'cursor-not-allowed opacity-40'
                )}
              >
                {isCompleted && !isActive
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : iconMap[step.icon]
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP: tarjeta completa ─────────────────────────────────────────── */}
      <div className="hidden lg:block bg-gradient-to-b from-origen-crema/30 to-transparent pt-2 pb-4">
        <Card variant="elevated" className="p-5">

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
          <Progress value={progress} variant="leaf" size="sm" showLabel={false} className="mb-5" />

          {/* Navegación de pasos */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-origen">
            {FORM_STEPS.map((step, index) => {
              const isActive    = step.id === currentTab;
              const isCompleted = completedTabs[step.id];
              const isClickable = index <= currentIndex + 1;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onTabChange(step.id as FormStepId)}
                  className={cn(
                    'group/step relative flex flex-col items-center gap-2 transition-all duration-300 flex-shrink-0',
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  )}
                  disabled={!isClickable}
                  aria-label={`Ir al paso ${step.label}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <div className={cn(
                    'relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                    isActive     && 'border-origen-pradera bg-origen-pradera/10 shadow-lg shadow-origen-pradera/20',
                    isCompleted  && !isActive && 'border-origen-pradera bg-origen-pradera text-white',
                    !isActive    && !isCompleted && 'border-border bg-surface-alt text-text-subtle'
                  )}>
                    {/* Icons para desktop: tamaño original w-4 h-4 */}
                    {isCompleted && !isActive
                      ? <CheckCircle className="w-4 h-4" />
                      : <span className="[&_svg]:w-4 [&_svg]:h-4">{iconMap[step.icon]}</span>
                    }
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium text-center max-w-[60px] truncate',
                    isActive     && 'text-origen-bosque',
                    isCompleted  && !isActive && 'text-origen-pradera',
                    !isActive    && !isCompleted && 'text-text-subtle'
                  )}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

        </Card>
      </div>

    </div>
  );
}
