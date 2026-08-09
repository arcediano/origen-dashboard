/**
 * @file CampanasFilters.tsx
 * @description Filtros de campañas — patrón "Bosque Comercial" v5.5.
 *
 * Desktop (≥lg): controles siempre visibles en línea — búsqueda por titular
 * o producto + Select de estado.
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
  useIsMobile,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';
import type { CampaignStatus } from '@/lib/api/campaigns';

export const STATUS_FILTER_OPTIONS: Array<{ value: CampaignStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'PENDING_REVIEW', label: 'En revisión' },
  { value: 'PAUSED', label: 'Pausadas' },
  { value: 'ENDED', label: 'Finalizadas' },
];

export interface CampanasFiltersProps {
  statusFilter: CampaignStatus | 'ALL';
  onStatusChange: (value: CampaignStatus | 'ALL') => void;
  search: string;
  onSearchChange: (value: string) => void;
  totalCampaigns: number;
  className?: string;
}

export function CampanasFilters({
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  totalCampaigns,
  className,
}: CampanasFiltersProps) {
  const isMobile = useIsMobile(1024);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);

  const activeChips: ActiveFilterChip[] = [
    ...(statusFilter !== 'ALL' ? [{
      id: 'status',
      label: STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter,
      onRemove: () => onStatusChange('ALL'),
    }] : []),
  ];

  const activeCount = statusFilter !== 'ALL' ? 1 : 0;

  const sections: FilterSection[] = [
    {
      type: 'chips',
      id: 'status',
      title: 'Estado',
      options: STATUS_FILTER_OPTIONS,
      value: statusFilter,
      onChange: (v) => onStatusChange(v as CampaignStatus | 'ALL'),
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>

      {/* ── Desktop (≥lg): controles inline siempre visibles ─────────────────── */}
      <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border-subtle rounded-xl px-3 py-2 shadow-sm">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por titular o producto..."
          aria-label="Buscar campañas"
          className="min-w-[240px] flex-1"
          size="md"
        />
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as CampaignStatus | 'ALL')} className="w-auto">
          <SelectTrigger className="min-w-[160px] max-w-[200px] h-10" tone="subtle">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Móvil/tablet (<lg): barra con botón "Filtros" ────────────────────── */}
      <div className="lg:hidden">
        <FilterToolbar
          searchValue={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Buscar por titular o producto..."
          searchAriaLabel="Buscar campañas"
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
          <ActiveFilterChips chips={activeChips} onClearAll={() => onStatusChange('ALL')} />
        </div>
      )}

      {/* ── Panel de filtros: solo bottom sheet (<lg) ────────────────────────── */}
      {isMobile && (
        <FilterPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          triggerRef={filtersButtonRef}
          sections={sections}
          onClearAll={() => onStatusChange('ALL')}
          resultCount={totalCampaigns}
          resultLabel={totalCampaigns === 1 ? 'campaña' : 'campañas'}
        />
      )}
    </div>
  );
}

export default CampanasFilters;
