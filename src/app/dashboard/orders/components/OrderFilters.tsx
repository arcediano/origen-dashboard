/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — patrón "Bosque Comercial" v5.5.
 *
 * Desktop (≥lg): controles siempre visibles en línea — búsqueda (debounce
 * 300ms) + Select de estado + DateInput para período + inputs de importe.
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
}

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  className,
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

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {/* Búsqueda con debounce */}
        <SearchInput
          value={localSearch}
          onChange={(v) => {
            setLocalSearch(v);
          }}
          onDebouncedChange={(v) => onFilterChange({ search: v || undefined } as OrderFiltersType)}
          debounceMs={300}
          placeholder="Buscar pedido o cliente..."
          aria-label="Buscar pedidos"
          className="min-w-[220px] flex-1"
          size="md"
        />

        {/* Estado — min-w calibrado a "Procesando" */}
        <Select value={filters.status ?? ''} onValueChange={(v) => set('status', v as OrderStatus)}>
          <SelectTrigger className="min-w-[140px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período: desde */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-subtle whitespace-nowrap">Desde</span>
          <DateInput
            value={formatDate(filters.dateFrom)}
            onChange={(e) => set('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
            inputSize="sm"
            className="min-w-[148px]"
            aria-label="Fecha desde"
          />
        </div>

        {/* Período: hasta */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-subtle whitespace-nowrap">Hasta</span>
          <DateInput
            value={formatDate(filters.dateTo)}
            onChange={(e) => set('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
            inputSize="sm"
            className="min-w-[148px]"
            aria-label="Fecha hasta"
          />
        </div>

        {/* Importe mínimo */}
        <div className="relative flex items-center min-w-[110px]">
          <span className="absolute left-3 text-sm text-text-subtle pointer-events-none select-none">€</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={filters.minAmount ?? ''}
            onChange={(e) => set('minAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Mín"
            aria-label="Importe mínimo"
            className={cn(
              'w-full h-10 rounded-xl border bg-muted/50 border-transparent pl-7 pr-3 text-sm',
              'placeholder:text-text-disabled text-origen-oscuro',
              'hover:bg-muted/70 focus:outline-none focus:bg-white focus:border-origen-pradera/30 focus:ring-2 focus:ring-origen-pradera/15',
              'transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
        </div>

        {/* Importe máximo */}
        <div className="relative flex items-center min-w-[110px]">
          <span className="absolute left-3 text-sm text-text-subtle pointer-events-none select-none">€</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={filters.maxAmount ?? ''}
            onChange={(e) => set('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Máx"
            aria-label="Importe máximo"
            className={cn(
              'w-full h-10 rounded-xl border bg-muted/50 border-transparent pl-7 pr-3 text-sm',
              'placeholder:text-text-disabled text-origen-oscuro',
              'hover:bg-muted/70 focus:outline-none focus:bg-white focus:border-origen-pradera/30 focus:ring-2 focus:ring-origen-pradera/15',
              'transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
        </div>
      </div>

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

      {/* ── Panel de filtros: solo bottom sheet (<lg) ────────────────────────── */}
      {isMobile && (
        <FilterPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          triggerRef={filtersButtonRef}
          sections={sections}
          onClearAll={onClearFilters}
          resultCount={totalOrders}
          resultLabel={totalOrders === 1 ? 'pedido' : 'pedidos'}
        />
      )}
    </div>
  );
}
