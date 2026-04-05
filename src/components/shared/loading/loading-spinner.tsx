/**
 * @file loading-spinner.tsx
 * @description Componentes de carga centralizados para toda la aplicación.
 *
 * Exporta tres componentes:
 *   - `Spinner`       — SVG elegante (arco sobre pista semitransparente) para botones y acciones
 *   - `SectionLoader` — Spinner + mensaje para cards y paneles
 *   - `LoadingSkeleton` — Esqueleto animado para contenido estructurado
 *
 * Alias retrocompatible: `LoadingSpinner` → `Spinner`
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@arcediano/ux-library';

// ============================================================================
// TIPOS
// ============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'secondary' | 'white';

export interface SpinnerProps {
  /** Tamaño del spinner */
  size?: SpinnerSize;
  /** Variante de color */
  variant?: SpinnerVariant;
  /** Clase CSS adicional */
  className?: string;
  /** Texto alternativo para accesibilidad */
  label?: string;
}

export interface SectionLoaderProps {
  /** Mensaje descriptivo bajo el spinner */
  message?: string;
  /** Tamaño del spinner */
  size?: SpinnerSize;
  /** Clase CSS adicional */
  className?: string;
}

export interface LoadingSkeletonProps {
  /** Número de líneas (para texto/tabla) */
  lines?: number;
  /** Tipo de skeleton */
  type?: 'text' | 'card' | 'table' | 'image' | 'custom';
  /** Clase CSS adicional */
  className?: string;
  /** Ancho del skeleton */
  width?: string;
  /** Alto del skeleton */
  height?: string;
  /** Si debe tener animación */
  animate?: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors: Record<SpinnerVariant, string> = {
  default:   'text-text-subtle',
  primary:   'text-origen-pradera',
  secondary: 'text-origen-hoja',
  white:     'text-white',
};

// ============================================================================
// SPINNER
// ============================================================================

/**
 * Spinner SVG elegante: arco animado sobre pista semitransparente.
 * Reemplaza `border-t-transparent` divs y el antiguo `RefreshCw`.
 *
 * @example
 * // En botones de acción
 * <Spinner size="sm" variant="white" />
 *
 * // En secciones de carga
 * <Spinner size="lg" variant="primary" />
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Cargando...',
}: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', spinnerSizes[size], spinnerColors[variant], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label={label}
      role="status"
    >
      {/* Pista semitransparente */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.15"
      />
      {/* Arco activo */}
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// SECTION LOADER
// ============================================================================

/**
 * Loader para cards y paneles: spinner centrado con mensaje opcional.
 * Reemplaza el patrón `Loader2 + <p>Cargando...</p>` en componentes de dashboard.
 *
 * @example
 * {isLoading && <SectionLoader message="Cargando pedidos..." />}
 */
export function SectionLoader({
  message,
  size = 'lg',
  className,
}: SectionLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10 px-6', className)}>
      <Spinner size={size} variant="primary" />
      {message && (
        <p className="text-sm text-text-subtle font-medium">{message}</p>
      )}
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

/**
 * Esqueleto animado para contenido estructurado (texto, cards, tablas, imágenes).
 *
 * @example
 * <LoadingSkeleton type="card" />
 * <LoadingSkeleton type="table" lines={5} />
 */
export function LoadingSkeleton({
  lines = 3,
  type = 'text',
  className,
  width,
  height,
  animate = true,
}: LoadingSkeletonProps) {
  const baseClass = cn('bg-origen-pastel', animate && 'animate-pulse', 'rounded');

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

  if (type === 'image') {
    return (
      <div
        className={cn(baseClass, 'aspect-square rounded-lg', className)}
        style={{ width, height }}
      />
    );
  }

  // Texto (por defecto)
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, 'h-4')}
          style={{
            width: width || (i === lines - 1 ? '60%' : '100%'),
            height: height || '1rem',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ALIAS RETROCOMPATIBLE
// ============================================================================

/**
 * @deprecated Usa `Spinner` en su lugar.
 */
export const LoadingSpinner = Spinner;
export type LoadingSpinnerProps = SpinnerProps;
export type LoadingSize = SpinnerSize;
export type LoadingVariant = SpinnerVariant;
