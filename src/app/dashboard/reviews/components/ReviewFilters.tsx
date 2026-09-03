/**
 * @component ReviewFilters
 * @description Filtros de reseñas — patrón "Bosque Comercial" v6 (Opción B,
 * decisión del humano en vivo 2026-09-03: panel bajo demanda también en
 * escritorio, ver claude-agile/proyectos/origen-dashboard/tareas-completadas.md).
 *
 * Todos los breakpoints: `FilterToolbar` (búsqueda + botón "Filtros" con
 * badge contador) + `FilterPanel` — bottom sheet en móvil/tablet (<lg),
 * panel deslizante ("drawer") desde el borde derecho en escritorio (≥lg).
 *
 * Los filtros activos aparecen como chips bajo la barra en todos los
 * breakpoints.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
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
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReviewFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalReviews,
  className,
}: ReviewFiltersProps) {
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

  // ── Secciones del panel móvil ─────────────────────────────────────────────

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
    <div className={cn('space-y-2', className)}>

      {/* ── Búsqueda + botón "Filtros" — mismo componente en todos los breakpoints ── */}
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
        resultCount={totalReviews}
        resultLabel="reseñas"
        variant="drawer"
      />
    </div>
  );
}
