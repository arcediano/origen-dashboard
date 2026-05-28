/**
 * @file StatGrid.tsx
 * @description Grid de KPIs reutilizable para origen-dashboard.
 *
 * Wrapper local que usa StatCard (local) y soporta todas las variantes
 * del design system incluyendo mandarina y danger.
 *
 * @migration Cuando @arcediano/ux-library >= 0.2.17 esté instalado, reemplazar
 * este componente por el import directo:
 *   import { StatGrid } from '@arcediano/ux-library';
 */

'use client';

import React from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { cn } from '@/lib/utils';
import type { StatCardProps } from '@/components/shared/StatCard';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StatGridItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: StatCardProps['variant'];
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
        {items.map((item, i) => (
          <StatCard
            key={i}
            label={item.label}
            value={item.value}
            icon={item.icon}
            variant={item.variant ?? 'neutral'}
            trend={item.trend}
            subtitle={item.subtitle}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
