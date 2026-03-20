/**
 * @component ReviewFilters
 * @description Filtros de reseñas — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterBottomSheet (pantalla completa)
 * Desktop → barra de búsqueda + chips pill para todos los filtros en línea
 */

'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, CheckCircle, ThumbsUp, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBottomSheet, type FilterSection } from '@/components/shared/mobile/FilterBottomSheet';
import type { ReviewFilters as ReviewFiltersType, ReviewType, ReviewStatus } from '@/types/review';

// ─── Opciones ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Todas',      value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobadas',  value: 'approved' },
  { label: 'Rechazadas', value: 'rejected' },
  { label: 'Reportadas', value: 'flagged' },
];

const TYPE_OPTIONS = [
  { label: 'Todos',       value: '' },
  { label: 'Productos',   value: 'product' },
  { label: 'Productores', value: 'producer' },
];

const RATING_OPTIONS = [
  { label: 'Cualquier valoración', value: '' },
  { label: '★ 5',                  value: '5' },
  { label: '★ 4',                  value: '4' },
  { label: '★ 3',                  value: '3' },
  { label: '★ 2',                  value: '2' },
  { label: '★ 1',                  value: '1' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReviewFiltersProps {
  filters: ReviewFiltersType;
  onFilterChange: (filters: ReviewFiltersType) => void;
  onClearFilters: () => void;
  totalReviews: number;
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReviewFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalReviews,
  className,
}: ReviewFiltersProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const activeCount = [
    filters.status,
    filters.type,
    filters.rating,
    filters.verifiedOnly,
    filters.hasResponse,
    filters.hasImages,
  ].filter(Boolean).length;

  const hasAnyFilter = Boolean(filters.search) || activeCount > 0;

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  const set = (key: keyof ReviewFiltersType, value: any) =>
    onFilterChange({ ...filters, [key]: value || undefined });

  // ── Secciones del bottom sheet ───────────────────────────────────────────────

  const sheetSections: FilterSection[] = [
    {
      type: 'chips',
      id: 'status',
      title: 'Estado',
      options: STATUS_OPTIONS,
      value: filters.status ?? '',
      onChange: (v) => set('status', v as ReviewStatus),
    },
    {
      type: 'chips',
      id: 'type',
      title: 'Tipo de reseña',
      options: TYPE_OPTIONS,
      value: filters.type ?? '',
      onChange: (v) => set('type', v as ReviewType),
    },
    {
      type: 'chips',
      id: 'rating',
      title: 'Valoración',
      options: RATING_OPTIONS,
      value: filters.rating ? String(filters.rating) : '',
      onChange: (v) => onFilterChange({ ...filters, rating: v ? Number(v) as any : undefined }),
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Barra de búsqueda + botón filtros ─────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar reseñas..."
            className="w-full h-10 pl-9 pr-8 text-sm bg-surface-alt border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(''); onFilterChange({ ...filters, search: undefined }); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-origen-bosque transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botón "Filtros" — solo móvil */}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            'lg:hidden relative flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors',
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
      </div>

      {/* ── Filtros desktop: estado + tipo + rating + booleanos ───────── */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 pt-1">
        {/* Estado */}
        {STATUS_OPTIONS.filter(o => o.value).map(opt => (
          <button key={opt.value}
            onClick={() => set('status', filters.status === opt.value ? undefined : opt.value as ReviewStatus)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
              filters.status === opt.value
                ? 'bg-origen-bosque border-origen-bosque text-white'
                : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50',
            )}
          >{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Tipo */}
        {TYPE_OPTIONS.filter(o => o.value).map(opt => (
          <button key={opt.value}
            onClick={() => set('type', filters.type === opt.value ? undefined : opt.value as ReviewType)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
              filters.type === opt.value
                ? 'bg-origen-bosque border-origen-bosque text-white'
                : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50',
            )}
          >{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Rating */}
        {RATING_OPTIONS.filter(o => o.value).map(opt => (
          <button key={opt.value}
            onClick={() => onFilterChange({ ...filters, rating: filters.rating === Number(opt.value) ? undefined : Number(opt.value) as any })}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
              filters.rating === Number(opt.value)
                ? 'bg-origen-bosque border-origen-bosque text-white'
                : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50',
            )}
          >{opt.label}</button>
        ))}

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <button onClick={() => onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
            filters.verifiedOnly ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><CheckCircle className="w-3 h-3" />Verificadas</button>

        <button onClick={() => onFilterChange({ ...filters, hasResponse: !filters.hasResponse })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
            filters.hasResponse ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><ThumbsUp className="w-3 h-3" />Con respuesta</button>

        <button onClick={() => onFilterChange({ ...filters, hasImages: !filters.hasImages })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
            filters.hasImages ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><ImageIcon className="w-3 h-3" />Con imágenes</button>

        {hasAnyFilter && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-text-subtle hover:text-origen-bosque transition-colors"
            ><X className="w-3 h-3" />Limpiar</button>
          </>
        )}
      </div>

      {/* ── FilterBottomSheet (pantalla completa) — solo móvil ────────── */}
      <FilterBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtrar reseñas"
        sections={sheetSections}
        onClearAll={onClearFilters}
        resultCount={totalReviews}
        resultLabel="reseñas"
      />
    </div>
  );
}
