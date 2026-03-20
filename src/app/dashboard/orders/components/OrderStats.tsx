/**
 * @component OrderStats
 * @description Estadísticas de pedidos con diseño estilo ProductExpandableDetails
 */

'use client';

import React from 'react';
import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar
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
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4', className)}>
      <StatsCard label="Total"      value={stats.total}                          icon={ShoppingBag} gradient="from-origen-pradera to-origen-hoja" />
      <StatsCard label="Ingresos"   value={`${stats.totalRevenue.toFixed(0)}€`}  icon={DollarSign}  gradient="from-green-400 to-green-600"
        sublabel={`media ${stats.averageOrderValue.toFixed(0)}€`} />
      <StatsCard label="Pendientes" value={stats.pending}                         icon={Clock}       gradient="from-origen-mandarina to-amber-500" />
      <StatsCard label="Procesando" value={stats.processing}                      icon={Package}     gradient="from-origen-hoja to-origen-pino" />
      <StatsCard label="Enviados"   value={stats.shipped}                         icon={Truck}       gradient="from-origen-pino to-origen-bosque" />
      <StatsCard label="Entregados" value={stats.delivered}                       icon={CheckCircle} gradient="from-green-500 to-green-700" />
      <StatsCard label="Hoy"        value={stats.todayOrders}                     icon={Calendar}    gradient="from-origen-pradera to-origen-pino"
        sublabel={`${stats.todayRevenue.toFixed(0)}€`} />
      <StatsCard label="Cancelados" value={stats.cancelled + stats.refunded}      icon={XCircle}     gradient="from-red-400 to-red-600" />
    </div>
  );
}