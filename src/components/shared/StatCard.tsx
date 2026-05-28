/**
 * @file StatCard.tsx
 * @description Tarjeta KPI local — copia directa de origen-UXLibrary >= 0.2.17.
 *
 * @migration Cuando @arcediano/ux-library >= 0.2.17 esté instalado, reemplazar
 * este archivo por el import directo:
 *   import { StatCard, StatCardProps } from '@arcediano/ux-library';
 */

'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StatCardTrend {
  value: number;
  label?: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: StatCardTrend;
  subtitle?: string;
  variant?: 'pradera' | 'hoja' | 'bosque' | 'arena' | 'oscuro' | 'neutral' | 'mandarina';
  loading?: boolean;
  className?: string;
}

// ─── Variantes de color ───────────────────────────────────────────────────────

const variantMap: Record<
  NonNullable<StatCardProps['variant']>,
  { bg: string; border: string; icon: string }
> = {
  pradera: {
    bg: 'from-origen-pradera/5 to-transparent',
    border: 'border-origen-pradera/15',
    icon: 'text-origen-pradera',
  },
  hoja: {
    bg: 'from-origen-hoja/5 to-transparent',
    border: 'border-origen-hoja/15',
    icon: 'text-origen-hoja',
  },
  bosque: {
    bg: 'from-origen-bosque/5 to-transparent',
    border: 'border-origen-bosque/15',
    icon: 'text-origen-bosque',
  },
  arena: {
    bg: 'from-origen-arena/30 to-transparent',
    border: 'border-origen-arena/40',
    icon: 'text-origen-bosque/70',
  },
  oscuro: {
    bg: 'from-origen-oscuro/5 to-transparent',
    border: 'border-origen-oscuro/10',
    icon: 'text-origen-oscuro/70',
  },
  neutral: {
    bg: 'from-gray-100/80 to-transparent',
    border: 'border-gray-200',
    icon: 'text-gray-400',
  },
  mandarina: {
    bg: 'from-origen-mandarina/10 to-transparent',
    border: 'border-origen-mandarina/20',
    icon: 'text-origen-mandarina',
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse p-4 rounded-xl border bg-gray-50 border-gray-200',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
      <div className="h-7 w-24 rounded bg-gray-200 mb-2" />
      <div className="h-3 w-16 rounded bg-gray-100" />
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  variant = 'neutral',
  loading = false,
  className,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton className={className} />;

  const colors = variantMap[variant];
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border bg-gradient-to-br transition-shadow hover:shadow-sm',
        colors.bg,
        colors.border,
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className={cn('flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4', colors.icon)} aria-hidden>
            {icon}
          </span>
        )}
        <span className="text-xs font-medium text-text-subtle leading-tight truncate">
          {label}
        </span>
      </div>

      {/* Valor */}
      <p className="text-2xl font-bold text-origen-bosque tabular-nums leading-none mb-1">
        {value}
      </p>

      {/* Tendencia + subtexto */}
      {(trend || subtitle) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                trendPositive
                  ? 'text-green-600'
                  : trendNegative
                    ? 'text-red-500'
                    : 'text-text-subtle',
              )}
              aria-label={`Tendencia: ${trend.value > 0 ? '+' : ''}${trend.value.toFixed(1)}%`}
            >
              <TrendIcon className="h-3 w-3" aria-hidden />
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-text-subtle truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
