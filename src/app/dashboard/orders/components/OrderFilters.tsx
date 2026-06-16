/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón toggle → FilterSheet (móvil)
 * Desktop → barra de búsqueda + Select para estado + inputs de fecha e importe
 */

'use client';

import React from 'react';
import { Euro, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterSheet,
  ActiveFilterChips,
  type ActiveFilterChip,
  ToggleGroup, ToggleGroupItem,
} from '@arcediano/ux-library';
import { Input, Button, DateInput } from '@arcediano/ux-library';
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
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const activeCount = [
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].filter((v: any) => v !== undefined && v !== '' && v !== null).length;

  const hasAnyFilter = Boolean(filters.search) || activeCount > 0;

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ search: value || undefined } as OrderFiltersType);
    }, 300);
    return () => clearTimeout(timer);
  };

  const set = (key: keyof OrderFiltersType, value: any) =>
    onFilterChange({ [key]: value || undefined } as OrderFiltersType);

  const formatDate = (date?: Date) => date ? date.toISOString().split('T')[0] : '';

  // Chips de filtros activos: visibles en móvil (fuera del sheet) y en desktop
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

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── FilterToolbar: búsqueda + botón filtros (móvil) con debounce ──────────── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as OrderFiltersType)}
        searchDebounceMs={300}
        searchPlaceholder="Buscar pedido o cliente..."
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
      />

      {/* ── Chips de filtros activos — móvil y desktop ────────────────────────────────── */}
      <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />

      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterSheet
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        sections={[
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
        ]}
        onClearAll={onClearFilters}
        resultCount={totalOrders}
        resultLabel={totalOrders === 1 ? 'pedido' : 'pedidos'}
      />

      {/* ── Filtros desktop: estado + fechas + importe ────────────────── */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 pt-2">

        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={filters.status ?? ''}
          onValueChange={(v) => {
            const val = typeof v === 'string' ? v : '';
            set('status', val as OrderStatus || undefined);
          }}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="" aria-label="Todos los estados">Todos</ToggleGroupItem>
          <ToggleGroupItem value="pending" aria-label="Pendientes">Pendientes</ToggleGroupItem>
          <ToggleGroupItem value="processing" aria-label="Procesando">Procesando</ToggleGroupItem>
          <ToggleGroupItem value="shipped" aria-label="Enviados">Enviados</ToggleGroupItem>
          <ToggleGroupItem value="delivered" aria-label="Entregados">Entregados</ToggleGroupItem>
          <ToggleGroupItem value="cancelled" aria-label="Cancelados">Cancelados</ToggleGroupItem>
        </ToggleGroup>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <div className="flex items-center gap-1.5">
          <div className="w-40">
            <DateInput value={formatDate(filters.dateFrom)} onChange={(e) => set('dateFrom', e.target.value ? new Date(e.target.value) : undefined)} inputSize="sm" className="bg-surface-alt border-border" aria-label="Fecha desde" />
          </div>
          <span className="text-text-subtle text-xs">—</span>
          <div className="w-40">
            <DateInput value={formatDate(filters.dateTo)} onChange={(e) => set('dateTo', e.target.value ? new Date(e.target.value) : undefined)} inputSize="sm" className="bg-surface-alt border-border" aria-label="Fecha hasta" />
          </div>
        </div>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <div className="flex items-center gap-1.5">
          <div className="w-28">
            <Input type="number" value={filters.minAmount ?? ''} min={0} placeholder="Mín €" onChange={(e) => set('minAmount', e.target.value ? Number(e.target.value) : undefined)} inputSize="sm" leftIcon={<Euro />} className="bg-surface-alt border-border" />
          </div>
          <span className="text-text-subtle text-xs">—</span>
          <div className="w-28">
            <Input type="number" value={filters.maxAmount ?? ''} min={0} placeholder="Máx €" onChange={(e) => set('maxAmount', e.target.value ? Number(e.target.value) : undefined)} inputSize="sm" leftIcon={<Euro />} className="bg-surface-alt border-border" />
          </div>
        </div>

        {hasAnyFilter && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <Button variant="ghost" size="sm" onClick={onClearFilters} leftIcon={<X className="w-3 h-3" />}>
              Limpiar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

