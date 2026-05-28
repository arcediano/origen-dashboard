/**
 * @file OrderStats.tsx
 * @description Estadísticas de pedidos — 4 KPIs del mes en curso.
 *
 * Grid 2×2 en móvil, 1×4 en desktop.
 */

'use client';

import { ShoppingBag, Clock, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@/components/shared/StatGrid';
import type { StatGridItem } from '@/components/shared/StatGrid';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  className?: string;
}

export function OrderStats({ stats, className }: OrderStatsProps) {
  const items: StatGridItem[] = [
    { label: 'Total pedidos', value: stats.total,                         icon: <ShoppingBag />, variant: 'pradera' },
    { label: 'Ingresos',      value: `${stats.totalRevenue.toFixed(0)}€`, icon: <DollarSign />,  variant: 'hoja' },
    { label: 'Pendientes',    value: stats.pending,                       icon: <Clock />,       variant: 'mandarina' },
    { label: 'Hoy',           value: stats.todayOrders,                   icon: <Calendar />,    variant: 'bosque' },
  ];

  return <StatGrid items={items} columns={4} periodLabel="Mes actual" className={cn(className)} />;
}

