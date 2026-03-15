/**
 * @file loading.tsx
 * @description Componentes de loading reutilizables para toda la aplicación
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, Package } from 'lucide-react';
import { Card } from '@/components/ui/atoms/card';

// ============================================================================
// TIPOS
// ============================================================================

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'default' | 'primary' | 'secondary' | 'white';

export interface LoadingSpinnerProps {
  /** Tamaño del spinner */
  size?: LoadingSize;
  /** Variante de color */
  variant?: LoadingVariant;
  /** Clase CSS adicional */
  className?: string;
  /** Texto alternativo para accesibilidad */
  label?: string;
}

export interface LoadingSkeletonProps {
  /** Número de líneas (para texto) */
  lines?: number;
  /** Tipo de skeleton */
  type?: 'text' | 'card' | 'table' | 'image' | 'custom';
  /** Clase CSS adicional */
  className?: string;
  /** Ancho del skeleton (para texto) */
  width?: string;
  /** Alto del skeleton (para texto) */
  height?: string;
  /** Si debe tener animación */
  animate?: boolean;
}





export interface LoadingDotsProps {
  /** Tamaño de los puntos */
  size?: LoadingSize;
  /** Color de los puntos */
  color?: string;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const sizeMap: Record<LoadingSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantMap: Record<LoadingVariant, string> = {
  default: 'text-gray-400',
  primary: 'text-origen-pradera',
  secondary: 'text-origen-hoja',
  white: 'text-white',
};

// ============================================================================
// COMPONENTES
// ============================================================================

/**
 * Spinner simple para botones o acciones pequeñas
 * 
 * @example
 * <LoadingSpinner size="sm" variant="primary" />
 * <Button disabled><LoadingSpinner size="xs" /> Cargando...</Button>
 */
export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary',
  className,
  label = 'Cargando...'
}: LoadingSpinnerProps) {
  return (
    <RefreshCw 
      className={cn(
        'animate-spin',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      aria-label={label}
    />
  );
}

/**
 * Esqueleto de carga para contenido
 * 
 * @example
 * <LoadingSkeleton type="card" lines={3} />
 * <LoadingSkeleton type="table" lines={5} />
 */
export function LoadingSkeleton({ 
  lines = 3, 
  type = 'text',
  className,
  width,
  height,
  animate = true
}: LoadingSkeletonProps) {
  const baseClass = cn(
    'bg-origen-pastel',
    animate && 'animate-pulse',
    'rounded'
  );

  // Skeleton para tarjetas
  if (type === 'card') {
    return (
      <Card className="p-4 space-y-3">
        <div className={cn(baseClass, 'h-32 w-full rounded-lg')} />
        <div className={cn(baseClass, 'h-4 w-3/4')} />
        <div className={cn(baseClass, 'h-4 w-1/2')} />
        <div className="flex justify-between">
          <div className={cn(baseClass, 'h-8 w-20')} />
          <div className={cn(baseClass, 'h-8 w-20')} />
        </div>
      </Card>
    );
  }

  // Skeleton para tablas
  if (type === 'table') {
    return (
      <div className="space-y-2">
        <div className={cn(baseClass, 'h-10 w-full')} />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn(baseClass, 'h-12 w-full')} />
        ))}
      </div>
    );
  }

  // Skeleton para imágenes
  if (type === 'image') {
    return (
      <div 
        className={cn(
          baseClass, 
          'aspect-square rounded-lg',
          className
        )}
        style={{ width, height }}
      />
    );
  }

  // Skeleton para texto (por defecto)
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, 'h-4')}
          style={{ 
            width: width || (i === lines - 1 ? '60%' : '100%'),
            height: height || '1rem'
          }}
        />
      ))}
    </div>
  );
}



/**
 * Puntos animados para estados de espera
 * 
 * @example
 * <LoadingDots size="md" />
 */
export function LoadingDots({ 
  size = 'md',
  color = 'bg-origen-pradera',
  className 
}: LoadingDotsProps) {
  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
  }[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(dotSize, 'rounded-full', color)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

// Necesitamos importar motion para las animaciones
import { motion } from 'framer-motion';