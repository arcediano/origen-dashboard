/**
 * @file OrderStats.tsx
 * @description Estadísticas de pedidos — 4 KPIs del mes en curso.
 *
 * Grid 2×2 en móvil, 1×4 en desktop. Estilo suave sin fondos intensos.
 */

'use client';

import { ShoppingBag, Clock, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  className?: string;
}

export function OrderStats({ stats, className }: OrderStatsProps) {
  return (
    <div className={cn(className)}>
      {/* Etiqueta de período */}
      <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wide mb-3">
        Mes actual
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SoftStatCard
          label="Total pedidos"
          value={stats.total}
          icon={ShoppingBag}
          bg="from-origen-pradera/5 to-transparent"
          border="border-origen-pradera/10"
          iconColor="text-origen-pradera"
        />
        <SoftStatCard
          label="Ingresos"
          value={`${stats.totalRevenue.toFixed(0)}€`}
          icon={DollarSign}
          bg="from-origen-hoja/5 to-transparent"
          border="border-origen-hoja/10"
          iconColor="text-origen-hoja"
        />
        <SoftStatCard
          label="Pendientes"
          value={stats.pending}
          icon={Clock}
          bg="from-amber-400/8 to-transparent"
          border="border-amber-200/60"
          iconColor="text-amber-500"
        />
        <SoftStatCard
          label="Hoy"
          value={stats.todayOrders}
          icon={Calendar}
          bg="from-origen-pino/5 to-transparent"
          border="border-origen-pino/10"
          iconColor="text-origen-pino"
        />
      </div>
    </div>
  );
}
