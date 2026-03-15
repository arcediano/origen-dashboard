/**
 * @component ReviewFilters
 * @description Filtros para la lista de reseñas
 */

'use client';

import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import type { ReviewFilters as ReviewFiltersType, ReviewType, ReviewStatus } from '@/types/review';

export interface ReviewFiltersProps {
  filters: ReviewFiltersType;
  onFilterChange: (filters: ReviewFiltersType) => void;
  onClearFilters: () => void;
  totalReviews: number;
  className?: string;
}

const TYPE_OPTIONS: { value: ReviewType | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'product', label: 'Productos' },
  { value: 'producer', label: 'Productores' }
];

const STATUS_OPTIONS: { value: ReviewStatus | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '', label: 'Todos los estados', icon: Filter, color: 'gray' },
  { value: 'pending', label: 'Pendientes', icon: Clock, color: 'amber' },
  { value: 'approved', label: 'Aprobadas', icon: CheckCircle, color: 'green' },
  { value: 'rejected', label: 'Rechazadas', icon: XCircle, color: 'red' },
  { value: 'flagged', label: 'Reportadas', icon: AlertCircle, color: 'red' }
];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export function ReviewFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalReviews,
  className
}: ReviewFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(filters.search || '');

  const hasFilters = Boolean(
    filters.type ||
    filters.status ||
    filters.rating ||
    filters.search ||
    filters.verifiedOnly ||
    filters.hasResponse ||
    filters.hasImages
  );

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  const toggleFilter = (key: keyof ReviewFiltersType, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card variant="elevated" className={cn('p-3', className)}>
      {/* Primera fila: búsqueda y acciones principales */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Campo de búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por contenido, autor, producto..."
            className="w-full pl-9 pr-7 h-10 sm:h-9 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ ...filters, search: undefined });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón de filtros móvil */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={cn(
              'sm:hidden flex items-center justify-center h-10 px-3 border border-gray-200 rounded-md bg-white',
              showMobileFilters ? 'bg-origen-crema text-origen-bosque border-origen-pradera/30' : 'text-gray-600'
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span>Filtros</span>
            {hasFilters && (
              <span className="ml-2 w-5 h-5 rounded-full bg-origen-pradera text-white text-xs flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 mt-3">
        {/* Tipo */}
        <select
          value={filters.type || ''}
          onChange={(e) => toggleFilter('type', e.target.value || undefined)}
          className="h-9 px-3 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
        >
          {TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={filters.status || ''}
          onChange={(e) => toggleFilter('status', e.target.value || undefined)}
          className="h-9 px-3 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Rating */}
        <select
          value={filters.rating || ''}
          onChange={(e) => toggleFilter('rating', e.target.value ? Number(e.target.value) : undefined)}
          className="h-9 px-3 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-origen-menta/20 focus:border-origen-pradera"
        >
          <option value="">Cualquier rating</option>
          {RATING_OPTIONS.map(rating => (
            <option key={rating} value={rating}>
              {rating} estrellas
            </option>
          ))}
        </select>

        {/* Filtros booleanos */}
        <button
          onClick={() => toggleFilter('verifiedOnly', !filters.verifiedOnly)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all whitespace-nowrap',
            filters.verifiedOnly
              ? 'bg-origen-pradera/10 text-origen-pradera border-origen-pradera/30'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Solo compras verificadas</span>
        </button>

        <button
          onClick={() => toggleFilter('hasResponse', !filters.hasResponse)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all whitespace-nowrap',
            filters.hasResponse
              ? 'bg-origen-pradera/10 text-origen-pradera border-origen-pradera/30'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          )}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Con respuesta</span>
        </button>

        <button
          onClick={() => toggleFilter('hasImages', !filters.hasImages)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all whitespace-nowrap',
            filters.hasImages
              ? 'bg-origen-pradera/10 text-origen-pradera border-origen-pradera/30'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          )}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Con imágenes</span>
        </button>

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

      {/* Filtros móviles */}
      {showMobileFilters && (
        <div className="sm:hidden mt-3 space-y-3 pt-3 border-t border-gray-100">
          {/* ... versión móvil de los filtros ... */}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {totalReviews} {totalReviews === 1 ? 'reseña encontrada' : 'reseñas encontradas'}
      </div>
    </Card>
  );
}