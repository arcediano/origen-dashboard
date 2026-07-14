/**
 * @file InvoiceFilters.tsx
 * @description Filtros de facturas — patrón "Bosque Comercial" v5.5 simplificado.
 *
 * Desktop (≥lg): controles siempre visibles en línea — búsqueda (debounce
 * 300ms) + Select de estado (Emitidas/Anuladas/Todas) + DateInput para período.
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
  DateInput,
  useIsMobile,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';
import type { InvoiceFilterParams } from '@/lib/api/orders';

const STATUS_OPTIONS = [
  { value: 'issued', label: 'Emitidas' },
  { value: 'cancelled', label: 'Anuladas' },
  { value: 'all', label: 'Todas' },
];

export interface InvoiceFiltersProps {
  filters: InvoiceFilterParams;
  onFilterChange: (filters: InvoiceFilterParams) => void;
  onClearFilters: () => void;
  totalInvoices: number;
  className?: string;
}

export function InvoiceFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalInvoices,
  className,
}: InvoiceFiltersProps) {
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const set = (key: keyof InvoiceFilterParams, value: unknown) =>
    onFilterChange({ [key]: value || undefined } as InvoiceFilterParams);

  const formatDate = (dateStr?: string) => dateStr ?? '';

  // ── Chips de filtros activos ─────────────────────────────────────────────────
  const activeChips: ActiveFilterChip[] = [
    ...(filters.status && filters.status !== 'issued' ? [{
      id: 'status',
      label: STATUS_OPTIONS.find(o => o.value === filters.status)?.label ?? filters.status,
      onRemove: () => set('status', 'issued'),
    }] : []),
    ...(filters.dateFrom ? [{
      id: 'dateFrom',
      label: `Desde: ${filters.dateFrom}`,
      onRemove: () => set('dateFrom', undefined),
    }] : []),
    ...(filters.dateTo ? [{
      id: 'dateTo',
      label: `Hasta: ${filters.dateTo}`,
      onRemove: () => set('dateTo', undefined),
    }] : []),
  ];

  const activeCount = [
    filters.status && filters.status !== 'issued' ? 1 : 0,
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Secciones del panel móvil ────────────────────────────────────────────────
  const sections: FilterSection[] = [
    {
      type: 'chips',
      id: 'status',
      title: 'Estado',
      options: [
        { label: 'Emitidas', value: 'issued' },
        { label: 'Anuladas', value: 'cancelled' },
        { label: 'Todas', value: 'all' },
      ],
      value: filters.status ?? 'issued',
      onChange: (v) => set('status', v as 'issued' | 'cancelled' | 'all'),
    },
    {
      type: 'daterange',
      id: 'period',
      title: 'Período de emisión',
      valueFrom: formatDate(filters.dateFrom),
      valueTo: formatDate(filters.dateTo),
      onChangeFrom: (v) => set('dateFrom', v || undefined),
      onChangeTo: (v) => set('dateTo', v || undefined),
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border-subtle rounded-xl px-3 py-2 shadow-sm">
        {/* Búsqueda con debounce */}
        <SearchInput
          value={localSearch}
          onChange={(v) => {
            setLocalSearch(v);
          }}
          onDebouncedChange={(v) => onFilterChange({ search: v || undefined } as InvoiceFilterParams)}
          debounceMs={300}
          placeholder="Buscar por nº de factura o pedido..."
          aria-label="Buscar facturas"
          className="min-w-[240px] flex-1"
          size="md"
        />

        {/* Estado */}
        <Select value={filters.status ?? 'issued'} onValueChange={(v) => set('status', v as 'issued' | 'cancelled' | 'all')} className="w-auto">
          <SelectTrigger className="min-w-[140px] max-w-[160px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período: desde */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-text-subtle whitespace-nowrap">Desde</span>
          <DateInput
            value={formatDate(filters.dateFrom)}
            onChange={(e) => set('dateFrom', e.target.value || undefined)}
            inputSize="sm"
            className="w-[148px]"
            aria-label="Fecha desde"
          />
        </div>

        {/* Período: hasta */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-text-subtle whitespace-nowrap">Hasta</span>
          <DateInput
            value={formatDate(filters.dateTo)}
            onChange={(e) => set('dateTo', e.target.value || undefined)}
            inputSize="sm"
            className="w-[148px]"
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
      <div className="lg:hidden">
        <FilterToolbar
          searchValue={localSearch}
          onSearchChange={setLocalSearch}
          onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as InvoiceFilterParams)}
          searchDebounceMs={300}
          searchPlaceholder="Buscar por nº de factura o pedido..."
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
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Panel de filtros: solo bottom sheet (<lg) ────────────────────────── */}
      {isMobile && (
        <FilterPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          triggerRef={filtersButtonRef}
          sections={sections}
          onClearAll={onClearFilters}
          resultCount={totalInvoices}
          resultLabel={totalInvoices === 1 ? 'factura' : 'facturas'}
        />
      )}
    </div>
  );
}
