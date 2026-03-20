/**
 * @component ScrollChipFilter
 * @description Chips de filtro con scroll horizontal — aspecto nativo mobile-first.
 *              Tokens Origen v3.0: bosque/pradera/pastel.
 *
 * Uso:
 *   <ScrollChipFilter
 *     chips={[{ label: 'Todos', value: '' }, { label: 'Activos', value: 'active', count: 12 }]}
 *     value={activeFilter}
 *     onChange={setActiveFilter}
 *   />
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ChipItem {
  /** Etiqueta visible */
  label: string;
  /** Valor del filtro (vacío = "Todos") */
  value: string;
  /** Número de ítems (badge) */
  count?: number;
  /** Icono opcional antes del label */
  icon?: React.ElementType;
}

export interface ScrollChipFilterProps {
  chips: ChipItem[];
  /** Valor activo actualmente */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Fila horizontal scrollable de chips de filtro.
 * - En móvil: scrollable con sangrado hasta el borde de pantalla
 * - Chip activo: fondo bosque + texto blanco
 * - Chip inactivo: fondo pastel + texto pino
 * - Badge de conteo si `count > 0`
 */
export function ScrollChipFilter({
  chips,
  value,
  onChange,
  className,
}: ScrollChipFilterProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap',
        'scrollbar-none',
        className,
      )}
    >
      {chips.map((chip) => {
        const isActive = value === chip.value;
        const Icon = chip.icon;

        return (
          <motion.button
            key={chip.value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(chip.value)}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5',
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              'transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-origen-bosque border-origen-bosque text-white'
                : 'bg-origen-pastel border-origen-pradera/30 text-origen-pino hover:border-origen-pradera/60',
            )}
          >
            {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
            {chip.label}
            {chip.count !== undefined && chip.count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'min-w-[18px] h-[18px] px-1 rounded-full',
                  'text-[10px] font-bold leading-none',
                  isActive ? 'bg-white/25 text-white' : 'bg-origen-pradera/20 text-origen-pino',
                )}
              >
                {chip.count > 999 ? '999+' : chip.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
