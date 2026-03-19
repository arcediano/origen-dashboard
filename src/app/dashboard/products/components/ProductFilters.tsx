/**
 * @file ProductFilters.tsx
 * @description Barra de filtros para la lista de productos - VERSIÓN RESPONSIVE
 */

'use client';

import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Circle, 
  Package, 
  RefreshCw,
  Grid3x3,
  List,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/atoms/card';

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
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'out_of_stock', label: 'Sin stock' },
  { value: 'draft', label: 'Borradores' },
];

const STOCK_OPTIONS = [
  { value: 'bajo', label: 'Stock bajo' },
  { value: 'agotado', label: 'Agotados' },
  { value: 'disponible', label: 'Con stock' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'price-asc', label: 'Precio (menor a mayor)' },
  { value: 'price-desc', label: 'Precio (mayor a menor)' },
  { value: 'stock-asc', label: 'Stock (menor a mayor)' },
  { value: 'stock-desc', label: 'Stock (mayor a menor)' },
  { value: 'sales-desc', label: 'Más vendidos' },
];

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  placeholder: string;
  fullWidth?: boolean;
}

function Select({ icon, placeholder, className, children, value, fullWidth, ...props }: SelectProps) {
  return (
    <div className={cn('relative', fullWidth ? 'w-full' : 'w-full sm:w-auto')}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
      <select
        value={value || ''}
        className={cn(
          'h-10 sm:h-9 text-sm border border-border bg-surface-alt rounded-md appearance-none cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera',
          icon ? 'pl-9' : 'pl-3',
          'pr-8',
          !value && 'text-text-subtle',
          fullWidth ? 'w-full' : 'w-full sm:w-[160px]',
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
    </div>
  );
}

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
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  
  const hasFilters = Boolean(
    searchQuery ||
      selectedCategory ||
      selectedStatus ||
      selectedStock ||
      sortBy
  );

  return (
    <Card variant="elevated" className={cn('p-3', className)}>
      {/* Primera fila: búsqueda y acciones principales */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Campo de búsqueda - ocupa todo el ancho en móvil */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-7 h-10 sm:h-9 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
            aria-label="Buscar productos"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-muted-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Acciones: botón de filtros móvil y selector de vista */}
        <div className="flex items-center gap-2">
          {/* Botón de filtros para móvil */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={cn(
              'sm:hidden flex items-center justify-center h-10 px-3 border border-border rounded-md bg-surface-alt',
              showMobileFilters ? 'bg-origen-crema text-origen-bosque border-origen-pradera/30' : 'text-muted-foreground'
            )}
            aria-label="Mostrar filtros"
            aria-expanded={showMobileFilters}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span>Filtros</span>
            {hasFilters && (
              <span className="ml-2 w-5 h-5 rounded-full bg-origen-pradera text-white text-xs flex items-center justify-center">
                {[searchQuery, selectedCategory, selectedStatus, selectedStock, sortBy].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Selector de vista */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-surface-alt h-10 sm:h-9">
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 sm:p-1 rounded transition-all',
                viewMode === 'list'
                  ? 'bg-origen-crema text-origen-bosque'
                  : 'text-text-subtle hover:text-origen-bosque hover:bg-surface'
              )}
              title="Vista tabla"
              aria-label="Vista tabla"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 sm:p-1 rounded transition-all',
                viewMode === 'grid'
                  ? 'bg-origen-crema text-origen-bosque'
                  : 'text-text-subtle hover:text-origen-bosque hover:bg-surface'
              )}
              title="Vista cuadrícula"
              aria-label="Vista cuadrícula"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros en línea para desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 mt-3">
        <Select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          icon={<Filter className="w-4 h-4" />}
          placeholder="Categoría"
          aria-label="Filtrar por categoría"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>

        <Select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          icon={<Circle className="w-4 h-4" />}
          placeholder="Estado"
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={selectedStock}
          onChange={(e) => onStockChange(e.target.value)}
          icon={<Package className="w-4 h-4" />}
          placeholder="Stock"
          aria-label="Filtrar por stock"
        >
          {STOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          icon={<RefreshCw className="w-4 h-4" />}
          placeholder="Ordenar por"
          aria-label="Ordenar por"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-origen-pradera hover:text-origen-hoja hover:bg-origen-crema/50 rounded-md transition-colors whitespace-nowrap h-9"
            title="Limpiar filtros"
            aria-label="Limpiar filtros"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Filtros móviles desplegables */}
      {showMobileFilters && (
        <div className="sm:hidden mt-3 space-y-3 pt-3 border-t border-border-subtle">
          <Select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            icon={<Filter className="w-4 h-4" />}
            placeholder="Categoría"
            fullWidth
            aria-label="Filtrar por categoría"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>

          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            icon={<Circle className="w-4 h-4" />}
            placeholder="Estado"
            fullWidth
            aria-label="Filtrar por estado"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={selectedStock}
            onChange={(e) => onStockChange(e.target.value)}
            icon={<Package className="w-4 h-4" />}
            placeholder="Stock"
            fullWidth
            aria-label="Filtrar por stock"
          >
            {STOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            icon={<RefreshCw className="w-4 h-4" />}
            placeholder="Ordenar por"
            fullWidth
            aria-label="Ordenar por"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-origen-pradera hover:text-origen-hoja hover:bg-origen-crema/50 rounded-md transition-colors border border-border"
              aria-label="Limpiar filtros"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar todos los filtros</span>
            </button>
          )}
        </div>
      )}

      {/* Badges de filtros activos */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
          <span className="text-xs font-medium text-muted-foreground">Filtros activos:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-md border border-border text-xs">
              <Search className="w-3 h-3" />
              <span className="max-w-[100px] sm:max-w-[150px] truncate">"{searchQuery}"</span>
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 text-text-subtle hover:text-muted-foreground"
                aria-label="Eliminar filtro de búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-md border border-border text-xs">
              <Filter className="w-3 h-3" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{selectedCategory}</span>
              <button
                onClick={() => onCategoryChange('')}
                className="ml-1 text-text-subtle hover:text-muted-foreground"
                aria-label="Eliminar filtro de categoría"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-md border border-border text-xs">
              <Circle className="w-3 h-3" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate">
                {STATUS_OPTIONS.find((opt) => opt.value === selectedStatus)?.label}
              </span>
              <button
                onClick={() => onStatusChange('')}
                className="ml-1 text-text-subtle hover:text-muted-foreground"
                aria-label="Eliminar filtro de estado"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-md border border-border text-xs">
              <Package className="w-3 h-3" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate">
                {STOCK_OPTIONS.find((opt) => opt.value === selectedStock)?.label}
              </span>
              <button
                onClick={() => onStockChange('')}
                className="ml-1 text-text-subtle hover:text-muted-foreground"
                aria-label="Eliminar filtro de stock"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sortBy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-md border border-border text-xs">
              <RefreshCw className="w-3 h-3" />
              <span className="max-w-[100px] sm:max-w-[150px] truncate">
                {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
              </span>
              <button
                onClick={() => onSortChange('')}
                className="ml-1 text-text-subtle hover:text-muted-foreground"
                aria-label="Eliminar ordenación"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="mt-2 text-xs text-muted-foreground text-right">
        {totalProducts} {totalProducts === 1 ? 'producto encontrado' : 'productos encontrados'}
      </div>
    </Card>
  );
}