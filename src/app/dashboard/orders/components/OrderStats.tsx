/**
 * @file OrderStats.tsx
 * @description Estadísticas de pedidos — 4 KPIs del mes en curso.
 *
 * Patrón visual unificado con ProductStats y ReviewStats:
 *   - Móvil: 2 columnas
 *   - Tablet (≥sm): 2 columnas
 *   - Desktop (≥lg): 4 columnas en una fila
 *
 * Paleta "Bosque Comercial" v5.5.
 */

'use client';

import { ShoppingBag, Clock, TrendingUp, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@arcediano/ux-library';
import type { StatGridItem } from '@arcediano/ux-library';
import type { OrderStats as OrderStatsType } from '@/types/order';

interface OrderStatsProps {
  stats: OrderStatsType;
  isLoading?: boolean;
  className?: string;
}

export function OrderStats({ stats, isLoading = false, className }: OrderStatsProps) {
  const items: StatGridItem[] = [
    { label: 'Total pedidos', value: stats.total,                         icon: <ShoppingBag />,   variant: 'pradera'   },
    { label: 'Ingresos',      value: `${stats.totalRevenue.toFixed(0)}€`, icon: <TrendingUp />,    variant: 'hoja'      },
    { label: 'Pendientes',    value: stats.pending,                       icon: <Clock />,         variant: 'mandarina' },
    { label: 'Hoy',           value: stats.todayOrders,                   icon: <CalendarCheck />, variant: 'bosque'    },
  ];

  return <StatGrid items={items} columns={4} periodLabel="Mes actual" loading={isLoading} className={cn(className)} />;
}
