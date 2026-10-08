/**
 * @file wizard-progress.tsx
 * @description Cabecera de progreso y navegación de pasos para flujos multi-paso
 * (creación de producto, onboarding). Generaliza `CreateProductProgress`.
 *
 * Una sola barra de progreso. Arriba del todo: título del paso, porcentaje y los
 * pasos con su etiqueta. Con scroll, la cabecera se condensa en una fila compacta
 * (pasos como iconos, "Paso X de N" y porcentaje) con la barra fina debajo. En
 * móvil muestra un resumen de una línea con toggle para ver los pasos.
 */

'use client';

import React from 'react';
import { CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Progress, Badge, Tooltip } from '@arcediano/ux-library';

export interface WizardProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface WizardProgressProps {
  steps: readonly WizardProgressStep[];
  currentId: string;
  /** Pasos completados por id. */
  completed: Record<string, boolean>;
  onStepChange: (id: string) => void;
  /** Índice (0-based) máximo al que se puede saltar. Por defecto, el siguiente al actual. */
  maxReachableIndex?: number;
  /** Porcentaje (0-100) de la barra. Por defecto, posición del paso actual. */
  progress?: number;
  /** Prefijo único para los `id` de ARIA (varias cabeceras en una misma página). */
  idPrefix?: string;
  /** Clase `sticky top-*` (la cabecera se fija bajo la barra superior de la página). */
  stickyClassName?: string;
  /** Altura en px de la barra superior fija, para detectar el scroll. */
  stickyOffsetPx?: number;
  /** Ayuda contextual (solo escritorio, cabecera completa). */
  tooltip?: { content: string; detailed?: string };
  /**
   * Para usarlo dentro de otro contenedor que ya aplica su propio
   * `sticky`/`top` (p. ej. la columna lateral de creación/edición de
   * producto, junto a "Consejos útiles" — petición del humano, 2026-10-08:
   * el panel de pasos debe quedar encima de los consejos útiles y siempre
   * visible al hacer scroll). Apilar dos elementos con `sticky` propio e
   * independiente nunca alinea bien sus offsets, porque este panel cambia
   * de alto al condensarse con el scroll; la solución correcta es un único
   * `sticky` en el contenedor padre con ambos apilados dentro en flujo
   * normal. En `embedded`: sin `sticky` ni `position` propios (el padre ya
   * lo aplica) y sin el sangrado a los bordes (`-mx-4`/`-mx-6`) pensado
   * para ocupar todo el ancho de la página — aquí vive en una columna
   * estrecha con su propio padding.
   */
  embedded?: boolean;
  className?: string;
}

/**
 * Detecta si el usuario ha hecho scroll: un centinela de 1 px justo encima de la
 * cabecera fija deja de ser visible y la cabecera pasa a su forma compacta. Así
 * el panel ocupa toda su altura solo arriba del todo y en cuanto se trabaja en el
 * formulario cede el espacio.
 *
 * `enabled=false` desactiva el condensado por completo (el panel se queda
 * siempre en su forma completa) — usado en `embedded` (columna lateral junto
 * a "Consejos útiles"): ahí sí hay sitio de sobra para mantenerlo igual al
 * hacer scroll, pedido explícito del humano, 2026-10-08.
 */
function useCondensedOnScroll(offsetPx: number, enabled: boolean) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [condensed, setCondensed] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setCondensed(false);
      return;
    }
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { rootMargin: `-${offsetPx}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [offsetPx, enabled]);

  return { sentinelRef, condensed };
}

export function WizardProgress({
  steps,
  currentId,
  completed,
  onStepChange,
  maxReachableIndex,
  progress,
  idPrefix = 'wizard',
  stickyClassName = 'top-16',
  stickyOffsetPx = 72,
  tooltip,
  embedded = false,
  className,
}: WizardProgressProps) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentId));
  const currentStep = steps[currentIndex];
  const reachable = maxReachableIndex ?? currentIndex + 1;
  const percent = progress ?? ((currentIndex + 1) / steps.length) * 100;
  const { sentinelRef, condensed } = useCondensedOnScroll(stickyOffsetPx, !embedded);
  // Móvil: resumen de una línea "Paso X de N" con toggle para ver los pasos.
  // Con scroll se pliega solo.
  const [isExpanded, setIsExpanded] = React.useState(false);
  React.useEffect(() => {
    if (condensed) setIsExpanded(false);
  }, [condensed]);

  const navId = `${idPrefix}-steps-nav`;
  // En `embedded` (columna lateral estrecha, p. ej. junto a "Consejos útiles")
  // una sola fila con una columna por paso deja de caber a partir de cierto
  // número de pasos: el icono+etiqueta de cada uno se encoge tanto que el
  // texto se solapa en vez de truncarse. Se limita a 4 columnas como máximo
  // ahí y el grid pasa a envolver en varias filas automáticamente (sin tocar
  // el resto del layout); el resto de usos (a todo el ancho de página) sigue
  // con una columna por paso, donde ya hay sitio de sobra.
  const gridColumns = embedded ? Math.min(steps.length, 4) : steps.length;
  const gridStyle = { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` } as const;

  const stepButtons = steps.map((step, index) => {
    const isActive = step.id === currentId;
    const isCompleted = Boolean(completed[step.id]);
    const isClickable = index <= reachable;
    // Visibilidad de la etiqueta: arriba del todo, siempre en escritorio y con el
    // panel expandido en móvil; al condensar, solo en móvil expandido.
    const labelClass = condensed
      ? isExpanded ? 'not-sr-only sm:sr-only' : 'sr-only'
      : isExpanded ? 'not-sr-only' : 'sr-only sm:not-sr-only';

    return (
      <button
        key={step.id}
        type="button"
        onClick={() => isClickable && onStepChange(step.id)}
        className={cn(
          'group/step relative flex min-w-0 flex-col items-center gap-1 transition-all duration-300',
          // Área táctil mínima de 44 px en móvil
          'max-sm:min-h-11 justify-center',
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
        )}
        disabled={!isClickable}
        aria-label={`Ir al paso ${step.label}${isCompleted && !isActive ? ' (completado)' : ''}`}
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
          {isCompleted && !isActive ? <CheckCircle className="h-4 w-4" /> : step.icon}
        </div>
        {/* Etiqueta: `sr-only` en vez de `hidden` para no chocar con el display de `truncate`
            y mantenerla disponible para lectores de pantalla. */}
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

  const stepLabel = `Paso ${currentIndex + 1} de ${steps.length} — ${currentStep.label}`;
  const percentBadge = (
    <Badge variant="leaf" size="sm" className="bg-origen-pradera/10">
      {Math.round(percent)}%<span className="hidden sm:inline"> completado</span>
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
          embedded
            ? 'bg-linear-to-b from-origen-crema/30 to-transparent pt-2'
            : 'sticky z-20 -mx-4 bg-linear-to-b from-origen-crema/30 to-transparent px-4 pt-2 sm:-mx-6 sm:px-6',
          !embedded && stickyClassName,
          condensed ? 'pb-1.5' : 'pb-4',
          className,
        )}
      >
        <Card variant="elevated" padding="none" className={cn('transition-all duration-200', condensed ? 'px-3 py-1.5 sm:px-4' : 'p-3 sm:p-5')}>
          {condensed ? (
            /* Compacta (con scroll): una sola fila — pasos como iconos, paso actual y % —
               y la barra fina debajo. En móvil los iconos van tras el toggle. */
            <div className="flex items-center gap-3">
              <div className="hidden shrink-0 gap-1.5 sm:grid" style={gridStyle} id={`${navId}-compact`}>
                {stepButtons}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex max-sm:min-h-11 min-w-0 flex-1 items-center justify-between gap-2 py-0.5 text-left sm:pointer-events-none"
                aria-expanded={isExpanded}
                aria-controls={navId}
              >
                <span className="truncate text-xs font-medium text-origen-bosque sm:text-sm">{stepLabel}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {percentBadge}
                  {chevron}
                </span>
              </button>
            </div>
          ) : (
            /* Completa (arriba del todo): título del paso + % y, debajo, los pasos con etiqueta. */
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex max-sm:min-h-11 w-full items-center justify-between gap-2 py-0.5 text-left sm:pointer-events-none"
              aria-expanded={isExpanded}
              aria-controls={navId}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-origen-pradera/10">
                  <TrendingUp className="h-3 w-3 text-hoja-tinta" aria-hidden="true" />
                </span>
                <span className="truncate text-xs font-medium text-origen-bosque sm:text-sm">{stepLabel}</span>
                {tooltip && (
                  <span className="hidden sm:inline-flex">
                    <Tooltip content={tooltip.content} detailed={tooltip.detailed} size="sm" />
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {percentBadge}
                {chevron}
              </span>
            </button>
          )}

          {/* La única barra de progreso */}
          <Progress value={percent} variant="leaf" size="sm" showLabel={false} className={condensed ? 'mt-1' : 'mt-2'} />

          {/* Pasos con etiqueta: columnas iguales, sin scroll horizontal. Arriba del todo
              siempre en escritorio; en móvil solo con el panel expandido. Con scroll, solo
              en móvil expandido (en escritorio ya están los iconos de la fila compacta). */}
          <div
            id={navId}
            style={gridStyle}
            className={cn(
              'grid gap-1 sm:gap-2',
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

export default WizardProgress;
