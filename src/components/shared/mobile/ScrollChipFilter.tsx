/**
 * @component ScrollChipFilter
 * @description Wrapper shell sobre ScrollChipFilter de @arcediano/ux-library.
 *              Preserva la API publica original (chips/value/onChange, count, icon: ElementType)
 *              para compatibilidad con 7 consumidores actuales.
 *
 * Uso:
 *   <ScrollChipFilter
 *     chips={[{ label: 'Todos', value: '' }, { label: 'Activos', value: 'active', count: 12 }]}
 *     value={activeFilter}
 *     onChange={setActiveFilter}
 *   />
 *
 * Nota: el componente internamente delega en ScrollChipFilter de @arcediano/ux-library.
 *       El feedback tactil "whileTap" (Framer Motion) se ha removido, ya que
 *       ScrollChipFilter de libreria no soporta esta micro-interaccion.
 *       Si se detecta perdida perceptible del feedback tactil, se debe revisar
 *       y considerar anadir esa animacion a la libreria.
 */

'use client';

import React from 'react';
import { ScrollChipFilter as UXScrollChipFilter, type ScrollChipItem } from '@arcediano/ux-library';
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
 * - Chip activo: fondo bosque + texto blanco (estilos de libreria)
 * - Chip inactivo: fondo pastel + texto pino (estilos de libreria)
 * - Badge de conteo si `count > 0` (concatenado al label, ya que libreria
 *   no tiene badge de contador separado)
 */
export function ScrollChipFilter({
  chips,
  value,
  onChange,
  className,
}: ScrollChipFilterProps) {
  // Detectar si el primer chip es "Todos" (value === '')
  const firstChipIsAll = chips.length > 0 && chips[0].value === '';
  const hasAll = firstChipIsAll;
  const allLabel = firstChipIsAll ? chips[0].label : undefined;

  // Mapear chips: ChipItem[] -> ScrollChipItem[]
  // Si hasAll, excluir el primer chip de "items"
  const items: ScrollChipItem[] = (hasAll ? chips.slice(1) : chips).map((chip) => {
    let label = chip.label;
    // Si hay count, concatenarlo al label (libreria no tiene badge separado)
    if (chip.count !== undefined && chip.count > 0) {
      label = `${chip.label} ${chip.count > 999 ? '999+' : chip.count}`;
    }

    return {
      id: chip.value,
      label,
      icon: chip.icon ? <chip.icon className="h-3 w-3 flex-shrink-0" /> : undefined,
    };
  });

  // Adaptador de onChange: ScrollChipFilter de libreria emite (string | string[]),
  // pero como "multiple" es false (fijo), siempre sera string.
  // Type guard explicito para seguridad.
  const handleValueChange = (newValue: string | string[] | undefined) => {
    // Como multiple es false y value nunca sera array, usamos type guard
    const stringValue = typeof newValue === 'string' ? newValue : '';
    onChange(stringValue);
  };

  return (
    <UXScrollChipFilter
      items={items}
      value={value}
      multiple={false}
      hasAll={hasAll}
      allLabel={allLabel}
      onValueChange={handleValueChange}
      className={cn(
        '-mx-4 px-4 lg:mx-0 lg:px-0', // Sangrado a borde de pantalla actual
        className,
      )}
    />
  );
}
