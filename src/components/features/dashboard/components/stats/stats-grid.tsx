/**
 * @file stats-grid.tsx
 * @description Grid de tarjetas de estadísticas
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, DollarSign, Star, Loader2, ChevronRight } from 'lucide-react';
import { StatsCard } from './stats-card';
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

  const statsConfig = [
    {
      key: 'profileViews',
      label: 'Visitas hoy',
      value: displayStats.profileViews.today,
      icon: Eye,
      gradient: 'from-origen-pradera to-origen-hoja',
      trend: displayStats.profileViews.trend,
    },
    {
      key: 'orders',
      label: 'Pedidos hoy',
      value: displayStats.orders.today,
      icon: ShoppingBag,
      gradient: 'from-origen-pradera to-origen-hoja',
      trend: displayStats.orders.trend,
    },
    {
      key: 'revenue',
      label: 'Ingresos hoy',
      value: `${displayStats.revenue.today}€`,
      icon: DollarSign,
      gradient: 'from-origen-hoja to-origen-pino',
      trend: displayStats.revenue.trend,
    },
    {
      key: 'rating',
      label: 'Valoración',
      value: displayStats.rating.average.toFixed(1),
      sublabel: `${displayStats.rating.total} reseñas`,
      icon: Star,
      gradient: 'from-origen-pino to-origen-bosque',
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {isLoading ? (
        // Estado de carga - Spinner centrado
        <div className="col-span-full flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-origen-pradera animate-spin" />
        </div>
      ) : (
        // Estadísticas normales
        statsConfig.map((stat) => (
          <StatsCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            sublabel={stat.sublabel}
            trend={stat.trend}
            icon={stat.icon}
            gradient={isEmpty ? 'from-origen-pastel to-origen-crema' : stat.gradient}
          />
        ))
        )}
      </div>
      )}
    </motion.div>
  );
}
