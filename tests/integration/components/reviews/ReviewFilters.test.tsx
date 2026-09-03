/**
 * @file ReviewFilters.test.tsx
 * @description Smoke test de integración para ReviewFilters tras migrar el
 * sidebar de escritorio a FilterSidebarPanel (draft + Aplicar filtros).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../helpers/render';
import { ReviewFilters } from '@/app/dashboard/reviews/components/ReviewFilters';
import type { ReviewFilters as ReviewFiltersType } from '@/types/review';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/reviews',
}));

// vitest.setup.ts mockea @arcediano/ux-library globalmente, pero ese mock no
// cubre FilterSidebarPanel/FilterToolbar/FilterPanel/ActiveFilterChips/
// SearchInput/useIsMobile -- se restaura la librería real para este archivo.
vi.mock('@arcediano/ux-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arcediano/ux-library')>();
  return { ...actual };
});

function renderReviewFilters(overrides: Partial<{ filters: ReviewFiltersType; onFilterChange: (f: ReviewFiltersType) => void }> = {}) {
  const onFilterChange = overrides.onFilterChange ?? vi.fn();
  const onClearFilters = vi.fn();
  render(
    <ReviewFilters
      filters={overrides.filters ?? {}}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      totalReviews={8}
    >
      <div data-testid="results">Resultados de reseñas</div>
    </ReviewFilters>,
  );
  return { onFilterChange, onClearFilters };
}

describe('ReviewFilters', () => {
  it('renderiza el sidebar de escritorio con sus secciones (Estado, Valoración, Opciones) y Aplicar filtros', () => {
    renderReviewFilters();
    expect(screen.getByText('Valoración')).toBeInTheDocument();
    expect(screen.getByText('Opciones')).toBeInTheDocument();
    expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
  });

  it('renderiza el contenido principal (children) junto al sidebar', () => {
    renderReviewFilters();
    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('el filtro de valoración se aplica como sección chips (★5..★1), no como StarRating', () => {
    renderReviewFilters();
    expect(screen.getByText('★ 5')).toBeInTheDocument();
    expect(screen.getByText('★ 1')).toBeInTheDocument();
  });

  it('NO llama a onFilterChange al activar un toggle hasta pulsar Aplicar filtros', () => {
    const { onFilterChange } = renderReviewFilters();

    fireEvent.click(screen.getByText('Con imágenes'));
    expect(onFilterChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Aplicar filtros'));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ hasImages: true }));
  });
});
