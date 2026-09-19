/**
 * @file OfertasFlashFilters.tsx
 * @description Filtros de ofertas flash — patrón "Bosque Comercial" v5.5.
 *
 * `FilterToolbar` (búsqueda + botón "Filtros" con badge contador) en todos
 * los breakpoints + `FilterPanel` (bottom sheet en móvil, panel lateral en
 * escritorio) con las mismas secciones — mismo patrón que `/dashboard/products`.
 *
 * Los filtros activos aparecen como chips bajo la barra.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'todas', label: 'Todas las ofertas' },
  { value: 'active', label: 'Activas' },
  { value: 'scheduled', label: 'Programadas' },
  { value: 'finished', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

export interface OfertasFlashFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  totalDeals: number;
  className?: string;
}

export function OfertasFlashFilters({
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  totalDeals,
  className,
}: OfertasFlashFiltersProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);

  const activeChips: ActiveFilterChip[] = [
    ...(statusFilter !== 'todas' ? [{
      id: 'status',
      label: STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter,
      onRemove: () => onStatusChange('todas'),
    }] : []),
  ];

  const activeCount = statusFilter !== 'todas' ? 1 : 0;

  const sections: FilterSection[] = [
    {
      type: 'chips',
      id: 'status',
      title: 'Estado',
      options: STATUS_OPTIONS,
      value: statusFilter,
      onChange: (v) => onStatusChange(v),
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      <FilterToolbar
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por producto..."
        searchAriaLabel="Buscar ofertas flash"
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
        compact
      />

      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={() => onStatusChange('todas')} />
        </div>
      )}

      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        triggerRef={filtersButtonRef}
        sections={sections}
        onClearAll={() => onStatusChange('todas')}
        resultCount={totalDeals}
        resultLabel={totalDeals === 1 ? 'oferta' : 'ofertas'}
        variant="drawer"
      />
    </div>
  );
}

export default OfertasFlashFilters;
