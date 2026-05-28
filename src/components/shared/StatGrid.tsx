/**
 * @file StatGrid.tsx
 * @description Grid de KPIs reutilizable para origen-dashboard.
 *
 * Wrapper local que usa StatCard de @arcediano/ux-library e incorpora soporte
 * completo para los colores del design system (incluido mandarina y feedback-danger)
 * mientras la UXLibrary v0.2.17+ esté disponible.
 *
 * @migration Cuando @arcediano/ux-library >= 0.2.17 esté instalado, reemplazar
 * este componente por el import directo:
 *   import { StatGrid } from '@arcediano/ux-library';
 */

'use client';

import React from 'react';
import { StatCard } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import type { StatCardProps } from '@arcediano/ux-library';

// ─── Extensión de variantes ───────────────────────────────────────────────────
// Mapea variantes adicionales a las clases Tailwind del proyecto hasta que
// sean soportadas nativamente en la UXLibrary.

type ExtendedVariant = NonNullable<StatCardProps['variant']> | 'mandarina' | 'danger';

interface VariantOverride {
  cardClass: string;
  iconClass: string;
}

const extendedVariantOverrides: Partial<Record<ExtendedVariant, VariantOverride>> = {
  mandarina: {
    cardClass: 'from-origen-mandarina/10 to-transparent border-origen-mandarina/20',
    iconClass:  'text-origen-mandarina',
  },
  danger: {
    cardClass: 'from-feedback-danger/5 to-transparent border-feedback-danger/10',
    iconClass:  'text-feedback-danger',
  },
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StatGridItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: ExtendedVariant;
  trend?: StatCardProps['trend'];
  subtitle?: string;
}

export interface StatGridProps {
  items: StatGridItem[];
  columns?: 2 | 3 | 4;
  periodLabel?: string;
  loading?: boolean;
  className?: string;
}

const colsMap: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function StatGrid({
  items,
  columns = 4,
  periodLabel,
  loading = false,
  className,
}: StatGridProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {periodLabel && (
        <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wide">
          {periodLabel}
        </p>
      )}
      <div
        className={cn('grid gap-3 sm:gap-4', colsMap[columns])}
        aria-busy={loading || undefined}
      >
        {items.map(({ variant, icon, ...item }, i) => {
          const override = variant ? extendedVariantOverrides[variant] : undefined;
          const resolvedVariant =
            override ? 'neutral' : (variant as StatCardProps['variant']) ?? 'neutral';
          const resolvedIcon = override
            ? React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props?.className,
                    override.iconClass,
                  ),
                })
              : icon
            : icon;

          return (
            <StatCard
              key={i}
              {...item}
              icon={resolvedIcon}
              variant={resolvedVariant}
              className={override?.cardClass}
              loading={loading}
            />
          );
        })}
      </div>
    </div>
  );
}
