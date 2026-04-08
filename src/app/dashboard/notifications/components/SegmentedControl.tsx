/**
 * @component SegmentedControl
 * @description Reemplaza TabsList/TabsTrigger con diseño nativo de iOS/Android.
 *              Pill activo animado con motion.div layoutId.
 *              min-h-[44px] para cumplir el tap target de 44×44px en móvil.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SegmentItem {
  value:  string;
  label:  string;
  icon?:  React.ElementType;
}

export interface SegmentedControlProps {
  items:     SegmentItem[];
  active:    string;
  onChange:  (value: string) => void;
  className?: string;
  /** ID único para las animaciones de layoutId (útil si hay varios en la misma página) */
  layoutId?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Control segmentado con animación de pill deslizante.
 * Usa `layoutId` de Framer Motion para la transición suave del indicador activo.
 */
export function SegmentedControl({
  items,
  active,
  onChange,
  className,
  layoutId = 'segment-pill',
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center w-full rounded-2xl p-1.5',
        'border border-border-subtle bg-surface',
        'min-h-[44px]',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        const Icon = item.icon;

        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5',
              'rounded-xl text-sm font-semibold transition-colors',
              'min-h-[40px] px-3',
              isActive ? 'text-white' : 'text-text-subtle hover:text-origen-bosque',
            )}
          >
            {/* Pill activo */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-origen-bosque to-origen-pino rounded-xl shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {/* Content (sobre el pill) */}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon className="w-4 h-4" />}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
