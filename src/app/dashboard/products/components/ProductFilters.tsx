/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — patrón "Bosque Comercial" v5.5.
 *
 * Desktop (≥lg): controles de filtro siempre visibles en línea —
 * búsqueda + Selects (categoría, estado, stock, ordenar) + toggle vista.
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet).
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 */

'use client';

import React from 'react';
import { Grid3x3, List } from 'lucide-react';
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
  useIsMobile,
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
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);

  // ── Chips de filtros activos ─────────────────────────────────────────────────
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

  // ── Secciones del panel móvil ────────────────────────────────────────────────
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
        ...SORT_OPTIONS,
      ],
      value: sortBy,
      onChange: onSortChange,
    },
  ];

  // ── Toggle de vista (desktop y móvil, siempre a la derecha) ─────────────────
  const viewModeToggle = (
    <div className="flex items-center gap-0.5 border border-border rounded-xl p-0.5 bg-surface-alt h-10 flex-shrink-0">
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          viewMode === 'list'
            ? 'bg-surface shadow-sm text-origen-bosque'
            : 'text-text-subtle hover:text-origen-bosque',
        )}
        aria-label="Vista tabla"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          viewMode === 'grid'
            ? 'bg-surface shadow-sm text-origen-bosque'
            : 'text-text-subtle hover:text-origen-bosque',
        )}
        aria-label="Vista cuadrícula"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      {/*
        Contenedor agrupador: bg-surface-alt (blanco) sobre el fondo crema
        de la página garantiza contraste visual. No se usa Card porque añade
        demasiado peso visual compitiendo con la tabla; este div actúa como
        "barra de filtros" sin jerarquía de sección.
        No se usa flex-wrap: todos los controles deben caber en una sola línea.
        Los Select reciben className="w-auto" para anular el w-full del wrapper.
      */}
      <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border-subtle rounded-xl px-3 py-2 shadow-sm">
        {/* Búsqueda */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por nombre o SKU..."
          aria-label="Buscar productos"
          className="min-w-[200px] flex-1"
          size="md"
        />

        {/* Categoría — min-w calibrado al texto más largo ("Embutidos") */}
        <Select value={selectedCategory} onValueChange={onCategoryChange} className="w-auto">
          <SelectTrigger className="min-w-[140px] max-w-[160px] h-10" tone="subtle">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado — min-w calibrado a "Borradores" */}
        <Select value={selectedStatus} onValueChange={onStatusChange} className="w-auto">
          <SelectTrigger className="min-w-[130px] max-w-[150px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stock — min-w calibrado a "Stock bajo" */}
        <Select value={selectedStock} onValueChange={onStockChange} className="w-auto">
          <SelectTrigger className="min-w-[120px] max-w-[140px] h-10" tone="subtle">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todo</SelectItem>
            {STOCK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ordenar — min-w calibrado a "Más vendidos" */}
        <Select value={sortBy} onValueChange={onSortChange} className="w-auto">
          <SelectTrigger className="min-w-[150px] max-w-[170px] h-10" tone="subtle">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Por defecto</SelectItem>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle grid/lista */}
        {viewModeToggle}
      </div>

      {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
      <div className="lg:hidden">
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
          resultCount={totalProducts}
          resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
        />
      )}
    </div>
  );
}
