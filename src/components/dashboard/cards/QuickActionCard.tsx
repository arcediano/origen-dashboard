/**
 * @file QuickActionCard.tsx
 * @description Tarjeta de acción rápida - ESTILO EXACTO DE BENEFITSSECTION
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  gradient?: string;
  badge?: string | number;
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  gradient = 'from-origen-pradera to-origen-hoja',
  badge,
  className
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block group relative">
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
        <div className="flex items-center gap-4">
          {/* Icono circular */}
          <div className={cn(
            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-subtle",
            gradient
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-origen-bosque">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-origen-pradera text-white rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-origen-pradera group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}