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
 * - El panel de filtros (categoría/estado/stock) usa el `Select` de la
 *   librería y el estado incluye "Pendiente aprobación" (petición del
 *   humano, 2026-10-08: faltaba como opción para filtrar).
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
  FilterBottomSheet: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
  }) => (open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null),
  ActiveFilterChips: ({ chips }: { chips: Array<{ id: string; label: string }> }) => (
    <div data-testid="active-chips">
      {chips.map((c) => (
        <span key={c.id}>{c.label}</span>
      ))}
    </div>
  ),
  // Panel de filtros propio (ver cabecera de ProductFilters.tsx): escritorio
  // siempre en estos tests (useIsMobile mockeado a false) — pasa por Sheet,
  // no por FilterBottomSheet. Mocks mínimos, suficientes para comprobar que
  // las opciones de cada Select (incluida "Pendiente aprobación") llegan al DOM.
  useIsMobile: () => false,
  Sheet: ({ open, children }: { open: boolean; children?: React.ReactNode }) =>
    (open ? <div role="dialog" aria-label="Filtros">{children}</div> : null),
  SheetContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Select: ({ label, children }: { label?: string; children?: React.ReactNode }) => (
    <div data-testid={`select-${label}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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

describe('ProductFilters — panel de filtros con Select (petición del humano, 2026-10-08)', () => {
  it('el Select de Estado incluye "Pendiente aprobación", antes ausente', () => {
    render(<ProductFilters {...baseProps} sortBy="" onSortChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }));

    const statusSelect = screen.getByTestId('select-Estado');
    expect(statusSelect).toHaveTextContent('Pendiente aprobación');
    // Y los demás estados reales del producto siguen ahí.
    expect(statusSelect).toHaveTextContent('Activos');
    expect(statusSelect).toHaveTextContent('Borradores');
    expect(statusSelect).toHaveTextContent('Sin stock');
    expect(statusSelect).toHaveTextContent('Inactivos');
  });

  it('categoría/estado/stock se controlan con el Select de la librería, no con botones de chip', () => {
    render(<ProductFilters {...baseProps} sortBy="" onSortChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }));

    expect(screen.getByTestId('select-Categoría')).toBeInTheDocument();
    expect(screen.getByTestId('select-Estado')).toBeInTheDocument();
    expect(screen.getByTestId('select-Stock')).toBeInTheDocument();
  });
});
