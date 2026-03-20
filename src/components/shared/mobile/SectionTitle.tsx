/**
 * @component SectionTitle
 * @description Título de sección compacto para vistas móvil del dashboard.
 *              Puede llevar acción secundaria (link "Ver todos", botón, etc.).
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SectionTitleProps {
  children:    React.ReactNode;
  action?:     React.ReactNode;
  className?:  string;
  /** Mostrar separador inferior */
  divider?:    boolean;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function SectionTitle({
  children,
  action,
  className,
  divider = false,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        divider && 'border-b border-border-subtle pb-2 mb-3',
        className,
      )}
    >
      <h2 className="text-base font-semibold text-origen-bosque leading-snug">
        {children}
      </h2>
      {action && (
        <div className="text-xs text-origen-pino font-medium">{action}</div>
      )}
    </div>
  );
}
