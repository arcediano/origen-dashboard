/**
 * @file ProductFilters.tsx
 * @description Filtros de productos — patrón "Bosque Comercial" v7 (Opción
 * A, decisión del humano en vivo 2026-09-03: "Ordenar" separado de los
 * filtros, ver claude-agile/proyectos/origen-dashboard/tareas-completadas.md).
 *
 * Todos los breakpoints: `FilterToolbar` (búsqueda + botón "Filtros" con
 * badge contador) + botón "Ordenar" propio (su propio bottom sheet, sin
 * relación con el panel de filtros) + panel de filtros propio — bottom sheet
 * en móvil/tablet (<lg), panel deslizante ("drawer") desde el borde derecho
 * en escritorio (≥lg). El toggle de vista grid/lista se oculta en `<lg`: en
 * móvil/tablet el listado siempre usa `ProductMobileList`, así que alternar
 * la vista no cambia nada visible ahí.
 *
 * **Panel de filtros propio, no `FilterPanel` de la librería (petición del
 * humano, 2026-10-08)**: "Pendiente de aprobación" faltaba como estado para
 * filtrar y, además, pidió explícitamente que categoría/estado/stock se
 * controlen con el `Select` de `@arcediano/ux-library` en vez de los chips
 * de `FilterPanel` — "dentro del sidebar [del panel de filtros] mostrar los
 * select, pero no cambiar la forma de mostrar los filtros" (mismo
 * contenedor — bottom sheet/drawer bajo el botón "Filtros" — manteniendo la
 * unificación 2026-09-19 "Bosque Comercial v6", solo cambia el control
 * dentro). `FilterPanel` no admite más secciones que
 * `chips/daterange/numberrange/toggles/text` (sin hueco para contenido
 * propio) y añadir un tipo `select` ahí es un cambio de la librería
 * compartida que requiere publicar una versión nueva con el token del
 * humano (fuera del alcance de esta sesión) — así que este panel se
 * reconstruye aquí con las piezas ya publicadas de la librería
 * (`Sheet`/`SheetContent` para el drawer de escritorio, `FilterBottomSheet`
 * para móvil, igual que ya usa "Ordenar") en vez de `FilterPanel`.
 *
 * Los filtros activos aparecen como chips bajo la barra en todos los
 * breakpoints — el orden ya no es uno de ellos.
 */

'use client';

import React from 'react';
import { Grid3x3, List, ArrowUpDown, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterBottomSheet,
  ActiveFilterChips,
  Sheet,
  SheetContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useIsMobile,
  type ActiveFilterChip,
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

// 5 estados reales del producto (ProductStatus del backend): activo,
// borrador, pendiente de aprobación, sin stock, inactivo.
const STATUS_OPTIONS = [
  { value: 'active',           label: 'Activos' },
  { value: 'draft',            label: 'Borradores' },
  { value: 'pending_approval', label: 'Pendiente aprobación' },
  { value: 'out_of_stock',     label: 'Sin stock' },
  { value: 'inactive',         label: 'Inactivos' },
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

// ─── Panel de filtros propio (ver nota de cabecera) ────────────────────────────

interface FilterDraft {
  category: string;
  status: string;
  stock: string;
}

interface ProductFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ value: string; label: string }>;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedStock: string;
  onStockChange: (value: string) => void;
  totalProducts: number;
  onClearAll: () => void;
}

function ProductFiltersPanel({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedStock,
  onStockChange,
  totalProducts,
  onClearAll,
}: ProductFiltersPanelProps) {
  const isMobile = useIsMobile(1024);
  const [draft, setDraft] = React.useState<FilterDraft>({
    category: selectedCategory,
    status: selectedStatus,
    stock: selectedStock,
  });

  // Draft fresco cada vez que se abre, igual que el panel de filtros compartido.
  React.useEffect(() => {
    if (isOpen) {
      setDraft({ category: selectedCategory, status: selectedStatus, stock: selectedStock });
    }
  }, [isOpen, selectedCategory, selectedStatus, selectedStock]);

  const hasActive = Boolean(draft.category || draft.status || draft.stock);

  const handleApply = () => {
    onCategoryChange(draft.category);
    onStatusChange(draft.status);
    onStockChange(draft.stock);
    onClose();
  };

  const handleClear = () => {
    onClearAll();
    onClose();
  };

  const body = (
    <div className="flex flex-col gap-6">
      <Select
        label="Categoría"
        placeholder="Todas"
        value={draft.category}
        onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
        items={categories}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        label="Estado"
        placeholder="Todos"
        value={draft.status}
        onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
        items={STATUS_OPTIONS}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        label="Stock"
        placeholder="Todo"
        value={draft.stock}
        onValueChange={(v) => setDraft((d) => ({ ...d, stock: v }))}
        items={STOCK_OPTIONS}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todo</SelectItem>
          {STOCK_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handleClear}
        disabled={!hasActive}
        className={cn(
          'flex-1 h-12 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95',
          hasActive
            ? 'border-origen-bosque/40 text-origen-bosque hover:border-origen-bosque/70'
            : 'border-border text-text-subtle opacity-40 cursor-not-allowed',
        )}
      >
        Limpiar filtros
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="flex-2 h-12 rounded-2xl bg-origen-bosque text-white text-sm font-semibold active:scale-95 transition-all hover:bg-origen-pino"
      >
        Ver {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <FilterBottomSheet open={isOpen} onClose={onClose} title="Filtros" footer={footer}>
        {body}
      </FilterBottomSheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-[360px] max-w-[90vw] flex-col overflow-y-auto">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-origen-bosque" />
          <span className="text-sm font-semibold text-origen-bosque">Filtros</span>
        </div>
        <div className="flex-1">{body}</div>
        <div className="mt-6 border-t border-border-subtle pt-4">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────────

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

  // ── Botón "Ordenar" — separado de "Filtros", su propio bottom sheet ─────────
  const sortButton = (
    <div className="relative shrink-0">
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
    <div className="hidden lg:flex items-center gap-0.5 border border-border rounded-xl p-0.5 bg-surface-alt h-9 shrink-0">
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
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Panel de filtros: bottom sheet (<lg) / drawer deslizante (≥lg) ────── */}
      <ProductFiltersPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        selectedStock={selectedStock}
        onStockChange={onStockChange}
        totalProducts={totalProducts}
        onClearAll={onClearFilters}
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
                {active && <Check className="w-4 h-4 text-origen-bosque shrink-0" />}
              </button>
            );
          })}
        </div>
      </FilterBottomSheet>
    </div>
  );
}
