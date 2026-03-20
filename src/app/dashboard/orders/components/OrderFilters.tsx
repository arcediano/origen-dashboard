/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterBottomSheet (pantalla completa)
 * Desktop → barra de búsqueda + chips pill para estado + inputs de fecha e importe
 */

'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, CalendarIcon, CalendarRange, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBottomSheet } from '@/components/shared/mobile';
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

const pillCls = (active: boolean) => cn(
  'inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
  active
    ? 'bg-origen-bosque border-origen-bosque text-white'
    : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50',
);

const dateInputCls = 'h-9 px-3 text-sm border border-border bg-surface-alt rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera/30 focus:border-origen-pradera';

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  className,
}: OrderFiltersProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const activeCount = [
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
  ].filter(v => v !== undefined && v !== '').length;

  const hasAnyFilter = Boolean(filters.search) || activeCount > 0;

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  const set = (key: keyof OrderFiltersType, value: any) =>
    onFilterChange({ ...filters, [key]: value || undefined });

  const formatDate = (date?: Date) => date ? date.toISOString().split('T')[0] : '';

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Barra de búsqueda + botón filtros ─────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar pedido o cliente..."
            className="w-full h-10 pl-9 pr-8 text-sm bg-surface-alt border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(''); onFilterChange({ ...filters, search: undefined }); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-origen-bosque transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botón Filtros — móvil */}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            'lg:hidden flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors',
            activeCount > 0
              ? 'bg-origen-bosque border-origen-bosque text-white'
              : 'bg-surface-alt border-border text-origen-bosque',
          )}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filtros desktop: estado + fechas + importe ────────────────── */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 pt-1">
        {/* Estado */}
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value}
            onClick={() => set('status', filters.status === opt.value ? undefined : opt.value as OrderStatus)}
            className={pillCls(filters.status === opt.value)}>{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Rango de fechas */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <input type="date" value={formatDate(filters.dateFrom)}
              onChange={(e) => set('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
              className={cn(dateInputCls, 'pl-8')} title="Desde" />
          </div>
          <span className="text-text-subtle text-xs">—</span>
          <div className="relative">
            <CalendarRange className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <input type="date" value={formatDate(filters.dateTo)}
              onChange={(e) => set('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
              className={cn(dateInputCls, 'pl-8')} title="Hasta" />
          </div>
        </div>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Rango de importe */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <input type="number" value={filters.minAmount ?? ''} min="0" placeholder="Mín €"
              onChange={(e) => set('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              className={cn(dateInputCls, 'pl-8 w-24')} />
          </div>
          <span className="text-text-subtle text-xs">—</span>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <input type="number" value={filters.maxAmount ?? ''} min="0" placeholder="Máx €"
              onChange={(e) => set('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              className={cn(dateInputCls, 'pl-8 w-24')} />
          </div>
        </div>

        {hasAnyFilter && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-text-subtle hover:text-origen-bosque transition-colors">
              <X className="w-3 h-3" />Limpiar
            </button>
          </>
        )}
      </div>

      {/* ── FilterBottomSheet (pantalla completa) — solo móvil ────────── */}
      <FilterBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtrar pedidos"
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
    </div>
  );
}
