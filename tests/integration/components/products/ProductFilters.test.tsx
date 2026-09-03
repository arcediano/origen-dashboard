/**
 * @file ProductFilters.test.tsx
 * @description Smoke test de integración para ProductFilters tras migrar el
 * sidebar de escritorio a FilterSidebarPanel (draft + Aplicar filtros),
 * incluido el toggle de vista grid/lista como children junto a la búsqueda.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../helpers/render';
import { ProductFilters } from '@/app/dashboard/products/components/ProductFilters';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/products',
}));

// vitest.setup.ts mockea @arcediano/ux-library globalmente, pero ese mock no
// cubre FilterSidebarPanel/FilterToolbar/FilterPanel/ActiveFilterChips/
// SearchInput/useIsMobile -- se restaura la librería real para este archivo.
vi.mock('@arcediano/ux-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arcediano/ux-library')>();
  return { ...actual };
});

function renderProductFilters(overrides: Partial<{ onCategoryChange: (v: string) => void }> = {}) {
  const onCategoryChange = overrides.onCategoryChange ?? vi.fn();
  const onClearFilters = vi.fn();
  const onViewModeChange = vi.fn();
  render(
    <ProductFilters
      searchQuery=""
      onSearchChange={vi.fn()}
      selectedCategory=""
      onCategoryChange={onCategoryChange}
      selectedStatus=""
      onStatusChange={vi.fn()}
      selectedStock=""
      onStockChange={vi.fn()}
      sortBy=""
      onSortChange={vi.fn()}
      viewMode="grid"
      onViewModeChange={onViewModeChange}
      totalProducts={20}
      onClearFilters={onClearFilters}
    >
      <div data-testid="results">Resultados de productos</div>
    </ProductFilters>,
  );
  return { onCategoryChange, onClearFilters, onViewModeChange };
}

describe('ProductFilters', () => {
  it('renderiza el sidebar de escritorio con sus secciones (Categoría, Estado, Stock, Ordenar por) y Aplicar filtros', () => {
    renderProductFilters();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Ordenar por')).toBeInTheDocument();
    expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
  });

  it('renderiza el toggle de vista grid/lista junto a la búsqueda en el sidebar', () => {
    renderProductFilters();
    expect(screen.getAllByLabelText('Vista cuadrícula').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Vista tabla').length).toBeGreaterThanOrEqual(1);
  });

  it('el toggle de vista actúa de inmediato (no forma parte del draft de filtros)', () => {
    const { onViewModeChange } = renderProductFilters();
    fireEvent.click(screen.getAllByLabelText('Vista tabla')[0]);
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });

  it('renderiza el contenido principal (children) junto al sidebar', () => {
    renderProductFilters();
    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('NO llama a onCategoryChange al elegir una categoría hasta pulsar Aplicar filtros', () => {
    const { onCategoryChange } = renderProductFilters();

    fireEvent.click(screen.getByText('Quesos'));
    expect(onCategoryChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Aplicar filtros'));
    expect(onCategoryChange).toHaveBeenCalledWith('quesos');
  });
});
