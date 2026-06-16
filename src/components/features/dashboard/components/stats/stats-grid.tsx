/**
 * @file stats-grid.tsx
 * @description Grid de tarjetas de estadísticas del dashboard principal.
 * Usa StatCard / StatGrid de @arcediano/ux-library (diseño unificado).
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, DollarSign, Star, Loader2, ChevronRight } from 'lucide-react';
import { StatCard, StatGrid } from '@arcediano/ux-library';
import type { StatGridItem } from '@arcediano/ux-library';
import { itemVariants } from '../layout/dashboard-shell';
import type { DashboardStats } from '../../types';

interface StatsGridProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Valores por defecto para mostrar mientras carga
const DEFAULT_STATS: DashboardStats = {
  profileViews: { today: 0, trend: { value: 0, isPositive: true } },
  orders: { today: 0, trend: { value: 0, isPositive: true } },
  revenue: { today: 0, trend: { value: 0, isPositive: true } },
  rating: { average: 0, total: 0 },
};

export function StatsGrid({
  stats,
  isLoading = false,
  className,
  collapsible = false,
  defaultCollapsed = false
}: StatsGridProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const displayStats = stats || DEFAULT_STATS;

  // Mostrar mensaje si no hay datos
  const isEmpty = !isLoading && stats &&
    stats.profileViews.today === 0 &&
    stats.orders.today === 0 &&
    stats.revenue.today === 0;

  const statsItems: StatGridItem[] = [
    {
      label: 'Visitas hoy',
      value: displayStats.profileViews.today,
      icon: <Eye />,
      variant: 'pradera',
      trend: displayStats.profileViews.trend
        ? { value: displayStats.profileViews.trend.value, isPositive: displayStats.profileViews.trend.isPositive }
        : undefined,
    },
    {
      label: 'Pedidos hoy',
      value: displayStats.orders.today,
      icon: <ShoppingBag />,
      variant: 'pradera',
      trend: displayStats.orders.trend
        ? { value: displayStats.orders.trend.value, isPositive: displayStats.orders.trend.isPositive }
        : undefined,
    },
    {
      label: 'Ingresos hoy',
      value: `${displayStats.revenue.today}€`,
      icon: <DollarSign />,
      variant: 'hoja',
      trend: displayStats.revenue.trend
        ? { value: displayStats.revenue.trend.value, isPositive: displayStats.revenue.trend.isPositive }
        : undefined,
    },
    {
      label: 'Valoración',
      value: displayStats.rating.average.toFixed(1),
      subtitle: `${displayStats.rating.total} reseñas`,
      icon: <Star />,
      variant: 'bosque',
    },
  ];

  return (
    <motion.div
      variants={itemVariants}
      className={`${className || ''}`}
    >
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 mb-4 text-origen-mandarina hover:text-origen-mandarina/80 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          <span>Estadísticas {isCollapsed ? '(mostrar)' : '(ocultar)'}</span>
        </button>
      )}

      {isEmpty ? (
        <div className="bg-origen-pastel rounded-lg p-6 text-center text-origen-bosque">
          <p>No hay actividad reciente</p>
          <p className="text-sm mt-2">Los datos aparecerán cuando tengas visitas o pedidos</p>
        </div>
      ) : !isCollapsed && (
        isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-origen-pradera animate-spin" />
            </div>
          </div>
        ) : (
          <StatGrid items={statsItems} columns={4} />
        )
      )}
    </motion.div>
  );
}
