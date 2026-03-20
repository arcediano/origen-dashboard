/**
 * @component MobileKPIRow
 * @description Fila horizontal scrollable de KPIs para móvil.
 *              Alternativa al grid 2×N que genera demasiadas filas.
 *              Visible solo en móvil (oculto con `hidden lg:hidden`, muestra en `block lg:hidden`).
 *
 * Tokens Origen v3.0. Cada tarjeta tiene ancho fijo para mantener densidad.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type StatCardAccent } from './MobileStatCard';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface KpiItem {
  label:     string;
  value:     string | number;
  icon:      React.ElementType;
  accent?:   StatCardAccent;
  secondary?: string;
}

export interface MobileKPIRowProps {
  items:      KpiItem[];
  className?: string;
  isLoading?: boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ACCENT_MAP: Record<StatCardAccent, { icon: string; bg: string; border: string }> = {
  pradera: { icon: 'text-origen-pradera', bg: 'from-origen-pradera/8 to-transparent', border: 'border-origen-pradera/20' },
  bosque:  { icon: 'text-origen-bosque',  bg: 'from-origen-bosque/8 to-transparent',  border: 'border-origen-bosque/20'  },
  amber:   { icon: 'text-amber-500',      bg: 'from-amber-50 to-transparent',         border: 'border-amber-200'         },
  red:     { icon: 'text-red-500',        bg: 'from-red-50 to-transparent',           border: 'border-red-200'           },
  blue:    { icon: 'text-blue-500',       bg: 'from-blue-50 to-transparent',          border: 'border-blue-200'          },
  green:   { icon: 'text-green-500',      bg: 'from-green-50 to-transparent',         border: 'border-green-200'         },
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="flex-shrink-0 w-[130px] p-3 rounded-xl border border-border-subtle bg-surface-alt animate-pulse">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-6 h-6 rounded-lg bg-gray-200" />
        <div className="w-14 h-2.5 rounded bg-gray-200" />
      </div>
      <div className="w-10 h-5 rounded bg-gray-200" />
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Fila de KPIs scrollable horizontal exclusiva para móvil.
 * Cada item tiene `w-[130px]` fijo para uniformidad visual.
 * El `-mx-4 px-4` permite que se sangre hasta el borde de pantalla.
 */
export function MobileKPIRow({
  items,
  className,
  isLoading = false,
}: MobileKPIRowProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'flex gap-3 overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none lg:hidden',
        className,
      )}>
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none lg:hidden',
        className,
      )}
    >
      {items.map((item, idx) => {
        const accent = item.accent ?? 'pradera';
        const styles = ACCENT_MAP[accent];
        const Icon   = item.icon;

        return (
          <div
            key={idx}
            className={cn(
              'flex-shrink-0 w-[130px] p-3 rounded-xl bg-gradient-to-br',
              styles.bg,
              'border',
              styles.border,
            )}
          >
            {/* Icono + etiqueta */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className={cn('w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0')}>
                <Icon className={cn('w-3.5 h-3.5', styles.icon)} />
              </div>
              <span className="text-[11px] font-medium text-text-subtle truncate leading-tight">
                {item.label}
              </span>
            </div>

            {/* Valor */}
            <p className="text-lg font-bold text-origen-bosque leading-none">
              {item.value}
            </p>

            {/* Info secundaria */}
            {item.secondary && (
              <p className="text-[10px] text-text-subtle mt-1 truncate">{item.secondary}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
