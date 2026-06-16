/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos — 4 KPIs en grid 2×2 (móvil) / 1×4 (desktop).
 *
 * Patrón visual unificado con OrderStats y ReviewStats:
 *   - Móvil: 2 columnas
 *   - Tablet (≥sm): 2 columnas
 *   - Desktop (≥lg): 4 columnas en una fila
 *
 * Paleta "Bosque Comercial" v5.5.
 */

'use client';

import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@arcediano/ux-library';
import type { StatGridItem } from '@arcediano/ux-library';

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
    { label: 'Total productos', value: total,      icon: <Package />,        variant: 'pradera'   },
    { label: 'Activos',         value: active,     icon: <CheckCircle />,    variant: 'hoja'      },
    { label: 'Stock bajo',      value: lowStock,   icon: <AlertTriangle />,  variant: 'mandarina' },
    { label: 'Agotados',        value: outOfStock, icon: <XCircle />,        variant: 'danger'    },
  ];

  return <StatGrid items={items} columns={4} className={cn(className)} />;
}
