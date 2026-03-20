/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos — 4 KPIs en grid 2×2 (móvil) / 1×4 (desktop).
 *
 * Estilo suave: gradiente translúcido + borde sutil, sin fondos intensos.
 */

'use client';

import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoftStatCard } from '@/components/shared/SoftStatCard';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  /** Ignorados en la vista actual — reservados para uso futuro */
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
  className,
}: ProductStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      <SoftStatCard
        label="Total productos"
        value={total}
        icon={Package}
        bg="from-origen-pradera/5 to-transparent"
        border="border-origen-pradera/10"
        iconColor="text-origen-pradera"
      />
      <SoftStatCard
        label="Activos"
        value={active}
        icon={CheckCircle}
        bg="from-origen-hoja/5 to-transparent"
        border="border-origen-hoja/10"
        iconColor="text-origen-hoja"
      />
      <SoftStatCard
        label="Stock bajo"
        value={lowStock}
        icon={AlertCircle}
        bg="from-amber-400/8 to-transparent"
        border="border-amber-200/60"
        iconColor="text-amber-500"
      />
      <SoftStatCard
        label="Agotados"
        value={outOfStock}
        icon={AlertCircle}
        bg="from-red-400/8 to-transparent"
        border="border-red-200/60"
        iconColor="text-red-500"
      />
    </div>
  );
}
