/**
 * @file ProductStats.tsx
 * @description Componente de estadísticas de productos - CON DISEÑO MEJORADO Y RESPONSIVE
 */

'use client';

import React from 'react';
import { 
  Package, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/atoms/tooltip';

export interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  totalRevenue?: number;
  avgRating?: number;
  totalSales?: number;
  totalViews?: number;
  className?: string;
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'pradera' | 'bosque' | 'amber' | 'red' | 'blue' | 'purple' | 'green' | 'menta';
  tooltip?: string;
  tooltipDetailed?: string;
  secondaryInfo?: {
    label: string;
    value: string | number;
    color?: string;
  };
}

function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'pradera',
  tooltip,
  tooltipDetailed,
  secondaryInfo
}: StatsCardProps) {
  // Definir colores para cada variante
  const colorStyles = {
    pradera: {
      bg: 'from-origen-pradera/5 to-transparent',
      border: 'border-origen-pradera/10',
      icon: 'text-origen-pradera',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    bosque: {
      bg: 'from-origen-bosque/5 to-transparent',
      border: 'border-origen-bosque/10',
      icon: 'text-origen-bosque',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    amber: {
      bg: 'from-amber-50/50 to-transparent',
      border: 'border-amber-100',
      icon: 'text-amber-500',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    red: {
      bg: 'from-red-50/50 to-transparent',
      border: 'border-red-100',
      icon: 'text-red-500',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    blue: {
      bg: 'from-blue-50/50 to-transparent',
      border: 'border-blue-100',
      icon: 'text-blue-500',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    purple: {
      bg: 'from-purple-50/50 to-transparent',
      border: 'border-purple-100',
      icon: 'text-purple-500',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    green: {
      bg: 'from-green-50/50 to-transparent',
      border: 'border-green-100',
      icon: 'text-green-500',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    },
    menta: {
      bg: 'from-origen-menta/5 to-transparent',
      border: 'border-origen-menta/20',
      icon: 'text-origen-menta',
      text: 'text-origen-bosque',
      value: 'text-origen-bosque'
    }
  };

  const styles = colorStyles[color];

  return (
    <div className={cn(
      'p-4 rounded-xl bg-gradient-to-br',
      styles.bg,
      'border',
      styles.border
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', styles.icon)} />
          <span className="text-xs font-medium text-gray-500">{label}</span>
        </div>
        {tooltip && (
          <Tooltip 
            content={tooltip} 
            detailed={tooltipDetailed}
            size="sm"
          />
        )}
      </div>
      
      <p className={cn('text-2xl font-bold', styles.value)}>
        {value}
      </p>
      
      {secondaryInfo && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs', secondaryInfo.color || 'text-gray-500')}>
          {secondaryInfo.label}
          <span className="font-medium">{secondaryInfo.value}</span>
        </div>
      )}
    </div>
  );
}

export function ProductStats({
  total,
  active,
  lowStock,
  outOfStock,
  totalRevenue,
  avgRating,
  totalSales,
  totalViews,
  className,
}: ProductStatsProps) {
  // Calcular cuántas tarjetas tenemos para ajustar el grid
  const hasRevenue = totalRevenue !== undefined;
  const hasRating = avgRating !== undefined;
  const hasSales = totalSales !== undefined;
  const hasViews = totalViews !== undefined;

  // Contar tarjetas base (siempre 4) + adicionales
  const totalCards = 4 + (hasRevenue ? 1 : 0) + (hasRating ? 1 : 0) + (hasSales ? 1 : 0) + (hasViews ? 1 : 0);

  // Determinar el grid según el número de tarjetas
  const getGridCols = () => {
    if (totalCards <= 4) return 'md:grid-cols-4';
    if (totalCards <= 6) return 'md:grid-cols-3 lg:grid-cols-6';
    return 'md:grid-cols-4 lg:grid-cols-7';
  };

  return (
    <div className={cn(
      'grid grid-cols-2 gap-3 sm:gap-4',
      getGridCols(),
      className
    )}>
      {/* Total productos */}
      <StatsCard
        label="Total productos"
        value={total}
        icon={Package}
        color="pradera"
        tooltip="Total productos"
        tooltipDetailed="Número total de productos en tu catálogo"
        secondaryInfo={{
          label: 'En catálogo',
          value: '100%',
          color: 'text-origen-pradera'
        }}
      />

      {/* Productos activos */}
      <StatsCard
        label="Activos"
        value={active}
        icon={CheckCircle}
        color="bosque"
        tooltip="Productos activos"
        tooltipDetailed="Productos publicados y disponibles para la venta"
        secondaryInfo={{
          label: 'Tasa de actividad',
          value: total > 0 ? `${Math.round((active / total) * 100)}%` : '0%',
          color: 'text-origen-bosque'
        }}
      />

      {/* Stock bajo */}
      <StatsCard
        label="Stock bajo"
        value={lowStock}
        icon={AlertCircle}
        color="amber"
        tooltip="Stock bajo"
        tooltipDetailed="Productos con stock por debajo del umbral"
        secondaryInfo={{
          label: 'Requieren atención',
          value: total > 0 ? `${Math.round((lowStock / total) * 100)}%` : '0%',
          color: 'text-amber-600'
        }}
      />

      {/* Productos agotados */}
      <StatsCard
        label="Agotados"
        value={outOfStock}
        icon={AlertCircle}
        color="red"
        tooltip="Productos agotados"
        tooltipDetailed="Productos sin stock disponible"
        secondaryInfo={{
          label: 'Sin stock',
          value: total > 0 ? `${Math.round((outOfStock / total) * 100)}%` : '0%',
          color: 'text-red-600'
        }}
      />

      {/* Ingresos totales (si existen) */}
      {hasRevenue && (
        <StatsCard
          label="Ingresos"
          value={`${totalRevenue.toFixed(0)}€`}
          icon={DollarSign}
          color="blue"
          tooltip="Ingresos totales"
          tooltipDetailed="Ingresos generados por todos los productos"
          secondaryInfo={{
            label: 'Media por producto',
            value: total > 0 ? `${(totalRevenue / total).toFixed(0)}€` : '0€',
            color: 'text-blue-600'
          }}
        />
      )}

      {/* Valoración media (si existe) */}
      {hasRating && (
        <StatsCard
          label="Valoración"
          value={avgRating.toFixed(1)}
          icon={Star}
          color="amber"
          tooltip="Valoración media"
          tooltipDetailed="Media de todas las valoraciones de productos"
          secondaryInfo={{
            label: 'Sobre 5',
            value: '',
            color: 'text-amber-600'
          }}
        />
      )}

      {/* Ventas totales (si existen) */}
      {hasSales && (
        <StatsCard
          label="Ventas"
          value={totalSales}
          icon={TrendingUp}
          color="purple"
          tooltip="Ventas totales"
          tooltipDetailed="Número total de unidades vendidas"
          secondaryInfo={{
            label: 'Unidades',
            value: '',
            color: 'text-purple-600'
          }}
        />
      )}

      {/* Vistas totales (si existen) */}
      {hasViews && (
        <StatsCard
          label="Vistas"
          value={totalViews}
          icon={TrendingUp}
          color="green"
          tooltip="Vistas totales"
          tooltipDetailed="Número total de visualizaciones de productos"
          secondaryInfo={{
            label: 'Páginas vistas',
            value: '',
            color: 'text-green-600'
          }}
        />
      )}
    </div>
  );
}