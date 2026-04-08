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
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-transform duration-300",
        "bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5",
        "group-hover:scale-[1.02]"
      )}></div>
      
      <div className={cn(
        "relative bg-surface-alt rounded-2xl border border-border p-4 sm:p-5 lg:p-6",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300",
        className
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-subtle sm:h-14 sm:w-14 sm:rounded-xl",
            gradient
          )}>
            <Icon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-origen-bosque sm:text-base lg:text-lg">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-origen-pradera text-white rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{description}</p>
            )}
          </div>
          
          <ChevronRight className="h-4 w-4 text-text-subtle transition-all group-hover:translate-x-1 group-hover:text-origen-pradera sm:h-5 sm:w-5" />
        </div>
      </div>
    </Link>
  );
}
