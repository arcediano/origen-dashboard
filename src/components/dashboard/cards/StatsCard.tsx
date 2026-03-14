/**
 * @file StatsCard.tsx
 * @description Tarjeta de estadísticas - ESTILO EXACTO DE BENEFITSSECTION
 */

'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ElementType;
  gradient?: string;
  className?: string;
}

export function StatsCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
  gradient = 'from-origen-pradera to-origen-hoja',
  className
}: StatsCardProps) {
  return (
    <div className="group relative">
      {/* EFECTO EXACTO DE BENEFITSSECTION */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-transform duration-300",
        "bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5",
        "group-hover:scale-[1.02]"
      )}></div>
      
      <div className={cn(
        "relative bg-white rounded-2xl p-6 border border-gray-200",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300",
        className
      )}>
        <div className="flex items-start gap-4">
          {/* Icono circular */}
          <div className={cn(
            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-subtle",
            gradient
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-origen-bosque">
                {value}
              </span>
              {sublabel && (
                <span className="text-sm text-gray-500">{sublabel}</span>
              )}
            </div>
            
            {trend && (
              <div className="flex items-center gap-2 mt-3">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  trend.isPositive 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trend.value}%</span>
                </div>
                <span className="text-xs text-gray-400">vs ayer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}