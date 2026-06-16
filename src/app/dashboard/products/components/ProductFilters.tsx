/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterSheet (pantalla completa)
 * Desktop → barra de búsqueda + Select por grupo + toggle de vista
 */

'use client';

import React from 'react';
import { Grid3x3, List, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterSheet,
  ActiveFilterChips,
  type ActiveFilterChip,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ToggleGroup, ToggleGroupItem,
} from '@arcediano/ux-library';
import { Button } from '@arcediano/ux-library';

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
  { value: 'quesos', label: 'Quesos' },
  { value: 'aceites', label: 'Aceites' },
  { value: 'mieles', label: 'Mieles' },
  { value: 'embutidos', label: 'Embutidos' },
  { value: 'vinos', label: 'Vinos' },
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

// Clases del trigger de Select adaptadas al filtro
const triggerCls = 'h-9 py-0 sm:py-0 px-3 sm:px-3 text-sm bg-surface-alt border-border w-auto';

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

  const activeCount = [selectedCategory, selectedStatus, selectedStock, sortBy].filter(Boolean).length;
  const hasAnyFilter = Boolean(searchQuery) || activeCount > 0;

  // Chips de filtros activos: visibles en móvil (fuera del sheet) y en desktop
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

  // Toggle de vista grid/lista como actions de FilterToolbar
  const viewModeToggle = (
    <div className="hidden lg:flex items-center gap-0.5 border border-border rounded-xl p-0.5 bg-surface-alt h-10">
      <button
        onClick={() => onViewModeChange('list')}
        className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-surface shadow-sm text-origen-bosque' : 'text-text-subtle hover:text-origen-bosque')}
        aria-label="Vista tabla" aria-pressed={viewMode === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-surface shadow-sm text-origen-bosque' : 'text-text-subtle hover:text-origen-bosque')}
        aria-label="Vista cuadrícula" aria-pressed={viewMode === 'grid'}
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── FilterToolbar: búsqueda + botón filtros (móvil) + toggle vista (desktop) ──── */}
      <FilterToolbar
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por nombre o SKU..."
        searchAriaLabel="Buscar productos"
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        actions={viewModeToggle}
      />
      {/* ── Chips de filtros activos — móvil y desktop ────────────────────────────────── */}
      <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />

      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterSheet
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        sections={[
          {
            type: 'chips', id: 'category', title: 'Categoría',
            options: [{ label: 'Todas', value: '' }, ...categories.map((category) => ({ label: category.label, value: category.value }))],
            value: selectedCategory, onChange: onCategoryChange,
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
            value: selectedStatus, onChange: onStatusChange,
          },
          {
            type: 'chips', id: 'stock', title: 'Stock',
            options: [
              { label: 'Todo', value: '' },
              { label: 'Con stock', value: 'disponible' },
              { label: 'Stock bajo', value: 'bajo' },
              { label: 'Agotados', value: 'agotado' },
            ],
            value: selectedStock, onChange: onStockChange,
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
            value: sortBy, onChange: onSortChange,
          },
        ]}
        onClearAll={onClearFilters}
        resultCount={totalProducts}
        resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
      />

      {/* ── Filtros desktop: Select por grupo ─────────────────────────── */}
      <div className="hidden lg:flex items-center gap-2 pt-1 flex-wrap">

        {/* Categoría */}
        <Select value={selectedCategory} onValueChange={onCategoryChange} className="w-auto">
          <SelectTrigger className={cn(triggerCls, 'min-w-[160px]')}>
            <SelectValue className="text-sm">
              {selectedCategory || <span className="text-text-disabled">Todas las categorías</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado */}
        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={selectedStatus}
          onValueChange={(v) => onStatusChange(typeof v === 'string' ? v : '')}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="" aria-label="Todos los estados">Todos</ToggleGroupItem>
          <ToggleGroupItem value="active" aria-label="Activos">Activos</ToggleGroupItem>
          <ToggleGroupItem value="draft" aria-label="Borradores">Borradores</ToggleGroupItem>
          <ToggleGroupItem value="out_of_stock" aria-label="Sin stock">Sin stock</ToggleGroupItem>
          <ToggleGroupItem value="inactive" aria-label="Inactivos">Inactivos</ToggleGroupItem>
        </ToggleGroup>

        {/* Stock */}
        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={selectedStock}
          onValueChange={(v) => onStockChange(typeof v === 'string' ? v : '')}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="" aria-label="Todo el stock">Todo</ToggleGroupItem>
          <ToggleGroupItem value="disponible" aria-label="Con stock">Con stock</ToggleGroupItem>
          <ToggleGroupItem value="bajo" aria-label="Stock bajo">Stock bajo</ToggleGroupItem>
          <ToggleGroupItem value="agotado" aria-label="Agotados">Agotados</ToggleGroupItem>
        </ToggleGroup>

        {/* Ordenar */}
        <Select value={sortBy} onValueChange={onSortChange} className="w-auto">
          <SelectTrigger className={cn(triggerCls, 'min-w-[148px]')}>
            <SelectValue className="text-sm">
              {sortBy
                ? SORT_OPTIONS.find(o => o.value === sortBy)?.label
                : <span className="text-text-disabled">Ordenar por</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Ordenar por</SelectItem>
            {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} leftIcon={<X className="w-3 h-3" />}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

