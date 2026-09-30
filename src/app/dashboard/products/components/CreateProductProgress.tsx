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
 * Detecta si el usuario ha hecho scroll: un centinela de 1 px justo encima de la
 * cabecera fija deja de ser visible y la cabecera pasa a su forma compacta. Así
 * el panel ocupa toda su altura solo arriba del todo y en cuanto se trabaja en el
 * formulario cede el espacio (decisión 2026-09-30: la cabecera anterior, con dos
 * barras y las etiquetas siempre visibles, se comía casi 200 px de trabajo).
 */
function useCondensedOnScroll() {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [condensed, setCondensed] = React.useState(false);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' }, // 72 px = altura de la barra superior fija
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, condensed };
}

/**
 * Progreso y navegación de pasos para creación de productos.
 *
 * Una sola barra de progreso. Arriba del todo: título del paso, porcentaje y
 * los 7 pasos con su etiqueta. Con scroll: una fila compacta (pasos como iconos,
 * "Paso X de N" y porcentaje) y la barra fina debajo.
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
  const { sentinelRef, condensed } = useCondensedOnScroll();
  // Móvil: resumen de una línea "Paso X de N" con toggle para ver los pasos
  // (bug-panel-progreso-movil-v2, 2026-09-01). Con scroll se pliega solo.
  const [isExpanded, setIsExpanded] = React.useState(false);
  React.useEffect(() => {
    if (condensed) setIsExpanded(false);
  }, [condensed]);

  const stepButtons = FORM_STEPS.map((step, index) => {
    const isActive = step.id === currentTab;
    const isCompleted = completedTabs[step.id];
    const isClickable = index <= currentIndex + 1;
    // Visibilidad de la etiqueta: arriba del todo, siempre en escritorio y con el
    // panel expandido en móvil; al condensar, solo en móvil expandido.
    const labelClass = condensed
      ? isExpanded ? 'not-sr-only sm:sr-only' : 'sr-only'
      : isExpanded ? 'not-sr-only' : 'sr-only sm:not-sr-only';

    return (
      <button
        key={step.id}
        type="button"
        onClick={() => isClickable && onTabChange(step.id as FormStepId)}
        className={cn(
          'group/step relative flex min-w-0 flex-col items-center gap-1 transition-all duration-300',
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
        )}
        disabled={!isClickable}
        aria-label={`Ir al paso ${step.label}`}
        aria-current={isActive ? 'step' : undefined}
      >
        <div
          className={cn(
            'relative flex items-center justify-center rounded-xl border-2 transition-all duration-300',
            condensed ? 'h-7 w-7' : 'h-9 w-9 sm:h-10 sm:w-10',
            isActive && 'border-origen-pradera bg-origen-pradera/10 shadow-lg shadow-origen-pradera/20',
            isCompleted && !isActive && 'border-origen-bosque bg-origen-bosque text-white',
            !isActive && !isCompleted && 'border-border bg-surface-alt text-text-subtle',
          )}
        >
          {isCompleted && !isActive ? <CheckCircle className="h-4 w-4" /> : iconMap[step.icon]}
        </div>
        {/* Etiqueta: oculta al condensar (sigue disponible para lectores de pantalla)
            y, en móvil, solo con el panel expandido. `sr-only` en vez de `hidden`
            para no chocar con el display de `line-clamp-2`. */}
        <span
          className={cn(
            labelClass,
            'w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs',
            isActive && 'text-origen-bosque',
            isCompleted && !isActive && 'text-hoja-tinta',
            !isActive && !isCompleted && 'text-text-subtle',
          )}
        >
          {step.label}
        </span>
      </button>
    );
  });

  const stepLabel = `Paso ${currentIndex + 1} de ${FORM_STEPS.length} — ${currentStep.label}`;
  const percentBadge = (
    <Badge variant="leaf" size="sm" className="bg-origen-pradera/10">
      {Math.round(progress)}%<span className="hidden sm:inline"> completado</span>
    </Badge>
  );
  const chevron = isExpanded ? (
    <ChevronUp className="h-4 w-4 text-text-subtle sm:hidden" aria-hidden="true" />
  ) : (
    <ChevronDown className="h-4 w-4 text-text-subtle sm:hidden" aria-hidden="true" />
  );

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <div
        className={cn(
          'sticky top-16 z-20 -mx-4 bg-linear-to-b from-origen-crema/30 to-transparent px-4 pt-2 sm:-mx-6 sm:px-6',
          condensed ? 'pb-1.5' : 'pb-4',
          className,
        )}
      >
        <Card variant="elevated" padding="none" className={cn('transition-all duration-200', condensed ? 'px-3 py-1.5 sm:px-4' : 'p-3 sm:p-5')}>
          {condensed ? (
            /* Compacta (con scroll): una sola fila — pasos como iconos, paso actual y % —
               y la barra fina debajo. En móvil los iconos van tras el toggle. */
            <div className="flex items-center gap-3">
              <div className="hidden shrink-0 grid-cols-7 gap-1.5 sm:grid" id="create-product-steps-nav-compact">
                {stepButtons}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 py-0.5 text-left sm:pointer-events-none"
                aria-expanded={isExpanded}
                aria-controls="create-product-steps-nav"
              >
                <span className="truncate text-xs font-medium text-origen-bosque sm:text-sm">{stepLabel}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {percentBadge}
                  {chevron}
                </span>
              </button>
            </div>
          ) : (
            /* Completa (arriba del todo): título del paso + % y, debajo, los 7 pasos con etiqueta. */
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="flex w-full items-center justify-between gap-2 py-0.5 text-left sm:pointer-events-none"
              aria-expanded={isExpanded}
              aria-controls="create-product-steps-nav"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-origen-pradera/10">
                  <TrendingUp className="h-3 w-3 text-hoja-tinta" aria-hidden="true" />
                </span>
                <span className="truncate text-xs font-medium text-origen-bosque sm:text-sm">{stepLabel}</span>
                <span className="hidden sm:inline-flex">
                  <Tooltip
                    content="Completa todos los pasos"
                    detailed="Cada paso debe estar completado para poder publicar el producto"
                    size="sm"
                  />
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {percentBadge}
                {chevron}
              </span>
            </button>
          )}

          {/* La única barra de progreso */}
          <Progress value={progress} variant="leaf" size="sm" showLabel={false} className={condensed ? 'mt-1' : 'mt-2'} />

          {/* Pasos con etiqueta: 7 columnas iguales, sin scroll horizontal. Arriba del todo
              siempre en escritorio; en móvil solo con el panel expandido. Con scroll, solo
              en móvil expandido (en escritorio ya están los iconos de la fila compacta). */}
          <div
            id="create-product-steps-nav"
            className={cn(
              'grid grid-cols-7 gap-1 sm:gap-2',
              condensed ? 'mt-2 sm:hidden' : 'mt-3 sm:mt-4',
              !isExpanded && 'hidden',
              !condensed && 'sm:grid',
            )}
          >
            {stepButtons}
          </div>
        </Card>
      </div>
    </>
  );
}
