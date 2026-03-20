/**
 * @component StatStrip
 * @description Tira horizontal de métricas estilo app nativa.
 *
 * Patrón habitual en apps de comercio móvil (Shopify, Stripe, Square):
 * sin tarjetas, sin fondos, sin iconos — solo el número y la etiqueta.
 * Ocupa una única franja fina (~64px) y transmite los KPIs de un vistazo.
 *
 * Uso:
 *   <StatStrip items={[
 *     { label: 'Total', value: 24 },
 *     { label: 'Activos', value: 18, variant: 'success' },
 *     { label: 'Stock bajo', value: 3, variant: 'warning' },
 *     { label: 'Agotados', value: 1, variant: 'danger' },
 *   ]} />
 */

'use client';

import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatStripVariant = 'default' | 'success' | 'warning' | 'danger';

export interface StatStripItem {
  /** Etiqueta descriptiva del KPI */
  label: string;
  /** Valor numérico o formateado (ej: "3.240€") */
  value: string | number;
  /** Color del valor — destaca visualmente los estados de alerta */
  variant?: StatStripVariant;
}

export interface StatStripProps {
  items: StatStripItem[];
  className?: string;
}

// ─── Colores por variante ─────────────────────────────────────────────────────

const valueColor: Record<StatStripVariant, string> = {
  default: 'text-origen-bosque',
  success: 'text-origen-hoja',
  warning: 'text-origen-mandarina',
  danger:  'text-red-500',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function StatStrip({ items, className }: StatStripProps) {
  return (
    <div
      className={cn(
        'grid border-y border-border-subtle bg-surface-alt',
        `grid-cols-${items.length}`,
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col items-center justify-center py-3 px-1',
            i < items.length - 1 && 'border-r border-border-subtle',
          )}
        >
          <span className={cn('text-xl font-bold leading-none tabular-nums', valueColor[item.variant ?? 'default'])}>
            {item.value}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-text-subtle text-center leading-tight">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
