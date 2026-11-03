/**
 * @file StepProductionSeasonality.test.tsx
 * @description Temporalidad del producto (petición del humano, 2026-11-03):
 * pestaña "Temporada" del paso Producción -- activar el toggle muestra el
 * selector de meses, y desactivarlo vacía los meses elegidos.
 *
 * ux-library está mockeado globalmente (vitest.setup.ts) como passthrough --
 * aquí se usa el componente real para que Tabs/Checkbox funcionen de verdad.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@arcediano/ux-library', async () => vi.importActual('@arcediano/ux-library'));

const { StepProduction } = await import(
  '@/app/dashboard/products/components/steps/StepProduction'
);

describe('StepProduction — pestaña Temporada', () => {
  it('activar el toggle muestra el selector de meses; elegir un mes lo notifica', () => {
    const onIsSeasonalChange = vi.fn();
    const onSeasonMonthsChange = vi.fn();

    render(
      <StepProduction
        isSeasonal={false}
        onIsSeasonalChange={onIsSeasonalChange}
        seasonMonths={[]}
        onSeasonMonthsChange={onSeasonMonthsChange}
        onNestedChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('Temporada'));
    expect(screen.getByText('Es un producto de temporada')).toBeDefined();
    expect(screen.queryByText('Mayo')).toBeNull();

    fireEvent.click(screen.getByText('Es un producto de temporada'));
    expect(onIsSeasonalChange).toHaveBeenCalledWith(true);
  });

  it('con isSeasonal activo, pulsar un mes lo añade a seasonMonths', () => {
    const onSeasonMonthsChange = vi.fn();

    render(
      <StepProduction
        isSeasonal={true}
        onIsSeasonalChange={() => {}}
        seasonMonths={[6]}
        onSeasonMonthsChange={onSeasonMonthsChange}
        onNestedChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('Temporada'));
    fireEvent.click(screen.getByText('Mayo'));

    expect(onSeasonMonthsChange).toHaveBeenCalledWith([5, 6]);
  });

  it('desactivar el toggle vacía los meses elegidos', () => {
    const onIsSeasonalChange = vi.fn();
    const onSeasonMonthsChange = vi.fn();

    render(
      <StepProduction
        isSeasonal={true}
        onIsSeasonalChange={onIsSeasonalChange}
        seasonMonths={[6, 7, 8]}
        onSeasonMonthsChange={onSeasonMonthsChange}
        onNestedChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('Temporada'));
    fireEvent.click(screen.getByText('Es un producto de temporada'));

    expect(onIsSeasonalChange).toHaveBeenCalledWith(false);
    expect(onSeasonMonthsChange).toHaveBeenCalledWith([]);
  });
});
