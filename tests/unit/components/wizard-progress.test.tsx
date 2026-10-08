import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WizardProgress } from '@/components/shared/wizard-progress';

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let ioCallback: IOCallback | null = null;
beforeEach(() => {
  ioCallback = null;
  vi.stubGlobal('IntersectionObserver', class { constructor(cb: IOCallback) { ioCallback = cb; } observe() {} disconnect() {} unobserve() {} });
});

const steps = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, label: id.toUpperCase(), icon: <span /> }));

describe('WizardProgress', () => {
  it('una sola barra, "Paso X de N" y progreso explícito', () => {
    render(<WizardProgress steps={steps} currentId="b" completed={{ a: true }} onStepChange={vi.fn()} progress={20} />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.getByText(/Paso 2 de 5 — B/)).toBeTruthy();
    expect(screen.getByText(/20%/)).toBeTruthy();
  });

  it('solo se navega hasta maxReachableIndex y los completados se anuncian', () => {
    const onStepChange = vi.fn();
    render(<WizardProgress steps={steps} currentId="c" completed={{ a: true, b: true }} onStepChange={onStepChange} maxReachableIndex={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir al paso A (completado)' }));
    expect(onStepChange).toHaveBeenCalledWith('a');
    onStepChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Ir al paso D' }));
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it('se condensa con el scroll manteniendo una sola barra', () => {
    render(<WizardProgress steps={steps} currentId="a" completed={{}} onStepChange={vi.fn()} />);
    act(() => ioCallback?.([{ isIntersecting: false }]));
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });

  it('embedded: sin sticky propio ni sangrado a los bordes — el padre ya aplica su propio sticky (columna lateral junto a "Consejos útiles")', () => {
    const { container } = render(
      <WizardProgress steps={steps} currentId="a" completed={{}} onStepChange={vi.fn()} embedded />,
    );
    const wrapper = container.querySelector('[aria-hidden="true"]')?.nextElementSibling;
    expect(wrapper?.className).not.toContain('sticky');
    expect(wrapper?.className).not.toContain('-mx-4');
    expect(wrapper?.className).not.toContain('-mx-6');
  });

  it('sin embedded (por defecto): mantiene su propio sticky, como hasta ahora', () => {
    const { container } = render(
      <WizardProgress steps={steps} currentId="a" completed={{}} onStepChange={vi.fn()} />,
    );
    const wrapper = container.querySelector('[aria-hidden="true"]')?.nextElementSibling;
    expect(wrapper?.className).toContain('sticky');
  });

  it('embedded: nunca se condensa con el scroll (hay sitio de sobra en la columna lateral, petición del humano 2026-10-08)', () => {
    render(<WizardProgress steps={steps} currentId="a" completed={{}} onStepChange={vi.fn()} embedded />);
    // Sin embedded, este mismo evento pasaría al modo condensado (ver test de arriba) --
    // en embedded no debe tener efecto: el icono se mantiene en su tamaño completo.
    act(() => ioCallback?.([{ isIntersecting: false }]));
    expect(screen.getByRole('button', { name: 'Ir al paso A' }).querySelector('div')?.className).not.toContain('h-7 w-7');
  });
});
