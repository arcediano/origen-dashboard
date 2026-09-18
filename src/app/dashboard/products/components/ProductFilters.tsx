/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — patrón "Bosque Comercial" v7 (Opción
 * A, decisión del humano en vivo 2026-09-03: "Ordenar" separado de los
 * filtros, ver claude-agile/proyectos/origen-dashboard/tareas-completadas.md).
 *
 * Todos los breakpoints: `FilterToolbar` (búsqueda + botón "Filtros" con
 * badge contador) + botón "Ordenar" propio (su propio bottom sheet, sin
 * relación con `FilterPanel`) + `FilterPanel` — bottom sheet en móvil/tablet
 * (<lg), panel deslizante ("drawer") desde el borde derecho en escritorio
 * (≥lg). El toggle de vista grid/lista se oculta en `<lg`: en móvil/tablet
 * el listado siempre usa `ProductMobileList`, así que alternar la vista no
 * cambia nada visible ahí.
 *
 * `compact` en `FilterToolbar`: con dos botones junto a la búsqueda
 * ("Filtros" + "Ordenar"), la búsqueda no baja a su propia fila y ambos
 * botones se muestran solo con icono en `<sm` — así la barra cabe en una
 * sola línea también en el móvil más estrecho.
 *
 * Los filtros activos aparecen como chips bajo la barra en todos los
 * breakpoints — el orden ya no es uno de ellos.
 */

'use client';

import React from 'react';
import { Grid3x3, List, ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  FilterBottomSheet,
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
  const [sortOpen, setSortOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(searchQuery ?? '');

  // Sincronizar cuando se limpian filtros externamente
  React.useEffect(() => {
    setLocalSearch(searchQuery ?? '');
  }, [searchQuery]);

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
  ];

  const activeCount = activeChips.length;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

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
  ];

  // ── Botón "Ordenar" — separado de "Filtros", su propio bottom sheet ─────────
  const sortButton = (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setSortOpen(true)}
        aria-haspopup="dialog"
        aria-label={sortLabel ? `Ordenar (${sortLabel})` : 'Ordenar'}
        className={cn(
          'relative flex items-center gap-1.5 h-10 w-10 justify-center px-0 sm:w-auto sm:justify-start sm:px-3.5 rounded-xl border text-sm font-medium transition-colors',
          sortBy
            ? 'bg-origen-bosque border-origen-bosque text-white'
            : 'bg-surface-alt border-border text-origen-bosque',
        )}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="hidden sm:inline">Ordenar</span>
      </button>
    </div>
  );

  // ── Toggle de vista — solo tiene efecto en escritorio (≥lg); en móvil/
  // tablet el listado siempre usa ProductMobileList sin importar viewMode ──
  const viewModeToggle = (
    <div className="hidden lg:flex items-center gap-0.5 border border-border rounded-xl p-0.5 bg-surface-alt h-9 flex-shrink-0">
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

      {/* ── Búsqueda + "Filtros" + "Ordenar" — mismo componente en todos los breakpoints ── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={onSearchChange}
        searchDebounceMs={300}
        searchPlaceholder="Buscar por nombre o SKU..."
        searchAriaLabel="Buscar productos"
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
        compact
        actions={(
          <>
            {sortButton}
            {viewModeToggle}
          </>
        )}
      />

      {/* ── Chips de filtros activos — solo cuando hay filtros activos ───────── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Panel de filtros: bottom sheet (<lg) / drawer deslizante (≥lg) ────── */}
      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        triggerRef={filtersButtonRef}
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalProducts}
        resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
        variant="drawer"
      />

      {/* ── "Ordenar" — hoja propia, independiente de "Filtros"; selección
             inmediata (sin borrador/Aplicar, es un único valor) ────────────── */}
      <FilterBottomSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Ordenar por"
      >
        <div className="flex flex-col gap-1">
          {[{ value: '', label: 'Por defecto' }, ...SORT_OPTIONS].map((opt) => {
            const active = sortBy === opt.value;
            return (
              <button
                key={opt.value || 'default'}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  setSortOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                  active ? 'bg-origen-nube text-origen-bosque' : 'text-origen-oscuro hover:bg-surface',
                )}
              >
                <span>{opt.label}</span>
                {active && <Check className="w-4 h-4 text-origen-bosque flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </FilterBottomSheet>
    </div>
  );
}
