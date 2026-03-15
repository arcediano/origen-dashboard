/**
 * @file page-loader.tsx
 * @description Componente simple para cargar páginas
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export interface PageLoaderProps {
  /** Mensaje a mostrar */
  message?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function PageLoader({
  message = 'Cargando...',
  className
}: PageLoaderProps) {
  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-b from-white to-origen-crema',
      'flex items-center justify-center p-4',
      className
    )}>
      <div className="flex flex-col items-center text-center">
        <RefreshCw className="w-12 h-12 text-origen-pradera animate-spin mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-origen-bosque mb-2">
          {message}
        </h3>
        <p className="text-xs text-gray-400">
          Esto puede tomar unos segundos
        </p>
      </div>
    </div>
  );
}
