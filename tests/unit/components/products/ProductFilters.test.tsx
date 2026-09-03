/**
 * @file ProductFilters.test.tsx
 * @description Tests unitarios para ProductFilters — Opción A: "Ordenar"
 * separado de "Filtros" (ver claude-agile/proyectos/origen-dashboard/tareas-completadas.md).
 *
 * Verifica:
 * - "Ordenar" ya no cuenta en el badge/contador de "Filtros".
 * - "Ordenar" ya no aparece en la fila de chips "Activos:".
 * - El botón "Ordenar" abre su propia hoja con las opciones de orden y,
 *   al elegir una, llama a onSortChange con el valor correcto y se cierra.
 *
 * `@arcediano/ux-library` se mockea (patrón ya usado en OrganicScoreBadge.test.tsx)
 * porque el alias de vitest resuelve al paquete publicado en npm, no al
 * código fuente local — mockear evita depender de qué versión esté instalada.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductFilters } from '@/app/dashboard/products/components/ProductFilters';

vi.mock('@arcediano/ux-library', () => ({
  FilterToolbar: ({
    activeFilterCount,
    onOpenFilters,
    actions,
  }: {
    activeFilterCount?: number;
    onOpenFilters?: () => void;
    actions?: React.ReactNode;
  }) => (
    <div>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={activeFilterCount && activeFilterCount > 0 ? `Filtros (${activeFilterCount} activos)` : 'Abrir filtros'}
      >
        Filtros
      </button>
      {actions}
    </div>
  ),
  FilterPanel: () => null,
  FilterBottomSheet: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title?: string;
    children?: React.ReactNode;
  }) => (open ? <div role="dialog" aria-label={title}>{children}</div> : null),
  ActiveFilterChips: ({ chips }: { chips: Array<{ id: string; label: string }> }) => (
    <div data-testid="active-chips">
      {chips.map((c) => (
        <span key={c.id}>{c.label}</span>
      ))}
    </div>
  ),
}));

const baseProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  selectedCategory: '',
  onCategoryChange: vi.fn(),
  selectedStatus: '',
  onStatusChange: vi.fn(),
  selectedStock: '',
  onStockChange: vi.fn(),
  viewMode: 'list' as const,
  onViewModeChange: vi.fn(),
  totalProducts: 5,
  onClearFilters: vi.fn(),
};

describe('ProductFilters — Ordenar separado de Filtros', () => {
  it('no cuenta "Ordenar" en el badge de "Filtros" cuando solo hay un orden seleccionado', () => {
    render(
      <ProductFilters {...baseProps} sortBy="newest" onSortChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Abrir filtros' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtros \(\d+ activos\)/ })).not.toBeInTheDocument();
  });

  it('sí cuenta un filtro real (stock) en el badge de "Filtros"', () => {
    render(
      <ProductFilters {...baseProps} selectedStock="disponible" sortBy="" onSortChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Filtros (1 activos)' })).toBeInTheDocument();
  });

  it('no muestra "Ordenar" en la fila de chips "Activos:"', () => {
    render(
      <ProductFilters {...baseProps} selectedStock="disponible" sortBy="newest" onSortChange={vi.fn()} />,
    );
    const chips = screen.getByTestId('active-chips');
    expect(chips.textContent).toContain('Con stock');
    expect(chips.textContent).not.toContain('recientes');
  });

  it('abre la hoja de "Ordenar" al pulsar su botón y lista las opciones de orden', () => {
    render(
      <ProductFilters {...baseProps} sortBy="" onSortChange={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog', { name: 'Ordenar por' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar' }));

    const sheet = screen.getByRole('dialog', { name: 'Ordenar por' });
    expect(sheet).toBeInTheDocument();
    expect(screen.getByText('Más recientes')).toBeInTheDocument();
    expect(screen.getByText('Precio ↑')).toBeInTheDocument();
  });

  it('llama a onSortChange con el valor elegido y cierra la hoja', () => {
    const onSortChange = vi.fn();
    render(
      <ProductFilters {...baseProps} sortBy="" onSortChange={onSortChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar' }));
    fireEvent.click(screen.getByText('Nombre A-Z'));

    expect(onSortChange).toHaveBeenCalledWith('name-asc');
    expect(screen.queryByRole('dialog', { name: 'Ordenar por' })).not.toBeInTheDocument();
  });

  it('resalta el botón "Ordenar" cuando hay un orden distinto de "Por defecto"', () => {
    const { rerender } = render(
      <ProductFilters {...baseProps} sortBy="" onSortChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Ordenar' }).className).not.toContain('bg-origen-bosque');

    rerender(<ProductFilters {...baseProps} sortBy="price-desc" onSortChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Ordenar/ }).className).toContain('bg-origen-bosque');
  });
});
