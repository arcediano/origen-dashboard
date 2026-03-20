/**
 * @file ProductItem.tsx
 * @description Item de producto - ESTILO EXACTO DE BENEFITSSECTION
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ProductItemProps {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sales?: number;
  trend?: number;
}

export function ProductItem({
  id,
  name,
  sku,
  price,
  stock,
  sales,
  trend
}: ProductItemProps) {
  const stockStatus = stock > 10 ? 'normal' : stock > 0 ? 'low' : 'out';
  
  const stockConfig = {
    normal: { color: 'bg-green-500', label: 'Stock OK' },
    low: { color: 'bg-amber-500', label: 'Stock bajo' },
    out: { color: 'bg-red-500', label: 'Sin stock' }
  };

  return (
    <Link href={`/products/${id}`} className="block group relative">
      {/* EFECTO EXACTO DE BENEFITSSECTION */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-transform duration-300",
        "bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5",
        "group-hover:scale-[1.02]"
      )}></div>
      
      <div className={cn(
        "relative bg-surface-alt rounded-xl sm:rounded-2xl p-3.5 sm:p-5 lg:p-6 border border-border",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icono circular */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center flex-shrink-0 shadow-subtle">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-origen-bosque truncate max-w-[130px] sm:max-w-[200px]">{name}</h3>
              <span className="text-[10px] sm:text-sm text-text-subtle flex-shrink-0 ml-2">SKU: {sku}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="font-semibold text-sm sm:text-xl text-origen-hoja">
                  {price.toFixed(2)}€
                </span>
                
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    stockConfig[stockStatus].color
                  )} />
                  <span className="text-xs sm:text-sm text-text-subtle">
                    {stock} uds
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {sales !== undefined && (
                  <span className="text-xs text-text-subtle hidden sm:inline">
                    {sales} vendidos
                  </span>
                )}
                {trend !== undefined && (
                  <span className={cn(
                    "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                    trend > 0 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
