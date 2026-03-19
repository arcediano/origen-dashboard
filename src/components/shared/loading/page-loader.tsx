/**
 * @file page-loader.tsx
 * @description Loader de página completa. Usado durante redirecciones y carga inicial.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './loading-spinner';

export interface PageLoaderProps {
  /** Mensaje principal */
  message?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function PageLoader({
  message = 'Cargando...',
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b from-white to-origen-crema',
        'flex items-center justify-center p-4',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <Spinner size="xl" variant="primary" />
        <h3 className="text-lg sm:text-xl font-semibold text-origen-bosque">
          {message}
        </h3>
        <p className="text-xs text-text-subtle">Esto puede tomar unos segundos</p>
      </div>
    </div>
  );
}
