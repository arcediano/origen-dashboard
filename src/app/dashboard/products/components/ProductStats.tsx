/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos — 4 KPIs en grid 2×2 (móvil) / 1×4 (desktop).
 */

'use client';

import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@/components/shared/StatGrid';
import type { StatGridItem } from '@/components/shared/StatGrid';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  className?: string;
}

export function ProductStats({
  total,
  active,
  lowStock,
  outOfStock,
  className,
}: ProductStatsProps) {
  const items: StatGridItem[] = [
    { label: 'Total productos', value: total,      icon: <Package />,      variant: 'pradera' },
    { label: 'Activos',         value: active,     icon: <CheckCircle />,  variant: 'hoja' },
    { label: 'Stock bajo',      value: lowStock,   icon: <AlertCircle />,  variant: 'mandarina' },
    { label: 'Agotados',        value: outOfStock, icon: <AlertCircle />,  variant: 'danger' },
  ];

  return <StatGrid items={items} columns={4} className={cn(className)} />;
}

