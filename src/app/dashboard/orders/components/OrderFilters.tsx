/**
 * @component OrderFilters
 * @description Filtros para la lista de pedidos
 */

'use client';

import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Calendar,
  Calendar as CalendarIcon,
  CalendarRange
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/atoms/card';
import { ScrollChipFilter, type ChipItem, FilterBottomSheet } from '@/components/shared/mobile';
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/order';

export interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFilterChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
  totalOrders: number;
  className?: string;
}

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '', label: 'Todos los estados', icon: Filter, color: 'gray' },
  { value: 'pending', label: 'Pendientes', icon: Clock, color: 'amber' },
  { value: 'processing', label: 'Procesando', icon: Package, color: 'blue' },
  { value: 'shipped', label: 'Enviados', icon: Truck, color: 'purple' },
  { value: 'delivered', label: 'Entregados', icon: CheckCircle, color: 'green' },
  { value: 'cancelled', label: 'Cancelados', icon: XCircle, color: 'red' }
];

// Chips móvil
const STATUS_CHIPS: ChipItem[] = [
  { label: 'Todos',      value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Procesando', value: 'processing' },
  { label: 'Enviados',   value: 'shipped' },
  { label: 'Entregados', value: 'delivered' },
  { label: 'Cancelados', value: 'cancelled' },
];

export function OrderFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalOrders,
  className
}: OrderFiltersProps) {
  const [showFilterSheet, setShowFilterSheet] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(filters.search || '');

  const hasFilters = Boolean(
    filters.status ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount ||
    filters.maxAmount
  );

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  const toggleFilter = (key: keyof OrderFiltersType, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Formatear fecha para input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <>
    <Card variant="elevated" className={cn('p-3', className)}>
      {/* Chips de estado — sólo móvil */}
      <div className="sm:hidden mb-3">
        <ScrollChipFilter
          chips={STATUS_CHIPS}
          value={filters.status ?? ''}
          onChange={(val) => toggleFilter('status', val || undefined)}
        />
      </div>

      {/* Primera fila: búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar pedido o cliente..."
            className="w-full pl-9 pr-7 h-10 sm:h-9 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ ...filters, search: undefined });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilterSheet(true)}
          className="sm:hidden flex items-center justify-center h-10 px-3 border border-border rounded-md bg-surface-alt text-muted-foreground"
        >
          <Filter className="w-4 h-4 mr-2" />
          <span>Filtros</span>
          {hasFilters && (
            <span className="ml-2 w-5 h-5 rounded-full bg-origen-pradera text-white text-xs flex items-center justify-center">
              {Object.values(filters).filter(v => v !== undefined && v !== '').length}
            </span>
          )}
        </button>
      </div>

      {/* FilterBottomSheet se renderiza fuera del Card — ver abajo */}

      {/* Filtros desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 mt-3">
        {/* Estado */}
        <select
          value={filters.status || ''}
          onChange={(e) => toggleFilter('status', e.target.value || undefined)}
          className="h-9 px-3 text-sm border border-border bg-surface-alt rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Rango de fechas - CON PLACEHOLDERS MEJORADOS */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
            <input
              type="date"
              value={formatDateForInput(filters.dateFrom)}
              onChange={(e) => toggleFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-8 h-9 text-sm border border-border bg-surface-alt rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
              placeholder="dd/mm/aaaa"
              title="Fecha desde"
            />
          </div>
          <span className="text-text-subtle text-sm">→</span>
          <div className="relative">
            <CalendarRange className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
            <input
              type="date"
              value={formatDateForInput(filters.dateTo)}
              onChange={(e) => toggleFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-8 h-9 text-sm border border-border bg-surface-alt rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
              placeholder="dd/mm/aaaa"
              title="Fecha hasta"
            />
          </div>
        </div>

        {/* Rango de importe - CON PLACEHOLDERS DESCRIPTIVOS */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
            <input
              type="number"
              value={filters.minAmount || ''}
              onChange={(e) => toggleFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Mínimo €"
              className="w-24 pl-7 h-9 text-sm border border-border bg-surface-alt rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
              min="0"
              step="0.01"
            />
          </div>
          <span className="text-text-subtle">-</span>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
            <input
              type="number"
              value={filters.maxAmount || ''}
              onChange={(e) => toggleFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Máximo €"
              className="w-24 pl-7 h-9 text-sm border border-border bg-surface-alt rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-origen-pradera hover:text-origen-hoja hover:bg-origen-crema/50 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mt-2 text-xs text-text-subtle text-right">
        {totalOrders} {totalOrders === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
      </div>
    </Card>

    <FilterBottomSheet
      isOpen={showFilterSheet}
      onClose={() => setShowFilterSheet(false)}
      sections={[
        {
          type: 'chips',
          id: 'status',
          title: 'Estado',
          options: [
            { label: 'Todos', value: '' },
            { label: 'Pendientes', value: 'pending' },
            { label: 'Procesando', value: 'processing' },
            { label: 'Enviados', value: 'shipped' },
            { label: 'Entregados', value: 'delivered' },
            { label: 'Cancelados', value: 'cancelled' },
          ],
          value: filters.status ?? '',
          onChange: (val) => toggleFilter('status', val || undefined),
        },
        {
          type: 'daterange',
          id: 'period',
          title: 'Período',
          valueFrom: formatDateForInput(filters.dateFrom),
          valueTo: formatDateForInput(filters.dateTo),
          onChangeFrom: (val) => toggleFilter('dateFrom', val ? new Date(val) : undefined),
          onChangeTo: (val) => toggleFilter('dateTo', val ? new Date(val) : undefined),
        },
        {
          type: 'numberrange',
          id: 'amount',
          title: 'Importe',
          valueMin: filters.minAmount?.toString() ?? '',
          valueMax: filters.maxAmount?.toString() ?? '',
          onChangeMin: (val) => toggleFilter('minAmount', val ? Number(val) : undefined),
          onChangeMax: (val) => toggleFilter('maxAmount', val ? Number(val) : undefined),
          prefix: '€',
        },
      ]}
      onClearAll={() => { onClearFilters(); setShowFilterSheet(false); }}
      resultCount={totalOrders}
      resultLabel={totalOrders === 1 ? 'pedido' : 'pedidos'}
    />
    </>
  );
}