import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CreateProductProgress } from '@/app/dashboard/products/components/CreateProductProgress';

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let ioCallback: IOCallback | null = null;

beforeEach(() => {
  ioCallback = null;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IOCallback) {
        ioCallback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

const props = { currentTab: 'basic' as const, completedTabs: {}, onTabChange: vi.fn() };

describe('CreateProductProgress', () => {
  it('muestra una sola barra de progreso y el paso actual', () => {
    render(<CreateProductProgress {...props} />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.getByText(/Paso 1 de 6/)).toBeTruthy();
  });

  it('los 8 pasos son botones accesibles y solo se puede saltar al siguiente', () => {
    const onTabChange = vi.fn();
    render(<CreateProductProgress {...props} onTabChange={onTabChange} />);
    const steps = screen.getAllByRole('button', { name: /Ir al paso/ });
    expect(steps).toHaveLength(6);
    fireEvent.click(steps[1]);
    expect(onTabChange).toHaveBeenCalledTimes(1);
    onTabChange.mockClear();
    fireEvent.click(steps[4]); // deshabilitado (más allá del siguiente)
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('al hacer scroll pasa a la forma compacta y sigue habiendo una sola barra', () => {
    render(<CreateProductProgress {...props} />);
    act(() => ioCallback?.([{ isIntersecting: false }]));
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    // la etiqueta de texto deja de estar visible (solo lectores de pantalla)
    const label = screen.getAllByText('Básico').find((el) => el.tagName === 'SPAN' && el.className.includes('truncate'));
    expect(label?.className).toContain('sr-only');
  });
});
