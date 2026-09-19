/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — patrón "Bosque Comercial" v6 (Opción B,
 * decisión del humano en vivo 2026-09-03: panel bajo demanda también en
 * escritorio, ver claude-agile/proyectos/origen-dashboard/tareas-completadas.md).
 *
 * Todos los breakpoints: `FilterToolbar` (búsqueda + botón "Filtros" con
 * badge contador) + `FilterPanel` — bottom sheet en móvil/tablet (<lg),
 * panel deslizante ("drawer") desde el borde derecho en escritorio (≥lg).
 * Antes, desktop tenía una barra inline siempre visible con controles
 * duplicados de los del panel — sustituida por este único punto de entrada,
 * evitando repetir el patrón de sidebar fijo de 280px que se revirtió por
 * romper el responsive.
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
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/order';

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendientes' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped',    label: 'Enviados' },
  { value: 'delivered',  label: 'Entregados' },
  { value: 'cancelled',  label: 'Cancelados' },
];

export type OrderSortBy = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc' | 'customer-asc';

export const ORDER_SORT_OPTIONS: Array<{ value: OrderSortBy; label: string }> = [
  { value: 'newest',       label: 'Más recientes' },
  { value: 'oldest',       label: 'Más antiguos' },
  { value: 'amount-desc',  label: 'Importe ↓' },
  { value: 'amount-asc',   label: 'Importe ↑' },
  { value: 'customer-asc', label: 'Cliente A-Z' },
];

export interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFilterChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
  totalOrders: number;
  sortBy: OrderSortBy;
  onSortChange: (value: OrderSortBy) => void;
  className?: string;
}

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  sortBy,
  onSortChange,
  className,
}: OrderFiltersProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');
  const sortLabel = ORDER_SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

  const set = (key: keyof OrderFiltersType, value: unknown) =>
    onFilterChange({ [key]: value || undefined } as OrderFiltersType);

  const formatDate = (date?: Date) => date ? date.toISOString().split('T')[0] : '';

  // ── Chips de filtros activos ─────────────────────────────────────────────────
  const activeChips: ActiveFilterChip[] = [
    ...(filters.status ? [{
      id: 'status',
      label: STATUS_OPTIONS.find(o => o.value === filters.status)?.label ?? filters.status,
      onRemove: () => set('status', ''),
    }] : []),
    ...(filters.dateFrom ? [{
      id: 'dateFrom',
      label: `Desde: ${formatDate(filters.dateFrom)}`,
      onRemove: () => set('dateFrom', undefined),
    }] : []),
    ...(filters.dateTo ? [{
      id: 'dateTo',
      label: `Hasta: ${formatDate(filters.dateTo)}`,
      onRemove: () => set('dateTo', undefined),
    }] : []),
    ...(filters.minAmount !== undefined ? [{
      id: 'minAmount',
      label: `Mín: ${filters.minAmount}€`,
      onRemove: () => set('minAmount', undefined),
    }] : []),
    ...(filters.maxAmount !== undefined ? [{
      id: 'maxAmount',
      label: `Máx: ${filters.maxAmount}€`,
      onRemove: () => set('maxAmount', undefined),
    }] : []),
  ];

  const activeCount = [
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].filter((v: any) => v !== undefined && v !== '' && v !== null).length;

  // ── Secciones del panel móvil ────────────────────────────────────────────────
  const sections: FilterSection[] = [
    {
      type: 'chips', id: 'status', title: 'Estado',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Pendientes', value: 'pending' },
        { label: 'Procesando', value: 'processing' },
        { label: 'Enviados', value: 'shipped' },
        { label: 'Entregados', value: 'delivered' },
        { label: 'Cancelados', value: 'cancelled' },
      ],
      value: filters.status ?? '',
      onChange: (v) => set('status', v as OrderStatus),
    },
    {
      type: 'daterange', id: 'period', title: 'Período',
      valueFrom: formatDate(filters.dateFrom),
      valueTo: formatDate(filters.dateTo),
      onChangeFrom: (v) => set('dateFrom', v ? new Date(v) : undefined),
      onChangeTo: (v) => set('dateTo', v ? new Date(v) : undefined),
    },
    {
      type: 'numberrange', id: 'amount', title: 'Importe',
      valueMin: filters.minAmount?.toString() ?? '',
      valueMax: filters.maxAmount?.toString() ?? '',
      onChangeMin: (v) => set('minAmount', v ? Number(v) : undefined),
      onChangeMax: (v) => set('maxAmount', v ? Number(v) : undefined),
      prefix: '€',
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Búsqueda + botón "Filtros" + "Ordenar" — mismo componente en todos los breakpoints ── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as OrderFiltersType)}
        searchDebounceMs={300}
        searchPlaceholder="Buscar pedido o cliente..."
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
        resultCount={totalOrders}
        resultLabel={totalOrders === 1 ? 'pedido' : 'pedidos'}
        variant="drawer"
      />

      {/* ── "Ordenar" — hoja propia, independiente de "Filtros"; selección inmediata ── */}
      <FilterBottomSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Ordenar por"
      >
        <div className="flex flex-col gap-1">
          {ORDER_SORT_OPTIONS.map((opt) => {
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
