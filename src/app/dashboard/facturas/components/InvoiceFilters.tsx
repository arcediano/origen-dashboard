/**
 * @file InvoiceFilters.tsx
 * @description Filtros de facturas — patrón "Bosque Comercial" v6, unificado
 * con el resto de tablas del repo (2026-09-19): un único `FilterToolbar`
 * (búsqueda + botón "Filtros" con badge contador) + `FilterPanel`
 * (`variant="drawer"`: bottom sheet en móvil/tablet, panel deslizante en
 * escritorio) en todos los breakpoints, en vez de la barra de escritorio
 * `hidden lg:flex` (Select + DateInput inline) que duplicaba los mismos
 * controles del panel móvil.
 *
 * Los filtros activos aparecen como chips bajo la barra en todos los
 * breakpoints.
 */

'use client';

import React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  FilterBottomSheet,
  ActiveFilterChips,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';
import type { InvoiceFilterParams } from '@/lib/api/orders';

const STATUS_OPTIONS = [
  { value: 'issued', label: 'Emitidas' },
  { value: 'cancelled', label: 'Anuladas' },
  { value: 'all', label: 'Todas' },
];

export type InvoiceSortBy = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';

export const INVOICE_SORT_OPTIONS: Array<{ value: InvoiceSortBy; label: string }> = [
  { value: 'newest',      label: 'Más recientes' },
  { value: 'oldest',      label: 'Más antiguos' },
  { value: 'amount-desc', label: 'Importe ↓' },
  { value: 'amount-asc',  label: 'Importe ↑' },
];

export interface InvoiceFiltersProps {
  filters: InvoiceFilterParams;
  onFilterChange: (filters: InvoiceFilterParams) => void;
  onClearFilters: () => void;
  totalInvoices: number;
  sortBy: InvoiceSortBy;
  onSortChange: (value: InvoiceSortBy) => void;
  className?: string;
}

export function InvoiceFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalInvoices,
  sortBy,
  onSortChange,
  className,
}: InvoiceFiltersProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');
  const sortLabel = INVOICE_SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

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

      {/* ── Búsqueda + botón "Filtros" + "Ordenar" — mismo componente en todos los breakpoints ── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as InvoiceFilterParams)}
        searchDebounceMs={300}
        searchPlaceholder="Buscar por nº de factura o pedido..."
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
        compact
        actions={(
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
            aria-label={sortLabel ? `Ordenar (${sortLabel})` : 'Ordenar'}
            className={cn(
              'relative flex items-center gap-1.5 h-10 w-10 justify-center px-0 sm:w-auto sm:justify-start sm:px-3.5 rounded-xl border text-sm font-medium transition-colors flex-shrink-0',
              sortBy !== 'newest'
                ? 'bg-origen-bosque border-origen-bosque text-white'
                : 'bg-surface-alt border-border text-origen-bosque',
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">Ordenar</span>
          </button>
        )}
      />

      {/* ── Chips de filtros activos — solo cuando hay filtros activos ───────── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Panel de filtros: bottom sheet (<lg) / drawer deslizante (≥lg) ────── */}
      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        triggerRef={filtersButtonRef}
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalInvoices}
        resultLabel={totalInvoices === 1 ? 'factura' : 'facturas'}
        variant="drawer"
      />

      {/* ── "Ordenar" — hoja propia, independiente de "Filtros"; selección inmediata ── */}
      <FilterBottomSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Ordenar por"
      >
        <div className="flex flex-col gap-1">
          {INVOICE_SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  setSortOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                  active ? 'bg-origen-nube text-origen-bosque' : 'text-origen-oscuro hover:bg-surface',
                )}
              >
                <span>{opt.label}</span>
                {active && <Check className="w-4 h-4 text-origen-bosque flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </FilterBottomSheet>
    </div>
  );
}
