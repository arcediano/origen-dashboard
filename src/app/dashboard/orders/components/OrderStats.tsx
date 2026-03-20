/**
 * @file OrderStats.tsx
 * @description Estadísticas de pedidos.
 *
 * Móvil  → grid 2×2 con los 4 KPIs principales (mismo patrón que el dashboard principal)
 * Desktop → grid de 8 tarjetas StatsCard
 */

'use client';

import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/features/dashboard/components/stats/stats-card';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  className?: string;
}

export function OrderStats({ stats, className }: OrderStatsProps) {
  return (
    <div className={cn(className)}>
      {/* ── Móvil: 4 KPIs en grid 2×2 ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <StatsCard
          label="Total pedidos"
          value={stats.total}
          icon={ShoppingBag}
          gradient="from-origen-pradera to-origen-hoja"
          sublabel={`${stats.processing} procesando`}
        />
        <StatsCard
          label="Ingresos"
          value={`${stats.totalRevenue.toFixed(0)}€`}
          icon={DollarSign}
          gradient="from-green-400 to-green-600"
          sublabel={`media ${stats.averageOrderValue.toFixed(0)}€/pedido`}
        />
        <StatsCard
          label="Pendientes"
          value={stats.pending}
          icon={Clock}
          gradient="from-origen-mandarina to-amber-500"
          sublabel="esperando confirmación"
        />
        <StatsCard
          label="Hoy"
          value={`${stats.todayRevenue.toFixed(0)}€`}
          icon={Calendar}
          gradient="from-origen-pino to-origen-bosque"
          sublabel={`${stats.todayOrders} pedidos hoy`}
        />
      </div>

      {/* ── Desktop: grid completo ───────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-8 gap-4">
        <StatsCard label="Total"      value={stats.total}                          icon={ShoppingBag} gradient="from-origen-pradera to-origen-hoja" />
        <StatsCard label="Ingresos"   value={`${stats.totalRevenue.toFixed(0)}€`}  icon={DollarSign}  gradient="from-green-400 to-green-600"
          sublabel={`media ${stats.averageOrderValue.toFixed(0)}€/pedido`} />
        <StatsCard label="Pendientes" value={stats.pending}                         icon={Clock}       gradient="from-origen-mandarina to-amber-500" />
        <StatsCard label="Procesando" value={stats.processing}                      icon={Package}     gradient="from-origen-hoja to-origen-pino" />
        <StatsCard label="Enviados"   value={stats.shipped}                         icon={Truck}       gradient="from-origen-pino to-origen-bosque" />
        <StatsCard label="Entregados" value={stats.delivered}                       icon={CheckCircle} gradient="from-green-500 to-green-700" />
        <StatsCard label="Hoy"        value={stats.todayOrders}                     icon={Calendar}    gradient="from-origen-pradera to-origen-pino"
          sublabel={`${stats.todayRevenue.toFixed(0)}€`} />
        <StatsCard label="Cancelados" value={stats.cancelled + stats.refunded}      icon={XCircle}     gradient="from-red-400 to-red-600" />
      </div>
    </div>
  );
}
