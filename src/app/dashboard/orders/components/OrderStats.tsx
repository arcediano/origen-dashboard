/**
 * @file OrderStats.tsx
 * @description Estadísticas de pedidos.
 *
 * Móvil  → StatStrip con los 4 KPIs principales + "Ver desglose" expandible
 * Desktop → grid de 8 tarjetas StatsCard
 */

'use client';

import { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatStrip } from '@/components/shared/mobile/StatStrip';
import { StatsCard } from '@/components/features/dashboard/components/stats/stats-card';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  className?: string;
}

export function OrderStats({ stats, className }: OrderStatsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(className)}>
      {/* ── Móvil: tira compacta ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* 4 KPIs principales */}
        <StatStrip
          items={[
            { label: 'Total',      value: stats.total,                         variant: 'default' },
            { label: 'Ingresos',   value: `${stats.totalRevenue.toFixed(0)}€`, variant: 'success' },
            { label: 'Pendientes', value: stats.pending,                       variant: stats.pending   > 0 ? 'warning' : 'default' },
            { label: 'Hoy',        value: stats.todayOrders,                   variant: 'default' },
          ]}
        />

        {/* Desglose expandible */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-center gap-1 w-full py-1.5 text-[11px] text-text-subtle uppercase tracking-wide"
        >
          <span>{expanded ? 'Ocultar desglose' : 'Ver desglose'}</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
        </button>

        {expanded && (
          <StatStrip
            items={[
              { label: 'Procesando', value: stats.processing,                    variant: 'default' },
              { label: 'Enviados',   value: stats.shipped,                       variant: 'default' },
              { label: 'Entregados', value: stats.delivered,                     variant: 'success' },
              { label: 'Cancelados', value: stats.cancelled + stats.refunded,    variant: stats.cancelled + stats.refunded > 0 ? 'danger' : 'default' },
            ]}
          />
        )}
      </div>

      {/* ── Desktop: grid completo ───────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-8 gap-4">
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
    </div>
  );
}
