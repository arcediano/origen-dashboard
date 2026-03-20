/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterBottomSheet (pantalla completa)
 * Desktop → barra de búsqueda + chips pill para todos los filtros en línea
 */

'use client';

import React from 'react';
import {
  Search, X, SlidersHorizontal,
  Grid3x3, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBottomSheet } from '@/components/shared/mobile';

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
  categories?: string[];
  className?: string;
}

const DEFAULT_CATEGORIES = ['Quesos', 'Aceites', 'Mieles', 'Embutidos', 'Vinos', 'Panadería'];

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

// Clase reutilizable para pills en desktop
const pillCls = (active: boolean) => cn(
  'inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
  active
    ? 'bg-origen-bosque border-origen-bosque text-white'
    : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50',
);

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
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const activeCount = [selectedCategory, selectedStatus, selectedStock, sortBy].filter(Boolean).length;
  const hasAnyFilter = Boolean(searchQuery) || activeCount > 0;

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Barra de búsqueda + botón filtros + toggle vista ──────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full h-10 pl-9 pr-8 text-sm bg-surface-alt border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-colors"
            aria-label="Buscar productos"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
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

        {/* Toggle vista — desktop */}
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
      </div>

      {/* ── Filtros desktop: pills en línea ───────────────────────────── */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 pt-1">
        {/* Categoría */}
        {categories.map(cat => (
          <button key={cat} onClick={() => onCategoryChange(selectedCategory === cat ? '' : cat)}
            className={pillCls(selectedCategory === cat)}>{cat}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Estado */}
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => onStatusChange(selectedStatus === opt.value ? '' : opt.value)}
            className={pillCls(selectedStatus === opt.value)}>{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Stock */}
        {STOCK_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => onStockChange(selectedStock === opt.value ? '' : opt.value)}
            className={pillCls(selectedStock === opt.value)}>{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Ordenar */}
        {SORT_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => onSortChange(sortBy === opt.value ? '' : opt.value)}
            className={pillCls(sortBy === opt.value)}>{opt.label}</button>
        ))}

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
        title="Filtrar productos"
        sections={[
          {
            type: 'chips', id: 'category', title: 'Categoría',
            options: [{ label: 'Todas', value: '' }, ...categories.map(c => ({ label: c, value: c }))],
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
    </div>
  );
}
