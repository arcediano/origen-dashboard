/**
 * @component ReviewFilters
 * @description Filtros de reseñas — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterSheet (pantalla completa)
 * Desktop → barra de búsqueda + Select por grupo + StarRating + pill toggles booleanos
 *
 * Iteración 3: Select compactos para Estado y Tipo (reemplaza ToggleGroup pills
 * que ocupaban demasiado espacio horizontal). StarRating y booleanos (1 item c/u)
 * se mantienen como ToggleGroupItem pill. Zona ActiveFilterChips con separación
 * visual explícita respecto al formulario de filtros.
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CheckCircle, ThumbsUp, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterSheet,
  type FilterSection,
  ActiveFilterChips,
  type ActiveFilterChip,
  ToggleGroup, ToggleGroupItem, StarRating,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { Button } from '@arcediano/ux-library';
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

// Clases del trigger de Select compacto para contexto de filtros
const triggerCls = 'h-9 py-0 sm:py-0 px-3 sm:px-3 text-sm bg-surface-alt border-border w-auto';

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

  const set = (key: keyof ReviewFiltersType, value: any) =>
    onFilterChange({ [key]: value || undefined } as ReviewFiltersType);

  // Chips de filtros activos: visibles en móvil (fuera del sheet) y en desktop
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
      onChange: (v) => onFilterChange({ rating: v ? Number(v) as any : undefined } as ReviewFiltersType),
    },
    {
      type: 'toggles',
      id: 'booleans',
      title: 'Opciones',
      options: [
        {
          id: 'verifiedOnly',
          label: 'Verificadas',
          icon: CheckCircle,
          value: filters.verifiedOnly ?? false,
          onChange: (v) => onFilterChange({ verifiedOnly: v || undefined } as ReviewFiltersType),
        },
        {
          id: 'hasResponse',
          label: 'Con respuesta',
          icon: ThumbsUp,
          value: filters.hasResponse ?? false,
          onChange: (v) => onFilterChange({ hasResponse: v || undefined } as ReviewFiltersType),
        },
        {
          id: 'hasImages',
          label: 'Con imágenes',
          icon: ImageIcon,
          value: filters.hasImages ?? false,
          onChange: (v) => onFilterChange({ hasImages: v || undefined } as ReviewFiltersType),
        },
      ],
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── FilterToolbar: búsqueda + botón filtros (móvil) con debounce ──────────── */}
      <FilterToolbar
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        onSearchDebouncedChange={(value) => onFilterChange({ search: value || undefined } as ReviewFiltersType)}
        searchDebounceMs={300}
        searchPlaceholder="Buscar reseñas..."
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
      />

      {/* ── Zona de filtros activos — diferenciada visualmente del formulario ─────── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
        </div>
      )}

      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterSheet
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        sections={sheetSections}
        onClearAll={onClearFilters}
        resultCount={totalReviews}
        resultLabel="reseñas"
      />

      {/* ── Filtros desktop: Select compactos + StarRating + pill toggles booleanos ── */}
      <div className="hidden lg:flex items-center gap-2 pt-1 flex-wrap">

        {/* Estado */}
        <Select
          value={filters.status ?? ''}
          onValueChange={(v) => {
            set('status', v as ReviewStatus || undefined);
          }}
          className="w-auto"
        >
          <SelectTrigger className={cn(triggerCls, 'min-w-[136px]')}>
            <SelectValue className="text-sm">
              {filters.status
                ? STATUS_OPTIONS.find(o => o.value === filters.status)?.label
                : <span className="text-text-disabled">Todos los estados</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Tipo */}
        <Select
          value={filters.type ?? ''}
          onValueChange={(v) => {
            set('type', v as ReviewType || undefined);
          }}
          className="w-auto"
        >
          <SelectTrigger className={cn(triggerCls, 'min-w-[120px]')}>
            <SelectValue className="text-sm">
              {filters.type
                ? TYPE_OPTIONS.find(o => o.value === filters.type)?.label
                : <span className="text-text-disabled">Todos los tipos</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Valoración — StarRating interactivo (compacto, 1 gesto) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-text-subtle whitespace-nowrap">Valoración:</span>
          <StarRating
            value={filters.rating ?? 0}
            size="sm"
            label="Filtrar por valoración"
            onChange={(star) => {
              const next = filters.rating === star ? undefined : star;
              onFilterChange({ ...filters, rating: next as any });
            }}
          />
          {filters.rating !== undefined && (
            <button
              type="button"
              className="text-xs text-text-subtle hover:text-origen-bosque transition-colors"
              aria-label="Quitar filtro de valoración"
              onClick={() => onFilterChange({ ...filters, rating: undefined })}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Booleanos — ToggleGroupItem pill individuales (1 opción c/u = toggle on/off) */}
        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={filters.verifiedOnly ? 'on' : ''}
          onValueChange={(v) => {
            const active = typeof v === 'string' && v === 'on';
            onFilterChange({ ...filters, verifiedOnly: active || undefined });
          }}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="on" aria-label="Verificadas">Verificadas</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={filters.hasResponse ? 'on' : ''}
          onValueChange={(v) => {
            const active = typeof v === 'string' && v === 'on';
            onFilterChange({ ...filters, hasResponse: active || undefined });
          }}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="on" aria-label="Con respuesta">Con respuesta</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="pill"
          size="sm"
          value={filters.hasImages ? 'on' : ''}
          onValueChange={(v) => {
            const active = typeof v === 'string' && v === 'on';
            onFilterChange({ ...filters, hasImages: active || undefined });
          }}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="on" aria-label="Con imágenes">Con imágenes</ToggleGroupItem>
        </ToggleGroup>

        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} leftIcon={<X className="w-3 h-3" />}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
