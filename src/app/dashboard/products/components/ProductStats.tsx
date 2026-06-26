/**
 * @file ProductStats.tsx
 * @description Estadísticas de productos — KPIs de inventario + KPIs económicos opcionales.
 *
 * Sección 1: Inventario (4 KPIs) - grid 2×2 (móvil) / 1×4 (desktop)
 * Sección 2: Económicos (3 KPIs) - solo si existen valores > 0 - grid 2×2 (móvil) / 1×3 (desktop)
 *
 * Patrón visual unificado con OrderStats y ReviewStats:
 *   - Móvil: 2 columnas
 *   - Tablet (≥sm): 2 columnas
 *   - Desktop (≥lg): 4 o 3 columnas según sección
 *
 * Paleta "Bosque Comercial" v5.5.
 */

'use client';

import { Package, CheckCircle, AlertTriangle, XCircle, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@arcediano/ux-library';
import type { StatGridItem } from '@arcediano/ux-library';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  totalRevenue?: number;
  totalSales?: number;
  totalViews?: number;
  isLoading?: boolean;
  className?: string;
}

export function ProductStats({
  total,
  active,
  lowStock,
  outOfStock,
  totalRevenue = 0,
  totalSales = 0,
  totalViews = 0,
  isLoading = false,
  className,
}: ProductStatsProps) {
  // Sección 1: KPIs de inventario
  const inventoryItems: StatGridItem[] = [
    { label: 'Total productos', value: total,      icon: <Package />,        variant: 'pradera'   },
    { label: 'Activos',         value: active,     icon: <CheckCircle />,    variant: 'hoja'      },
    { label: 'Stock bajo',      value: lowStock,   icon: <AlertTriangle />,  variant: 'mandarina' },
    { label: 'Agotados',        value: outOfStock, icon: <XCircle />,        variant: 'danger'    },
  ];

  // Sección 2: KPIs económicos (solo si alguno > 0)
  const hasEconomicData = totalRevenue > 0 || totalSales > 0 || totalViews > 0;
  const economicItems: StatGridItem[] = hasEconomicData ? [
    {
      label: 'Ingresos totales',
      value: totalRevenue > 0
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalRevenue)
        : '€0.00',
      icon: <DollarSign />,
      variant: 'bosque',
    },
    {
      label: 'Ventas totales',
      value: totalSales,
      icon: <TrendingUp />,
      variant: 'hoja',
    },
    {
      label: 'Vistas totales',
      value: totalViews,
      icon: <Eye />,
      variant: 'pradera',
    },
  ] : [];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Inventario */}
      <StatGrid items={inventoryItems} columns={4} periodLabel="Total acumulado" loading={isLoading} />
      {/* Económicos */}
      {hasEconomicData && (
        <StatGrid items={economicItems} columns={3} periodLabel="Total acumulado" loading={isLoading} />
      )}
    </div>
  );
}
