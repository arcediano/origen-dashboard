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
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileKPIRow, type KpiItem } from '@/components/shared/mobile';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  className?: string;
}

export function OrderStats({ stats, className }: OrderStatsProps) {
  const statsCards = [
    {
      label: 'Total pedidos',
      value: stats.total,
      icon: ShoppingBag,
      iconColor: 'text-origen-pradera',
      accent: 'border-l-origen-pradera',
    },
    {
      label: 'Ingresos totales',
      value: `${stats.totalRevenue.toFixed(2)}€`,
      icon: DollarSign,
      iconColor: 'text-green-500',
      accent: 'border-l-green-400',
      secondaryInfo: {
        label: 'media',
        value: `${stats.averageOrderValue.toFixed(2)}€`
      }
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      iconColor: 'text-amber-500',
      accent: 'border-l-amber-400',
    },
    {
      label: 'Procesando',
      value: stats.processing,
      icon: Package,
      iconColor: 'text-origen-hoja',
      accent: 'border-l-origen-hoja',
    },
    {
      label: 'Enviados',
      value: stats.shipped,
      icon: Truck,
      iconColor: 'text-origen-pino',
      accent: 'border-l-origen-pino',
    },
    {
      label: 'Entregados',
      value: stats.delivered,
      icon: CheckCircle,
      iconColor: 'text-green-500',
      accent: 'border-l-green-500',
    },
    {
      label: 'Hoy',
      value: stats.todayOrders,
      icon: Calendar,
      iconColor: 'text-origen-menta',
      accent: 'border-l-origen-menta',
      secondaryInfo: {
        label: 'ingresos',
        value: `${stats.todayRevenue.toFixed(2)}€`
      }
    },
    {
      label: 'Cancelados',
      value: stats.cancelled + stats.refunded,
      icon: XCircle,
      iconColor: 'text-red-500',
      accent: 'border-l-red-400',
    }
  ];

  // KPIs para móvil (4 principales)
  const mobileKpis: KpiItem[] = [
    { label: 'Total', value: stats.total, icon: ShoppingBag, accent: 'pradera' },
    { label: 'Ingresos', value: `${stats.totalRevenue.toFixed(0)}€`, icon: DollarSign, accent: 'green', secondary: `media ${stats.averageOrderValue.toFixed(0)}€` },
    { label: 'Pendientes', value: stats.pending, icon: Clock, accent: 'amber' },
    { label: 'Hoy', value: stats.todayOrders, icon: Calendar, accent: 'bosque', secondary: `${stats.todayRevenue.toFixed(0)}€` },
  ];

  return (
    <div className={cn(className)}>
      {/* Móvil: fila scrollable */}
      <MobileKPIRow items={mobileKpis} className="block lg:hidden" />

      {/* Desktop: grid completo */}
      <div className={cn(
        'hidden lg:grid grid-cols-4 xl:grid-cols-8 gap-4',
      )}>
      {statsCards.map((card, index) => (
        <div
          key={index}
          className={cn(
            'p-4 rounded-xl bg-surface-alt',
            'border border-border-subtle border-l-4',
            card.accent,
            'shadow-subtle'
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <card.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', card.iconColor)} />
              <span className="text-xs font-medium text-text-subtle">{card.label}</span>
            </div>
          </div>
          
          <p className="text-xl sm:text-2xl font-bold text-origen-bosque">
            {card.value}
          </p>
          
          {card.secondaryInfo && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-text-subtle" />
              <span>{card.secondaryInfo.label}:</span>
              <span className="font-medium text-origen-bosque">
                {card.secondaryInfo.value}
              </span>
            </div>
          )}
        </div>
      ))}
      </div>{/* end desktop grid */}
    </div>
  );
}