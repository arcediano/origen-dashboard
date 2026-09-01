/**
 * @file CreateProductProgress.tsx
 * @description Barra de progreso y navegación de pasos para creación de productos
 */

'use client';

import React from 'react';
import { Package, Camera, DollarSign, FlaskConical, Leaf, ShoppingBag, Award, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
  /** Función para cambiar de paso */
  onTabChange: (tab: FormStepId) => void;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Barra de progreso y navegación de pasos para creación de productos
 */
export function CreateProductProgress({
  currentTab,
  completedTabs,
  onTabChange,
  className,
}: CreateProductProgressProps) {
  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentTab);
  const currentStep = FORM_STEPS[currentIndex];
  const progress = ((currentIndex + 1) / FORM_STEPS.length) * 100;
  // Colapsado por defecto en móvil (bug-panel-progreso-movil-v2, 2026-09-01):
  // el resumen de una línea "Paso X de N" sustituye a los 7 iconos siempre
  // visibles, que seguían ocupando demasiada altura incluso sin etiquetas de
  // texto. En escritorio (sm+) la navegación completa se muestra siempre,
  // sin depender de este estado.
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={cn('sticky top-16 z-20 bg-gradient-to-b from-origen-crema/30 to-transparent pt-2 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6', className)}>
      <Card variant="elevated" className="p-3 sm:p-5">
        {/* Cabecera con progreso */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-hoja-tinta" />
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
        <Progress value={progress} variant="leaf" size="sm" showLabel={false} className="mb-2 sm:mb-5" />

        {/* Resumen compacto en móvil: "Paso X de N — nombre" con toggle para
            expandir a la navegación completa (icono + etiqueta) cuando se
            quiera saltar directamente a otro paso. En escritorio (sm+) no se
            muestra — ahí la navegación completa está siempre visible. */}
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full flex items-center justify-between gap-2 mb-2 py-1 sm:hidden"
          aria-expanded={isExpanded}
          aria-controls="create-product-steps-nav"
        >
          <span className="text-xs font-medium text-origen-bosque">
            Paso {currentIndex + 1} de {FORM_STEPS.length} — {currentStep.label}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-subtle flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-subtle flex-shrink-0" aria-hidden="true" />
          )}
        </button>

        {/* Navegación de pasos — degradado a la derecha como pista de que hay
            más pasos fuera de pantalla en móvil (7 pasos no caben a 375px).
            En móvil, oculta salvo que `isExpanded` esté activo (toggle de
            arriba); en escritorio (sm+) siempre visible. */}
        <div
          id="create-product-steps-nav"
          className={cn('relative', !isExpanded && 'hidden sm:block')}
        >
          <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-origen snap-x snap-mandatory">
            {FORM_STEPS.map((step, index) => {
              const isActive = step.id === currentTab;
              const isCompleted = completedTabs[step.id];
              const isClickable = index <= currentIndex + 1;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onTabChange(step.id as FormStepId)}
                  className={cn(
                    "group/step relative flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 flex-shrink-0 min-w-[40px] sm:min-w-[60px] snap-start",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                  )}
                  disabled={!isClickable}
                  aria-label={`Ir al paso ${step.label}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className={cn(
                    "relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                    isActive && "border-origen-pradera bg-origen-pradera/10 shadow-lg shadow-origen-pradera/20",
                    isCompleted && !isActive && "border-origen-bosque bg-origen-bosque text-white",
                    !isActive && !isCompleted && "border-border bg-surface-alt text-text-subtle"
                  )}>
                    {isCompleted && !isActive ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      iconMap[step.icon]
                    )}
                  </div>
                  {/* Etiqueta de texto: en móvil solo visible cuando el panel
                      está expandido (`isExpanded`, toggle "Paso X de N" de
                      arriba); en escritorio (sm+) siempre visible. Con el
                      panel colapsado en móvil, `MobileCardList`-style
                      `sr-only` la mantiene disponible para lectores de
                      pantalla sin ocupar espacio visual.
                      `sr-only`/`not-sr-only` en vez de `hidden`/`block`:
                      `hidden` fija `display:none`, que compite con el
                      `display:-webkit-box` de `line-clamp-2` (misma
                      propiedad, sin media query que las diferencie) y
                      `line-clamp-2` ganaba por orden de generación de
                      Tailwind — la etiqueta seguía visible pese a `hidden`.
                      `sr-only` no toca `display`, evita el conflicto. */}
                  <span className={cn(
                    isExpanded ? "not-sr-only" : "sr-only",
                    "sm:not-sr-only text-[10px] sm:text-xs font-medium text-center max-w-[52px] sm:max-w-[60px] leading-tight line-clamp-2",
                    isActive && "text-origen-bosque",
                    isCompleted && !isActive && "text-hoja-tinta",
                    !isActive && !isCompleted && "text-text-subtle"
                  )}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" aria-hidden="true" />
        </div>
      </Card>
    </div>
  );
}

