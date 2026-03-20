/**
 * @component EmptyState
 * @description Estado vacío unificado para todas las secciones del dashboard.
 *              Reemplaza los estados vacíos ad-hoc dispersos por páginas.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon:        React.ElementType;
  title:       string;
  description?: string;
  action?:     React.ReactNode;
  className?:  string;
  /** Tamaño del ícono central */
  size?:       'sm' | 'md' | 'lg';
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: { wrapper: 'w-10 h-10 sm:w-12 sm:h-12', icon: 'w-5 h-5 sm:w-6 sm:h-6' },
  md: { wrapper: 'w-12 h-12 sm:w-16 sm:h-16', icon: 'w-6 h-6 sm:w-8 sm:h-8' },
  lg: { wrapper: 'w-16 h-16 sm:w-20 sm:h-20', icon: 'w-8 h-8 sm:w-10 sm:h-10' },
} as const;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Estado vacío con animación de entrada sutil.
 * Acepta un nodo `action` para CTA (botón "Añadir producto", etc.).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = SIZE_MAP[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-8 sm:py-12 px-6',
        className,
      )}
    >
      {/* Ícono con halo */}
      <div
        className={cn(
          sizes.wrapper,
          'rounded-full bg-origen-pastel flex items-center justify-center mb-4',
        )}
      >
        <Icon className={cn(sizes.icon, 'text-origen-pino')} />
      </div>

      {/* Texto */}
      <p className="text-sm font-semibold text-origen-bosque mb-1">{title}</p>

      {description && (
        <p className="text-xs sm:text-sm text-text-subtle max-w-[260px]">
          {description}
        </p>
      )}

      {/* CTA opcional */}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
