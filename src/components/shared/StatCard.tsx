/**
 * @file StatCard.tsx
 * @description Tarjeta KPI local — visualmente unificada con StatsCard del dashboard principal.
 * Usa bg-surface-alt sólido + contenedor de icono circular con gradiente de color,
 * idéntico al lenguaje visual de la página /dashboard.
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
  /** Incluye mandarina y danger nativamente */
  variant?: 'pradera' | 'hoja' | 'bosque' | 'arena' | 'oscuro' | 'neutral' | 'mandarina' | 'danger';
  loading?: boolean;
  className?: string;
}

// ─── Variantes ────────────────────────────────────────────────────────────────
// Cada variante define el gradiente del círculo icono y el borde en hover.
// El fondo de la card es siempre bg-surface-alt (blanco sólido) para máximo contraste.

const variantMap: Record<
  NonNullable<StatCardProps['variant']>,
  { iconGrad: string; hoverBorder: string }
> = {
  pradera:   { iconGrad: 'from-origen-pradera to-origen-hoja',   hoverBorder: 'group-hover:border-origen-pradera/50' },
  hoja:      { iconGrad: 'from-origen-hoja to-origen-pino',      hoverBorder: 'group-hover:border-origen-hoja/60' },
  bosque:    { iconGrad: 'from-origen-bosque to-origen-pino',    hoverBorder: 'group-hover:border-origen-bosque/50' },
  arena:     { iconGrad: 'from-gray-400 to-gray-500',            hoverBorder: 'group-hover:border-gray-400' },
  oscuro:    { iconGrad: 'from-origen-bosque to-origen-oscuro',  hoverBorder: 'group-hover:border-origen-oscuro/40' },
  neutral:   { iconGrad: 'from-gray-400 to-gray-500',            hoverBorder: 'group-hover:border-gray-400' },
  mandarina: { iconGrad: 'from-origen-mandarina to-amber-500',   hoverBorder: 'group-hover:border-origen-mandarina/50' },
  danger:    { iconGrad: 'from-feedback-danger to-red-700',      hoverBorder: 'group-hover:border-feedback-danger/50' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl sm:rounded-2xl border border-border bg-surface-alt',
        'p-3 sm:p-4 lg:p-5 shadow-subtle',
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-7 w-16 rounded bg-gray-200" />
        </div>
      </div>
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

  const { iconGrad, hoverBorder } = variantMap[variant];
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div className="group relative h-full">
      <div
        className={cn(
          'relative bg-surface-alt rounded-xl sm:rounded-2xl',
          'p-3 sm:p-4 lg:p-5 border border-border',
          'shadow-subtle group-hover:shadow-origen',
          'transition-all duration-300 h-full flex flex-col',
          hoverBorder,
          className,
        )}
      >
        <div className="flex items-start gap-2 sm:gap-4 flex-1">
          {/* Icono circular con gradiente de color (mismo estilo que StatsCard en /dashboard) */}
          {icon && (
            <div
              className={cn(
                'w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br',
                'flex items-center justify-center flex-shrink-0 shadow-subtle',
                iconGrad,
              )}
              aria-hidden
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5 [&>svg]:text-white">
                {icon}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-[11px] sm:text-xs font-medium text-text-subtle mb-0.5 sm:mb-1 leading-tight truncate">
              {label}
            </p>

            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-origen-bosque tabular-nums leading-none">
                {value}
              </span>
            </div>

            {/* Tendencia + subtexto — solo sm+ para no saturar móvil */}
            {(trend || subtitle) && (
              <div className="hidden sm:flex items-center gap-1.5 mt-2">
                {trend && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                      trendPositive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : trendNegative
                          ? 'bg-feedback-danger-subtle text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200',
                    )}
                    aria-label={`Tendencia: ${trend.value > 0 ? '+' : ''}${trend.value.toFixed(1)}%`}
                  >
                    <TrendIcon className="h-3 w-3" aria-hidden />
                    {trend.value > 0 ? '+' : ''}
                    {trend.value.toFixed(1)}%
                  </div>
                )}
                {subtitle && (
                  <span className="text-xs text-text-subtle truncate">{subtitle}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
