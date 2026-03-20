/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos.
 *
 * Móvil  → StatStrip: tira compacta de 4 KPIs (sin cards, sin scroll horizontal)
 * Desktop → grid de tarjetas StatsCard con información ampliada
 */

'use client';

import {
  Package,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatStrip } from '@/components/shared/mobile/StatStrip';
import { StatsCard } from '@/components/features/dashboard/components/stats/stats-card';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  totalRevenue?: number;
  avgRating?: number;
  totalSales?: number;
  totalViews?: number;
  className?: string;
}

export function ProductStats({
  total,
  active,
  lowStock,
  outOfStock,
  totalRevenue,
  avgRating,
  totalSales,
  totalViews,
  className,
}: ProductStatsProps) {
  const hasRevenue = totalRevenue !== undefined;
  const hasRating  = avgRating   !== undefined;
  const hasSales   = totalSales  !== undefined;
  const hasViews   = totalViews  !== undefined;

  const totalCards = 4 + (hasRevenue ? 1 : 0) + (hasRating ? 1 : 0) + (hasSales ? 1 : 0) + (hasViews ? 1 : 0);

  const gridCols =
    totalCards <= 4 ? 'lg:grid-cols-4' :
    totalCards <= 6 ? 'sm:grid-cols-3 lg:grid-cols-6' :
                     'sm:grid-cols-4 lg:grid-cols-8';

  return (
    <div className={cn(className)}>
      {/* ── Móvil: tira compacta ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        <StatStrip
          items={[
            { label: 'Total',      value: total,      icon: Package,      gradient: 'from-origen-pradera to-origen-hoja', variant: 'default' },
            { label: 'Activos',    value: active,     icon: CheckCircle,  gradient: 'from-origen-hoja to-origen-pino',    variant: 'success' },
            { label: 'Stock bajo', value: lowStock,   icon: AlertCircle,  gradient: 'from-origen-mandarina to-amber-500', variant: lowStock   > 0 ? 'warning' : 'default' },
            { label: 'Agotados',   value: outOfStock, icon: AlertCircle,  gradient: 'from-red-400 to-red-600',            variant: outOfStock > 0 ? 'danger'  : 'default' },
          ]}
        />
      </div>

      {/* ── Desktop: grid de tarjetas ────────────────────────────────────── */}
      <div className={cn('hidden lg:grid gap-4', gridCols)}>
        <StatsCard label="Total productos" value={total}      icon={Package}      gradient="from-origen-pradera to-origen-hoja" />
        <StatsCard label="Activos"         value={active}     icon={CheckCircle}  gradient="from-origen-hoja to-origen-pino"
          sublabel={total > 0 ? `${Math.round((active / total) * 100)}% del catálogo` : undefined} />
        <StatsCard label="Stock bajo"      value={lowStock}   icon={AlertCircle}  gradient="from-origen-mandarina to-amber-500"
          sublabel={total > 0 ? `${Math.round((lowStock / total) * 100)}%` : undefined} />
        <StatsCard label="Agotados"        value={outOfStock} icon={AlertCircle}  gradient="from-red-400 to-red-600"
          sublabel={total > 0 ? `${Math.round((outOfStock / total) * 100)}%` : undefined} />
        {hasRevenue && (
          <StatsCard label="Ingresos" value={`${totalRevenue!.toFixed(0)}€`} icon={DollarSign} gradient="from-blue-400 to-blue-600"
            sublabel={total > 0 ? `media ${(totalRevenue! / total).toFixed(0)}€` : undefined} />
        )}
        {hasRating && (
          <StatsCard label="Valoración" value={avgRating!.toFixed(1)} icon={Star} gradient="from-origen-mandarina to-amber-500" sublabel="sobre 5" />
        )}
        {hasSales && (
          <StatsCard label="Ventas" value={totalSales!} icon={TrendingUp} gradient="from-purple-400 to-purple-600" />
        )}
        {hasViews && (
          <StatsCard label="Vistas" value={totalViews!} icon={TrendingUp} gradient="from-green-400 to-green-600" />
        )}
      </div>
    </div>
  );
}
