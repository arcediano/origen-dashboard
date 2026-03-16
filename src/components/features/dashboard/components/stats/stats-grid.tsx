/**
 * @file stats-grid.tsx
 * @description Grid de tarjetas de estadísticas
 */

'use client';

import { motion } from 'framer-motion';
import { Eye, ShoppingBag, DollarSign, Star, Loader2 } from 'lucide-react';
import { StatsCard } from './stats-card';
import { itemVariants } from '../layout/dashboard-shell';
import type { DashboardStats } from '../../types';

interface StatsGridProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
  className?: string;
}

// Valores por defecto para mostrar mientras carga
const DEFAULT_STATS: DashboardStats = {
  profileViews: { today: 0, trend: { value: 0, isPositive: true } },
  orders: { today: 0, trend: { value: 0, isPositive: true } },
  revenue: { today: 0, trend: { value: 0, isPositive: true } },
  rating: { average: 0, total: 0 },
};

export function StatsGrid({ stats, isLoading = false, className }: StatsGridProps) {
  const displayStats = stats || DEFAULT_STATS;

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
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className || ''}`}
    >
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
            gradient={stat.gradient}
          />
        ))
      )}
    </motion.div>
  );
}
