/**
 * @component ReviewFilters
 * @description Filtros de reseñas — patrón "Bosque Comercial" v5.5.
 *
 * Desktop (≥lg): controles siempre visibles en línea — búsqueda (debounce
 * 300ms) + Select de estado + Select de tipo + StarRating interactivo para
 * valoración + Checkbox con label para los tres booleanos.
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet) con las mismas secciones.
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 */

'use client';

import React from 'react';
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
  StarRating,
  Checkbox,
  useIsMobile,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';
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
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);
  const [localSearch, setLocalSearch] = React.useState(filters.search ?? '');

  const set = (key: keyof ReviewFiltersType, value: unknown) =>
    onFilterChange({ [key]: value || undefined } as ReviewFiltersType);

  // ── Chips de filtros activos ──────────────────────────────────────────────

  const activeChips: ActiveFilterChip[] = [
    ...(filters.status ? [{
      id: 'status',
      label: STATUS_OPTIONS.find(o => o.value === filters.status)?.label ?? filters.status,
      onRemove: () => set('status', ''),
    }] : []),
    ...(filters.type ? [{
      id: 'type',
      label: TYPE_OPTIONS.find(o => o.value === filters.type)?.label ?? filters.type,
      onRemove: () => set('type', ''),
    }] : []),
    ...(filters.rating ? [{
      id: 'rating',
      label: `★ ${filters.rating}`,
      onRemove: () => onFilterChange({ ...filters, rating: undefined }),
    }] : []),
    ...(filters.verifiedOnly ? [{
      id: 'verifiedOnly',
      label: 'Verificadas',
      onRemove: () => onFilterChange({ ...filters, verifiedOnly: undefined }),
    }] : []),
    ...(filters.hasResponse ? [{
      id: 'hasResponse',
      label: 'Con respuesta',
      onRemove: () => onFilterChange({ ...filters, hasResponse: undefined }),
    }] : []),
    ...(filters.hasImages ? [{
      id: 'hasImages',
      label: 'Con imágenes',
      onRemove: () => onFilterChange({ ...filters, hasImages: undefined }),
    }] : []),
  ];

  const activeCount = [
    filters.status,
    filters.type,
    filters.rating,
    filters.verifiedOnly,
    filters.hasResponse,
    filters.hasImages,
  ].filter(Boolean).length;

  // ── Secciones del panel móvil ─────────────────────────────────────────────

  const sections: FilterSection[] = [
    {
      type: 'chips', id: 'status', title: 'Estado',
      options: STATUS_OPTIONS,
      value: filters.status ?? '',
      onChange: (v) => set('status', v as ReviewStatus),
    },
    {
      type: 'chips', id: 'type', title: 'Tipo de reseña',
      options: TYPE_OPTIONS,
      value: filters.type ?? '',
      onChange: (v) => set('type', v as ReviewType),
    },
    {
      type: 'chips', id: 'rating', title: 'Valoración',
      options: RATING_OPTIONS,
      value: filters.rating ? String(filters.rating) : '',
      onChange: (v) => onFilterChange({ rating: v ? Number(v) as ReviewFiltersType['rating'] : undefined } as ReviewFiltersType),
    },
    {
      type: 'toggles', id: 'booleans', title: 'Opciones',
      options: [
        {
          id: 'verifiedOnly',
          label: 'Verificadas',
          value: filters.verifiedOnly ?? false,
          onChange: (v) => onFilterChange({ verifiedOnly: v || undefined } as ReviewFiltersType),
        },
        {
          id: 'hasResponse',
          label: 'Con respuesta',
          value: filters.hasResponse ?? false,
          onChange: (v) => onFilterChange({ hasResponse: v || undefined } as ReviewFiltersType),
        },
        {
          id: 'hasImages',
          label: 'Con imágenes',
          value: filters.hasImages ?? false,
          onChange: (v) => onFilterChange({ hasImages: v || undefined } as ReviewFiltersType),
        },
      ],
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        {/* Búsqueda con debounce */}
        <SearchInput
          value={localSearch}
          onChange={(v) => {
            setLocalSearch(v);
          }}
          onDebouncedChange={(v) => onFilterChange({ search: v || undefined } as ReviewFiltersType)}
          debounceMs={300}
          placeholder="Buscar reseñas..."
          aria-label="Buscar reseñas"
          className="min-w-[200px] flex-1"
          size="md"
        />

        {/* Estado — min-w calibrado a "Rechazadas" */}
        <Select value={filters.status ?? ''} onValueChange={(v) => set('status', v as ReviewStatus)}>
          <SelectTrigger className="min-w-[130px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo — min-w calibrado a "Productores" */}
        <Select value={filters.type ?? ''} onValueChange={(v) => set('type', v as ReviewType)}>
          <SelectTrigger className="min-w-[130px] h-10" tone="subtle">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Valoración: StarRating interactivo con reset al pulsar la misma estrella */}
        <div
          className="flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/50 border border-transparent hover:bg-muted/70 transition-colors"
          role="group"
          aria-label="Filtrar por valoración"
        >
          <span className="text-xs text-text-subtle whitespace-nowrap flex-shrink-0">Valoración:</span>
          <StarRating
            value={filters.rating ?? 0}
            onChange={(v) => {
              // Pulsar la misma estrella activa limpia el filtro
              if (v === filters.rating) {
                onFilterChange({ ...filters, rating: undefined });
              } else {
                onFilterChange({ ...filters, rating: v as ReviewFiltersType['rating'] });
              }
            }}
            size="sm"
            label="Valoración mínima"
          />
          {filters.rating ? (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, rating: undefined })}
              className="text-[10px] text-text-subtle hover:text-origen-bosque transition-colors underline underline-offset-2 whitespace-nowrap"
              aria-label="Quitar filtro de valoración"
            >
              Quitar
            </button>
          ) : null}
        </div>

        {/* Booleanos: checkboxes inline compactos */}
        <div className="flex items-center gap-3 h-10 px-3 rounded-xl bg-muted/50 border border-transparent">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              size="sm"
              variant="forest"
              checked={filters.verifiedOnly ?? false}
              onCheckedChange={(v) => onFilterChange({ ...filters, verifiedOnly: v === true ? true : undefined })}
            />
            <span className="text-xs text-origen-bosque whitespace-nowrap">Verificadas</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              size="sm"
              variant="forest"
              checked={filters.hasResponse ?? false}
              onCheckedChange={(v) => onFilterChange({ ...filters, hasResponse: v === true ? true : undefined })}
            />
            <span className="text-xs text-origen-bosque whitespace-nowrap">Con respuesta</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              size="sm"
              variant="forest"
              checked={filters.hasImages ?? false}
              onCheckedChange={(v) => onFilterChange({ ...filters, hasImages: v === true ? true : undefined })}
            />
            <span className="text-xs text-origen-bosque whitespace-nowrap">Con imágenes</span>
          </label>
        </div>
      </div>

      {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
      <div className="lg:hidden">
        <FilterToolbar
          searchValue={localSearch}
          onSearchChange={setLocalSearch}
          onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as ReviewFiltersType)}
          searchDebounceMs={300}
          searchPlaceholder="Buscar reseñas..."
          activeFilterCount={activeCount}
          onOpenFilters={() => setPanelOpen(true)}
          filtersButtonRef={filtersButtonRef}
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
          resultCount={totalReviews}
          resultLabel="reseñas"
        />
      )}
    </div>
  );
}
