/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — patrón "Bosque Comercial" v5.6.
 *
 * Escritorio (≥lg): layout de 2 columnas — `FilterSidebarPanel` (columna
 * lateral fija con draft + "Aplicar filtros", igual patrón que
 * `FilterSidebar` de origen-web para catálogos públicos, pero con el
 * modelo de interacción de `FilterPanel`) + el contenido principal
 * (`children`, que el consumidor pasa: la tabla/lista de pedidos).
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet) con las mismas secciones que el sidebar.
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FilterSidebarPanel,
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
  SearchInput,
  useIsMobile,
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

export interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFilterChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
  totalOrders: number;
  className?: string;
  /** Contenido principal (lista móvil / tabla de pedidos) — columna derecha del layout de 2 columnas en escritorio. */
  children: React.ReactNode;
}

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  className,
  children,
}: OrderFiltersProps) {
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

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

  // ── Secciones — compartidas entre el sidebar de escritorio y el bottom sheet móvil ──
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

  const resultLabel = totalOrders === 1 ? 'pedido' : 'pedidos';

  return (
    <div className={cn('lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start', className)}>

      {/* ── Escritorio (≥lg): sidebar de filtros siempre visible, con draft + Aplicar ── */}
      <FilterSidebarPanel
        className="hidden lg:flex lg:sticky lg:top-24"
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalOrders}
        resultLabel={resultLabel}
      >
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          onDebouncedChange={(v) => onFilterChange({ search: v || undefined } as OrderFiltersType)}
          debounceMs={300}
          placeholder="Buscar pedido o cliente..."
          aria-label="Buscar pedidos"
          size="md"
        />
      </FilterSidebarPanel>

      <div className="space-y-2 min-w-0">
        {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
        <div className="lg:hidden">
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

        {children}
      </div>

      {/* ── Panel de filtros: solo bottom sheet (<lg) ────────────────────────── */}
      {isMobile && (
        <FilterPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          triggerRef={filtersButtonRef}
          sections={sections}
          onClearAll={onClearFilters}
          resultCount={totalOrders}
          resultLabel={resultLabel}
        />
      )}
    </div>
  );
}
