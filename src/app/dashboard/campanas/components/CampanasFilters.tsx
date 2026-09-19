/**
 * @file CampanasFilters.tsx
 * @description Filtros de campañas — patrón "Bosque Comercial" v5.5.
 *
 * `FilterToolbar` (búsqueda + botón "Filtros" con badge contador) en todos
 * los breakpoints + `FilterPanel` (bottom sheet en móvil, panel lateral en
 * escritorio) con las mismas secciones — mismo patrón que `/dashboard/products`.
 *
 * Los filtros activos aparecen como chips bajo la barra.
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

      <FilterToolbar
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por titular o producto..."
        searchAriaLabel="Buscar campañas"
        activeFilterCount={activeCount}
        onOpenFilters={() => setPanelOpen(true)}
        filtersButtonRef={filtersButtonRef}
        compact
      />

      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
            Activos:
          </span>
          <ActiveFilterChips chips={activeChips} onClearAll={() => onStatusChange('ALL')} />
        </div>
      )}

      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        triggerRef={filtersButtonRef}
        sections={sections}
        onClearAll={() => onStatusChange('ALL')}
        resultCount={totalCampaigns}
        resultLabel={totalCampaigns === 1 ? 'campaña' : 'campañas'}
        variant="drawer"
      />
    </div>
  );
}

export default CampanasFilters;
