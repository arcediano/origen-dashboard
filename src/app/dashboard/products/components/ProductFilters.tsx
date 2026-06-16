/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — patrón canónico "Bosque Comercial" v5.4.
 *
 * Barra de una sola línea: búsqueda + botón "Filtros" (con badge de filtros
 * activos). Al pulsar "Filtros" se abre `FilterPanel`:
 * - Móvil/tablet (<lg): bottom sheet a pantalla completa.
 * - Escritorio (≥lg): popover anclado al botón "Filtros".
 *
 * Los filtros activos aparecen como chips en una zona visualmente diferenciada
 * debajo de la barra — nunca como controles inline en la barra.
 *
 * No hay bloque `hidden lg:flex` de controles inline — todos los filtros van
 * dentro del panel, resolviendo los problemas históricos de overflow y
 * cardinalidad.
 */

'use client';

import React from 'react';
import { Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';

export interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedStock: string;
  onStockChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalProducts: number;
  onClearFilters: () => void;
  categories?: Array<{ value: string; label: string }>;
  className?: string;
}

const DEFAULT_CATEGORIES = [
  { value: 'quesos',    label: 'Quesos' },
  { value: 'aceites',   label: 'Aceites' },
  { value: 'mieles',    label: 'Mieles' },
  { value: 'embutidos', label: 'Embutidos' },
  { value: 'vinos',     label: 'Vinos' },
  { value: 'panaderia', label: 'Panadería' },
];

const STATUS_OPTIONS = [
  { value: 'active',       label: 'Activos' },
  { value: 'draft',        label: 'Borradores' },
  { value: 'out_of_stock', label: 'Sin stock' },
  { value: 'inactive',     label: 'Inactivos' },
];

const STOCK_OPTIONS = [
  { value: 'disponible', label: 'Con stock' },
  { value: 'bajo',       label: 'Stock bajo' },
  { value: 'agotado',    label: 'Agotados' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Más recientes' },
  { value: 'oldest',     label: 'Más antiguos' },
  { value: 'name-asc',   label: 'Nombre A-Z' },
  { value: 'name-desc',  label: 'Nombre Z-A' },
  { value: 'price-asc',  label: 'Precio ↑' },
  { value: 'price-desc', label: 'Precio ↓' },
  { value: 'stock-asc',  label: 'Stock ↑' },
  { value: 'stock-desc', label: 'Stock ↓' },
  { value: 'sales-desc', label: 'Más vendidos' },
];

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedStock,
  onStockChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalProducts,
  onClearFilters,
  categories = DEFAULT_CATEGORIES,
  className,
}: ProductFiltersProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);

  const activeChips: ActiveFilterChip[] = [
    ...(selectedCategory ? [{
      id: 'category',
      label: categories.find(c => c.value === selectedCategory)?.label ?? selectedCategory,
      onRemove: () => onCategoryChange(''),
    }] : []),
    ...(selectedStatus ? [{
      id: 'status',
      label: STATUS_OPTIONS.find(o => o.value === selectedStatus)?.label ?? selectedStatus,
      onRemove: () => onStatusChange(''),
    }] : []),
    ...(selectedStock ? [{
      id: 'stock',
      label: STOCK_OPTIONS.find(o => o.value === selectedStock)?.label ?? selectedStock,
      onRemove: () => onStockChange(''),
    }] : []),
    ...(sortBy ? [{
      id: 'sort',
      label: SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? sortBy,
      onRemove: () => onSortChange(''),
    }] : []),
  ];

  const activeCount = activeChips.length;

  const sections: FilterSection[] = [
    {
      type: 'chips', id: 'category', title: 'Categoría',
      options: [{ label: 'Todas', value: '' }, ...categories.map((c) => ({ label: c.label, value: c.value }))],
      value: selectedCategory,
      onChange: onCategoryChange,
    },
    {
      type: 'chips', id: 'status', title: 'Estado',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Activos', value: 'active' },
        { label: 'Borradores', value: 'draft' },
        { label: 'Sin stock', value: 'out_of_stock' },
        { label: 'Inactivos', value: 'inactive' },
      ],
      value: selectedStatus,
      onChange: onStatusChange,
    },
    {
      type: 'chips', id: 'stock', title: 'Stock',
      options: [
        { label: 'Todo', value: '' },
        { label: 'Con stock', value: 'disponible' },
        { label: 'Stock bajo', value: 'bajo' },
        { label: 'Agotados', value: 'agotado' },
      ],
      value: selectedStock,
      onChange: onStockChange,
    },
    {
      type: 'chips', id: 'sort', title: 'Ordenar por',
      options: [
        { label: 'Por defecto', value: '' },
        { label: 'Más recientes', value: 'newest' },
        { label: 'Más antiguos', value: 'oldest' },
        { label: 'Nombre A-Z', value: 'name-asc' },
        { label: 'Nombre Z-A', value: 'name-desc' },
        { label: 'Precio ↑', value: 'price-asc' },
        { label: 'Precio ↓', value: 'price-desc' },
        { label: 'Stock ↑', value: 'stock-asc' },
        { label: 'Stock ↓', value: 'stock-desc' },
        { label: 'Más vendidos', value: 'sales-desc' },
      ],
      value: sortBy,
      onChange: onSortChange,
    },
  ];

  // Toggle de vista grid/lista — control de visualización, no de filtrado.
  // Va en el slot actions de FilterToolbar, no en el panel.
  const viewModeToggle = (
    <div className="hidden lg:flex items-center gap-0.5 border border-border rounded-xl p-0.5 bg-surface-alt h-10">
      <button
        onClick={() => onViewModeChange('list')}
        className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-surface shadow-sm text-origen-bosque' : 'text-text-subtle hover:text-origen-bosque')}
        aria-label="Vista tabla"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-surface shadow-sm text-origen-bosque' : 'text-text-subtle hover:text-origen-bosque')}
        aria-label="Vista cuadrícula"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Barra de una sola línea: búsqueda + botón Filtros + toggle vista ──────── */}
      <FilterToolbar
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por nombre o SKU..."
        searchAriaLabel="Buscar productos"
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
        actions={viewModeToggle}
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
        resultCount={totalProducts}
        resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
      />
    </div>
  );
}
