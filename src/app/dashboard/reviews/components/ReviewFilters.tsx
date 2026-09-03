/**
 * @component ReviewFilters
 * @description Filtros de reseñas — patrón "Bosque Comercial" v5.6.
 *
 * Escritorio (≥lg): layout de 2 columnas — `FilterSidebarPanel` (columna
 * lateral fija con draft + "Aplicar filtros") + el contenido principal
 * (`children`, que el consumidor pasa: la lista/tabla de reseñas).
 *
 * Móvil/tablet (<lg): `FilterToolbar` con botón "Filtros" (badge contador)
 * + `FilterPanel` (bottom sheet) con las mismas secciones que el sidebar.
 *
 * Los filtros activos aparecen como chips bajo la barra en ambos breakpoints.
 *
 * Nota: la valoración se filtra como sección `chips` (★5..★1) tanto en el
 * sidebar de escritorio como en el bottom sheet — sustituye al `StarRating`
 * interactivo que tenía la barra ad-hoc anterior solo en escritorio, para
 * que ambos breakpoints compartan exactamente el mismo motor de filtros.
 */

'use client';

import React from 'react';
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
import type { ReviewFilters as ReviewFiltersType, ReviewStatus } from '@/types/review';

// ─── Opciones ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Todas',      value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobadas',  value: 'approved' },
  { label: 'Rechazadas', value: 'rejected' },
  { label: 'Reportadas', value: 'flagged' },
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
  /** Contenido principal (lista/tabla de reseñas) — columna derecha del layout de 2 columnas en escritorio. */
  children: React.ReactNode;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReviewFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalReviews,
  className,
  children,
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
    filters.rating,
    filters.verifiedOnly,
    filters.hasResponse,
    filters.hasImages,
  ].filter(Boolean).length;

  // ── Secciones — compartidas entre el sidebar de escritorio y el bottom sheet móvil ──

  const sections: FilterSection[] = [
    {
      type: 'chips', id: 'status', title: 'Estado',
      options: STATUS_OPTIONS,
      value: filters.status ?? '',
      onChange: (v) => set('status', v as ReviewStatus),
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
    <div className={cn('lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start', className)}>

      {/* ── Escritorio (≥lg): sidebar de filtros siempre visible, con draft + Aplicar ── */}
      <FilterSidebarPanel
        className="hidden lg:flex lg:sticky lg:top-24"
        sections={sections}
        onClearAll={onClearFilters}
        resultCount={totalReviews}
        resultLabel="reseñas"
      >
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          onDebouncedChange={(v) => onFilterChange({ search: v || undefined } as ReviewFiltersType)}
          debounceMs={300}
          placeholder="Buscar reseñas..."
          aria-label="Buscar reseñas"
          size="md"
        />
      </FilterSidebarPanel>

      <div className="space-y-2 min-w-0">
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
          resultCount={totalReviews}
          resultLabel="reseñas"
        />
      )}
    </div>
  );
}
