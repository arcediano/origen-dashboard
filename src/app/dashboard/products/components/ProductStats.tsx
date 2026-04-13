/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos — 4 KPIs en grid 2×2 (móvil) / 1×4 (desktop).
 *
 * Estilo suave: gradiente translúcido + borde sutil, sin fondos intensos.
 */

'use client';

import { Package, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoftStatCard } from '@/components/shared/SoftStatCard';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  avgRating?: number;
  className?: string;
}

export function ProductStats({
  total,
  active,
  lowStock,
  outOfStock,
  avgRating,
  className,
}: ProductStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4', className)}>
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
        iconColor="text-feedback-danger"
      />
      <SoftStatCard
        label="Rating medio"
        value={avgRating ?? 0}
        icon={Star}
        bg="from-amber-400/8 to-transparent"
        border="border-amber-200/60"
        iconColor="text-amber-500"
      />
    </div>
  );
}
