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
        "relative bg-surface-alt rounded-2xl p-6 border border-border",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300",
        "h-full flex flex-col", // Altura consistente
        className
      )}>
        <div className="flex items-start gap-4 flex-1">
          {/* Icono circular */}
          <div className={cn(
            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-subtle",
            gradient
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-origen-bosque">
                {value}
              </span>
              {sublabel && (
                <span className="text-sm text-muted-foreground">{sublabel}</span>
              )}
            </div>
            
            {/* Área de trend con altura fija para consistencia */}
            <div className="mt-3 min-h-[28px]">
              {trend ? (
                <div className="flex items-center gap-2">
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
                  <span className="text-xs text-text-subtle">vs ayer</span>
                </div>
              ) : (
                // Placeholder invisible para mantener altura
                <div className="h-7" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
