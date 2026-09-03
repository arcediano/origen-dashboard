/**
 * @file OrderFilters.test.tsx
 * @description Smoke test de integración para OrderFilters tras migrar el
 * sidebar de escritorio a FilterSidebarPanel (draft + Aplicar filtros) --
 * cubre lo que tsc/build no detectan: fallos de render en tiempo real,
 * props mal enlazadas entre el sidebar y el bottom sheet, y que "Aplicar
 * filtros" (no cada clic individual) es lo que dispara onFilterChange.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../helpers/render';
import { OrderFilters } from '@/app/dashboard/orders/components/OrderFilters';
import type { OrderFilters as OrderFiltersType } from '@/types/order';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/orders',
}));

// vitest.setup.ts mockea @arcediano/ux-library globalmente, pero ese mock no
// cubre FilterSidebarPanel/FilterToolbar/FilterPanel/ActiveFilterChips/
// SearchInput/useIsMobile (nadie los usaba en tests hasta esta migración).
// Se restaura la librería real para este archivo -- son los componentes que
// se están probando, no tiene sentido mockearlos.
vi.mock('@arcediano/ux-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arcediano/ux-library')>();
  return { ...actual };
});

function renderOrderFilters(overrides: Partial<{ filters: OrderFiltersType; onFilterChange: (f: OrderFiltersType) => void }> = {}) {
  const onFilterChange = overrides.onFilterChange ?? vi.fn();
  const onClearFilters = vi.fn();
  render(
    <OrderFilters
      filters={overrides.filters ?? {}}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      totalOrders={12}
    >
      <div data-testid="results">Resultados de pedidos</div>
    </OrderFilters>,
  );
  return { onFilterChange, onClearFilters };
}

describe('OrderFilters', () => {
  it('renderiza el sidebar de escritorio (FilterSidebarPanel) con sus secciones y el botón Aplicar filtros', () => {
    renderOrderFilters();
    // "Filtros" aparece tanto en la cabecera del sidebar (FilterSidebarPanel)
    // como en el botón de FilterToolbar (jsdom no aplica el hidden/lg:flex
    // que los separa visualmente por viewport) -- ambos coexisten en el DOM.
    expect(screen.getAllByText('Filtros').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Importe')).toBeInTheDocument();
    expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
  });

  it('renderiza el contenido principal (children) junto al sidebar', () => {
    renderOrderFilters();
    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('NO llama a onFilterChange al elegir un chip de estado hasta pulsar Aplicar filtros', () => {
    const { onFilterChange } = renderOrderFilters();

    fireEvent.click(screen.getByText('Enviados'));
    expect(onFilterChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Aplicar filtros'));
    expect(onFilterChange).toHaveBeenCalledWith({ status: 'shipped' });
  });

  it('renderiza los chips de filtros activos cuando hay un filtro aplicado', () => {
    renderOrderFilters({ filters: { status: 'pending' } });
    expect(screen.getByText('Activos:')).toBeInTheDocument();
    // "Pendientes" aparece dos veces (el chip seleccionado dentro del sidebar
    // y el chip de "Activos:" fuera de él) -- basta con confirmar que al
    // menos una instancia está presente, sin ambigüedad de selector único.
    expect(screen.getAllByText('Pendientes').length).toBeGreaterThanOrEqual(2);
  });
});
