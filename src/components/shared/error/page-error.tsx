/**
 * @file page-error.tsx
 * @description Componente simple para mostrar errores en páginas
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@origen/ux-library';
import { Button } from '@origen/ux-library';
import { RefreshCw } from 'lucide-react';

export interface PageErrorProps {
  /** Título del error */
  title?: string;
  /** Mensaje descriptivo */
  message: string;
  /** Función de reintento */
  onRetry?: () => void;
  /** Texto del botón de reintento */
  retryText?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function PageError({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Reintentar',
  className
}: PageErrorProps) {
  return (
    <div className={cn(
      'flex items-center justify-center p-4',
      'min-h-[calc(100dvh-144px)] lg:min-h-screen',
      'lg:bg-gradient-to-b lg:from-white lg:to-origen-crema',
      className
    )}>
      <div className="max-w-md w-full">
        <Alert
          variant="error"
          className="shadow-lg"
        >
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          {onRetry && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {retryText}
              </Button>
            </div>
          )}
        </Alert>
      </div>
    </div>
  );
}

