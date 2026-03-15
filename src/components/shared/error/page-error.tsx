/**
 * @file page-error.tsx
 * @description Componente simple para mostrar errores en páginas
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/ui/atoms/alert';
import { Button } from '@/components/ui/atoms/button';
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
      'min-h-screen bg-gradient-to-b from-white to-origen-crema',
      'flex items-center justify-center p-4',
      className
    )}>
      <div className="max-w-md w-full">
        <Alert
          variant="error"
          title={title}
          description={message}
          alertSize="lg"
          className="shadow-lg"
        >
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
