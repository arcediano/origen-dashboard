/**
 * @component ReviewFilters
 * @description Filtros de reseñas — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterSheet (pantalla completa)
 * Desktop → barra de búsqueda + Select por grupo + pill toggles para booleanos
 */

'use client';

import React from 'react';
import { CheckCircle, ThumbsUp, ImageIcon, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FilterToolbar,
  FilterSheet,
  type FilterSection,
  type ToggleOption,
  ActiveFilterChips,
  type ActiveFilterChip,
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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReviewFiltersProps {
  filters: ReviewFiltersType;
  onFilterChange: (filters: ReviewFiltersType) => void;
  onClearFilters: () => void;
  totalReviews: number;
  className?: string;
}

// Clases del trigger de Select adaptadas al filtro
const triggerCls = 'h-9 py-0 sm:py-0 px-3 sm:px-3 text-sm bg-surface-alt border-border w-auto';

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

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      onFilterChange({ search: value || undefined } as ReviewFiltersType);
    }, 300);
    return () => clearTimeout(timer);
  };

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

      {/* ── Chips de filtros activos — móvil y desktop ────────────────────────────────── */}
      <ActiveFilterChips chips={activeChips} onClearAll={onClearFilters} />
      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterSheet
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        sections={sheetSections}
        onClearAll={onClearFilters}
        resultCount={totalReviews}
        resultLabel="reseñas"
      />

      {/* ── Filtros desktop: Select + pill toggles booleanos ──────────── */}
      <div className="hidden lg:flex items-center gap-2 pt-1">

        {/* Estado */}
        <Select value={filters.status ?? ''} onValueChange={(v) => set('status', v as ReviewStatus || undefined)} className="w-auto">
          <SelectTrigger className={triggerCls}>
            <SelectValue className="text-sm">
              {filters.status
                ? STATUS_OPTIONS.find(o => o.value === filters.status)?.label
                : <span className="text-text-disabled">Estado</span>}
            </SelectValue>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle ml-2" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Tipo */}
        <Select value={filters.type ?? ''} onValueChange={(v) => set('type', v as ReviewType || undefined)} className="w-auto">
          <SelectTrigger className={triggerCls}>
            <SelectValue className="text-sm">
              {filters.type
                ? TYPE_OPTIONS.find(o => o.value === filters.type)?.label
                : <span className="text-text-disabled">Tipo</span>}
            </SelectValue>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle ml-2" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Valoración */}
        <Select
          value={filters.rating ? String(filters.rating) : ''}
          onValueChange={(v) => onFilterChange({ ...filters, rating: v ? Number(v) as any : undefined })}
          className="w-auto"
        >
          <SelectTrigger className={triggerCls}>
            <SelectValue className="text-sm">
              {filters.rating
                ? RATING_OPTIONS.find(o => o.value === String(filters.rating))?.label
                : <span className="text-text-disabled">Valoración</span>}
            </SelectValue>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle ml-2" />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Booleanos — pill toggles (on/off, sin valor placeholder → no se usan Select) */}
        <button onClick={() => onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
            filters.verifiedOnly ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><CheckCircle className="w-3 h-3" />Verificadas</button>

        <button onClick={() => onFilterChange({ ...filters, hasResponse: !filters.hasResponse })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
            filters.hasResponse ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><ThumbsUp className="w-3 h-3" />Con respuesta</button>

        <button onClick={() => onFilterChange({ ...filters, hasImages: !filters.hasImages })}
          className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
            filters.hasImages ? 'bg-origen-bosque border-origen-bosque text-white' : 'bg-surface-alt border-border text-origen-bosque hover:border-origen-pradera/50')}
        ><ImageIcon className="w-3 h-3" />Con imágenes</button>

        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} leftIcon={<X className="w-3 h-3" />}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

