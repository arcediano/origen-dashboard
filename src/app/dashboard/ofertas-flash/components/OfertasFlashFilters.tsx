/**
 * @file OfertasFlashFilters.tsx
 * @description Filtros de ofertas flash — patrón "Bosque Comercial" v5.5.
 *
 * Desktop (≥lg): controles siempre visibles en línea — búsqueda por producto
 * + Select de estado.
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet) con las mismas secciones.
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
  SearchInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useIsMobile,
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
  const isMobile = useIsMobile(1024);
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

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border-subtle rounded-xl px-3 py-2 shadow-sm">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por producto..."
          aria-label="Buscar ofertas flash"
          className="min-w-[240px] flex-1"
          size="md"
        />
        <Select value={statusFilter} onValueChange={onStatusChange} className="w-auto">
          <SelectTrigger className="min-w-[160px] max-w-[200px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
      <div className="lg:hidden">
        <FilterToolbar
          searchValue={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Buscar por producto..."
          searchAriaLabel="Buscar ofertas flash"
          activeFilterCount={activeCount}
          onOpenFilters={() => setPanelOpen(true)}
          filtersButtonRef={filtersButtonRef}
        />
      </div>

      {/* ── Chips de filtros activos — solo cuando hay filtros activos ───────── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={() => onStatusChange('todas')} />
        </div>
      )}

      {/* ── Panel de filtros: solo bottom sheet (<lg) ────────────────────────── */}
      {isMobile && (
        <FilterPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          triggerRef={filtersButtonRef}
          sections={sections}
          onClearAll={() => onStatusChange('todas')}
          resultCount={totalDeals}
          resultLabel={totalDeals === 1 ? 'oferta' : 'ofertas'}
        />
      )}
    </div>
  );
}

export default OfertasFlashFilters;
