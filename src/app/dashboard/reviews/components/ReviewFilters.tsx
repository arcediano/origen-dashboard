/**
 * @component ReviewFilters
 * @description Filtros de reseñas — mobile-first, estilo app nativa.
 *
 * Móvil  → barra de búsqueda + botón "Filtros" → FilterBottomSheet (pantalla completa)
 * Desktop → barra de búsqueda + Select por grupo + pill toggles para booleanos
 */

'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, CheckCircle, ThumbsUp, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBottomSheet, type FilterSection } from '@/components/shared/mobile';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/atoms/select';
import { Button } from '@/components/ui/atoms/button';
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

        {/* Botón toggle filtros — solo móvil */}
        <button
          onClick={() => setPanelOpen(prev => !prev)}
          className={cn(
            'lg:hidden flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors',
            panelOpen || activeCount > 0
              ? 'bg-origen-bosque border-origen-bosque text-white'
              : 'bg-surface-alt border-border text-origen-bosque',
          )}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Cerrar filtros' : 'Abrir filtros'}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros</span>
          {activeCount > 0 && !panelOpen && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          {panelOpen
            ? <ChevronUp className="w-3.5 h-3.5 opacity-70" />
            : <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          }
        </button>
      </div>

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
          <Button variant="ghost" size="xs" onClick={onClearFilters} leftIcon={<X className="w-3 h-3" />}>
            Limpiar
          </Button>
        )}
      </div>

      {/* ── Bottom sheet de filtros — solo móvil ──────────────────────── */}
      <FilterBottomSheet
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        sections={sheetSections}
        onClearAll={onClearFilters}
        resultCount={totalReviews}
        resultLabel="reseñas"
      />
    </div>
  );
}
