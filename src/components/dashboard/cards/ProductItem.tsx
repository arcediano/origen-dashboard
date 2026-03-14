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
        "relative bg-white rounded-2xl p-6 border border-gray-200",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300"
      )}>
        <div className="flex items-center gap-4">
          {/* Icono circular */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center flex-shrink-0 shadow-subtle">
            <Package className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-origen-bosque truncate max-w-[200px]">{name}</h3>
              <span className="text-sm text-gray-500">SKU: {sku}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-xl text-origen-hoja">
                  {price.toFixed(2)}€
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    stockConfig[stockStatus].color
                  )} />
                  <span className="text-sm text-gray-600">
                    {stock} uds
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {sales !== undefined && (
                  <span className="text-sm text-gray-600">
                    {sales} vendidos
                  </span>
                )}
                {trend !== undefined && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
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