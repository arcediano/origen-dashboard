/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — patrón canónico "Bosque Comercial" v5.4.
 *
 * Barra de una sola línea: búsqueda (con debounce 300ms) + botón "Filtros"
 * (con badge de filtros activos). Al pulsar "Filtros" se abre `FilterPanel`:
 * - Móvil/tablet (<lg): bottom sheet a pantalla completa.
 * - Escritorio (≥lg): popover anclado al botón "Filtros".
 *
 * Secciones del panel: estado (chips), período (daterange), importe (numberrange).
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
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/order';

export interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFilterChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
  totalOrders: number;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendientes' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped',    label: 'Enviados' },
  { value: 'delivered',  label: 'Entregados' },
  { value: 'cancelled',  label: 'Cancelados' },
];

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  className,
}: OrderFiltersProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const set = (key: keyof OrderFiltersType, value: any) =>
    onFilterChange({ [key]: value || undefined } as OrderFiltersType);

  const formatDate = (date?: Date) => date ? date.toISOString().split('T')[0] : '';

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

      {/* ── Barra de una sola línea: búsqueda (debounce) + botón Filtros ─────────── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as OrderFiltersType)}
        searchDebounceMs={300}
        searchPlaceholder="Buscar pedido o cliente..."
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
      />

      {/* ── Zona de filtros activos — diferenciada visualmente del formulario ─────── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Panel de filtros: bottom sheet (móvil) o popover (desktop) ───────────── */}
      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        triggerRef={filtersButtonRef}
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalOrders}
        resultLabel={totalOrders === 1 ? 'pedido' : 'pedidos'}
      />
    </div>
  );
}
