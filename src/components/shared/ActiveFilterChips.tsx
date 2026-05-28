/**
 * @component ActiveFilterChips
 * @description Muestra los filtros activos como chips eliminables.
 *
 * - Móvil: fila scrollable horizontal (sin overflow visible)
 * - Desktop: fila con wrap
 * - Retorna null si no hay chips — no ocupa espacio en el layout
 *
 * Uso:
 * ```tsx
 * <ActiveFilterChips
 *   chips={[{ id: 'status', label: 'Activos', onRemove: () => onStatusChange('') }]}
 *   onClearAll={onClearFilters}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActiveFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilterChips({ chips, onClearAll, className }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Filtros activos"
      className={cn(
        // Scroll horizontal en móvil, wrap en desktop
        'flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5',
        'sm:flex-wrap sm:overflow-visible',
        className,
      )}
    >
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={cn(
            'flex-shrink-0 inline-flex items-center gap-1',
            'pl-2.5 pr-1 py-1 rounded-full',
            'bg-origen-bosque/8 border border-origen-bosque/15',
            'text-xs font-medium text-origen-bosque',
            'transition-colors',
          )}
        >
          <span className="leading-none whitespace-nowrap">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className={cn(
              'inline-flex items-center justify-center w-4 h-4 rounded-full',
              'hover:bg-origen-bosque/15 transition-colors',
              // Área táctil mínima 44×44px en móvil vía padding negativo
              'after:content-[""] after:absolute after:inset-[-8px]',
              'relative',
            )}
            aria-label={`Quitar filtro: ${chip.label}`}
          >
            <X className="w-2.5 h-2.5" aria-hidden />
          </button>
        </div>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex-shrink-0 text-xs text-text-subtle hover:text-origen-bosque underline-offset-2 hover:underline transition-colors whitespace-nowrap ml-0.5"
          aria-label="Limpiar todos los filtros activos"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
