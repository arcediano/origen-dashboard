import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssistantResultCard, buildResultItems } from '@/app/dashboard/products/components/AssistantResultCard';

const base = { id: 'p1', basePrice: 4.5, hasVariants: false, variants: [], netContent: 1, netContentUnit: 'kg' } as never;

describe('buildResultItems', () => {
  it('con precio ya puesto no pide añadir precio y ofrece añadir formatos', () => {
    const items = buildResultItems(base, 'usda');
    expect(items.find((i) => i.id === 'price')).toMatchObject({ done: true, title: 'Precio' });
    expect(items.find((i) => i.id === 'format')?.title).toBe('Se vende por 1 kg');
    expect(items.find((i) => i.id === 'format')?.action?.label).toBe('Añadir formatos');
  });
  it('sin precio lo marca como pendiente', () => {
    const items = buildResultItems({ ...(base as object), basePrice: 0 } as never, 'label');
    expect(items.find((i) => i.id === 'price')).toMatchObject({ done: false, title: 'Falta el precio' });
  });
  it('con variantes habla de varios formatos y toma el precio mínimo', () => {
    const items = buildResultItems(
      { ...(base as object), hasVariants: true, basePrice: 0, variants: [{ price: 9 }, { price: 4 }] } as never,
      'none',
    );
    expect(items.find((i) => i.id === 'price')?.detail).toMatch(/4,00/);
    expect(items.find((i) => i.id === 'format')?.title).toBe('Varios formatos de venta');
    expect(items.find((i) => i.id === 'nutrition')).toMatchObject({ done: false });
  });
});

describe('temporada sugerida', () => {
  it('si el producto es de temporada lo explica con los meses en texto', () => {
    const items = buildResultItems({ ...(base as object), isSeasonal: true, seasonMonths: [8, 6, 7] } as never, 'usda');
    const season = items.find((i) => i.id === 'season');
    expect(season?.detail).toMatch(/junio, julio y agosto/);
    expect(season?.action?.step).toBe('production');
  });
  it('si no lo es, no añade la fila', () => {
    expect(buildResultItems(base, 'usda').some((i) => i.id === 'season')).toBe(false);
  });
});

describe('AssistantResultCard', () => {
  it('no muestra «Añadir precio ahora» cuando el precio ya existe', () => {
    render(<AssistantResultCard product={base} nutrition="usda" onLater={vi.fn()} />);
    expect(screen.queryByText(/Añadir precio/)).toBeNull();
    expect(screen.getByTestId('assistant-item-price').getAttribute('data-done')).toBe('true');
    expect(screen.getByText('Revisar y completar')).toBeTruthy();
  });
});
