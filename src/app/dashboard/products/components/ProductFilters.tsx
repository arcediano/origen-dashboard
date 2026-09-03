/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — patrón "Bosque Comercial" v5.6.
 *
 * Escritorio (≥lg): layout de 2 columnas — `FilterSidebarPanel` (columna
 * lateral fija con draft + "Aplicar filtros") + el contenido principal
 * (`children`, que el consumidor pasa: la cuadrícula/tabla de productos).
 * El toggle de vista grid/lista viaja junto a la búsqueda como `children`
 * del sidebar (no encaja en los 4 tipos de `FilterSection`, igual que el
 * `RatingFilterSection`/`Select searchable` de `FilterSidebar`).
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet) con las mismas secciones que el sidebar.
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 */

'use client';

import React from 'react';
import { Grid3x3, List } from 'lucide-react';
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
  /** Contenido principal (cuadrícula/tabla de productos) — columna derecha del layout de 2 columnas en escritorio. */
  children: React.ReactNode;
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
  children,
}: ProductFiltersProps) {
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(searchQuery ?? '');

  // Debounce para búsqueda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (searchQuery ?? '')) {
        onSearchChange(localSearch || '');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

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
    ...(sortBy ? [{
      id: 'sort',
      label: SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? sortBy,
      onRemove: () => onSortChange(''),
    }] : []),
  ];

  const activeCount = activeChips.length;

  // ── Secciones — compartidas entre el sidebar de escritorio y el bottom sheet móvil ──
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
    <div className={cn('lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start', className)}>

      {/* ── Escritorio (≥lg): sidebar de filtros siempre visible, con draft + Aplicar ── */}
      <FilterSidebarPanel
        className="hidden lg:flex lg:sticky lg:top-24"
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalProducts}
        resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
      >
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Buscar por nombre o SKU..."
          aria-label="Buscar productos"
          size="md"
        />
        {/* Toggle de vista — no es un filtro, pero comparte espacio con la búsqueda por conveniencia (mismo criterio que en la barra móvil, vía FilterToolbar.actions) */}
        {viewModeToggle}
      </FilterSidebarPanel>

      <div className="space-y-2 min-w-0">
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
          resultCount={totalProducts}
          resultLabel={totalProducts === 1 ? 'producto' : 'productos'}
        />
      )}
    </div>
  );
}
