/**
 * @file StatsCard.tsx
 * @description Tarjeta de estadísticas con altura consistente
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
    <div className="group relative h-full">
      {/* Efecto hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-transform duration-300",
        "bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5",
        "group-hover:scale-[1.02]"
      )}></div>
      
      <div className={cn(
        "relative bg-surface-alt rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-border",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300",
        "h-full flex flex-col",
        className
      )}>
        <div className="flex items-start gap-2 sm:gap-4 flex-1">
          {/* Icono circular */}
          <div className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-subtle",
            gradient
          )}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-text-subtle mb-0.5 sm:mb-1 leading-tight">{label}</p>
            
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-origen-bosque">
                {value}
              </span>
              {sublabel && (
                <span className="text-[10px] sm:text-sm text-text-subtle">{sublabel}</span>
              )}
            </div>
            
            {/* Trend — oculto en móvil para ahorrar espacio */}
            <div className="mt-1.5 sm:mt-3 min-h-0 sm:min-h-[28px]">
              {trend ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    trend.isPositive 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-feedback-danger-subtle text-red-700 border border-red-200"
                  )}>
                    {trend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{trend.value}%</span>
                  </div>
                  <span className="text-xs text-text-subtle">vs ayer</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
