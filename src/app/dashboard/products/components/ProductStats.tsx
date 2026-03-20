/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos.
 *
 * Grid 2×2 en móvil, 1×4 en desktop — mismo patrón que el dashboard principal.
 * Las tarjetas opcionales (revenue, rating, sales, views) amplían el grid si se proporcionan.
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

  const lgCols =
    totalCards <= 4 ? 'lg:grid-cols-4' :
    totalCards <= 6 ? 'lg:grid-cols-6' :
                     'lg:grid-cols-8';

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', lgCols, className)}>
      <StatsCard
        label="Total productos"
        value={total}
        icon={Package}
        gradient="from-origen-pradera to-origen-hoja"
        sublabel={active > 0 ? `${active} activos` : 'sin productos activos'}
      />
      <StatsCard
        label="Activos"
        value={active}
        icon={CheckCircle}
        gradient="from-origen-hoja to-origen-pino"
        sublabel={total > 0 ? `${Math.round((active / total) * 100)}% del catálogo` : undefined}
      />
      <StatsCard
        label="Stock bajo"
        value={lowStock}
        icon={AlertCircle}
        gradient="from-origen-mandarina to-amber-500"
        sublabel="requieren atención"
      />
      <StatsCard
        label="Agotados"
        value={outOfStock}
        icon={AlertCircle}
        gradient="from-red-400 to-red-600"
        sublabel="sin stock disponible"
      />
      {hasRevenue && (
        <StatsCard
          label="Ingresos"
          value={`${totalRevenue!.toFixed(0)}€`}
          icon={DollarSign}
          gradient="from-blue-400 to-blue-600"
          sublabel={total > 0 ? `media ${(totalRevenue! / total).toFixed(0)}€/producto` : undefined}
        />
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
  );
}
