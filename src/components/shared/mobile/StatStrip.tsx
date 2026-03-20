/**
 * @component StatStrip
 * @description Tira compacta de KPIs para móvil — versión reducida del StatsCard del dashboard.
 *
 * Mantiene el mismo lenguaje visual (icono con gradiente, tipografía, tokens de marca)
 * en un formato de franja horizontal que ocupa ~90px en lugar de las tarjetas completas.
 *
 * Uso:
 *   <StatStrip items={[
 *     { label: 'Total',   value: 24, icon: Package,     gradient: 'from-origen-pradera to-origen-hoja' },
 *     { label: 'Activos', value: 18, icon: CheckCircle, gradient: 'from-origen-hoja to-origen-pino', variant: 'success' },
 *   ]} />
 */

'use client';

import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatStripVariant = 'default' | 'success' | 'warning' | 'danger';

export interface StatStripItem {
  label: string;
  value: string | number;
  /** Icono de lucide-react */
  icon: React.ElementType;
  /** Clases Tailwind del gradiente del icono (igual que en StatsCard) */
  gradient: string;
  /** Color del valor numérico */
  variant?: StatStripVariant;
  /** Información secundaria pequeña bajo el valor */
  sublabel?: string;
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
        'grid bg-surface-alt rounded-xl border border-border shadow-subtle overflow-hidden',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 py-3 px-2',
              i < items.length - 1 && 'border-r border-border-subtle',
            )}
          >
            {/* Icono con gradiente — mismo patrón que StatsCard */}
            <div className={cn(
              'w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-subtle flex-shrink-0',
              item.gradient,
            )}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>

            {/* Valor */}
            <span className={cn(
              'text-lg font-bold leading-none tabular-nums',
              valueColor[item.variant ?? 'default'],
            )}>
              {item.value}
            </span>

            {/* Etiqueta */}
            <span className="text-[10px] font-medium text-text-subtle text-center leading-tight">
              {item.label}
            </span>

            {/* Sublabel opcional */}
            {item.sublabel && (
              <span className="text-[9px] text-text-subtle/70 text-center leading-none">
                {item.sublabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
