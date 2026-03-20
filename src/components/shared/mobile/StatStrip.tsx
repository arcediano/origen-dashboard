/**
 * @component StatStrip
 * @description Tira compacta de KPIs para móvil.
 *
 * Mismo estilo de card que el dashboard principal (bg-surface-alt, rounded-xl,
 * border border-border, shadow-origen) con los KPIs en una sola fila:
 * número grande + etiqueta pequeña, separados por divisores verticales.
 * Sin iconos, sin scroll horizontal.
 */

'use client';

import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatStripVariant = 'default' | 'success' | 'warning' | 'danger';

export interface StatStripItem {
  label: string;
  value: string | number;
  /** Información secundaria bajo el valor */
  sublabel?: string;
  /** Color del valor numérico para destacar estados de alerta */
  variant?: StatStripVariant;
}

export interface StatStripProps {
  items: StatStripItem[];
  className?: string;
}

// ─── Color del valor por variante ─────────────────────────────────────────────

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
        'grid bg-surface-alt rounded-xl border border-border shadow-origen overflow-hidden',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col items-center justify-center py-3.5 px-2',
            i < items.length - 1 && 'border-r border-border-subtle',
          )}
        >
          <span className={cn(
            'text-2xl font-bold leading-none tabular-nums',
            valueColor[item.variant ?? 'default'],
          )}>
            {item.value}
          </span>

          {item.sublabel && (
            <span className="mt-0.5 text-[10px] text-text-subtle tabular-nums">
              {item.sublabel}
            </span>
          )}

          <span className="mt-1 text-[11px] font-medium text-text-subtle text-center leading-tight">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
