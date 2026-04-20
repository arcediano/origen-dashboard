/**
 * @file OrderFilters.tsx
 * @description Filtros de pedidos — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón toggle → FilterPanel inline (sin overlay)
 * Desktop → barra de búsqueda + Select para estado + inputs de fecha e importe
 */

'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, Euro, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBottomSheet } from '@/components/shared/mobile';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
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

const triggerCls = 'h-9 py-0 sm:py-0 px-3 sm:px-3 text-sm bg-surface-alt border-border w-auto';

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

  return (
    <div className={cn('space-y-0', className)}>

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
              onClick={() => { setLocalSearch(''); onFilterChange({ search: undefined } as OrderFiltersType); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-origen-bosque transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botón abrir filtros — móvil */}
        <button
          onClick={() => setPanelOpen(prev => !prev)}
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

      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterBottomSheet
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

        <Select value={filters.status ?? ''} onValueChange={(v) => set('status', v as OrderStatus || undefined)} className="w-auto">
          <SelectTrigger className={triggerCls}>
            <SelectValue className="text-sm">
              {filters.status
                ? STATUS_OPTIONS.find(o => o.value === filters.status)?.label
                : <span className="text-text-disabled">Todos los estados</span>}
            </SelectValue>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle ml-2" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

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

