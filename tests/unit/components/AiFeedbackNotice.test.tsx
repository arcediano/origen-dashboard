import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiFeedbackNotice, aiFieldLabel, aiFieldStep } from '@/app/dashboard/products/components/AiFeedbackNotice';
import type { AiFeedback } from '@/lib/api/products';

const feedback = (over: Partial<AiFeedback> = {}): AiFeedback => ({
  kind: 'NEEDS_CORRECTION',
  problems: [
    { field: 'fullDescription', message: 'Quita la promesa de salud' },
    { field: '', message: 'Falta la imagen principal' },
  ],
  attempt: 1,
  createdAt: '2026-11-17T10:00:00Z',
  ...over,
});

describe('AiFeedbackNotice', () => {
  it('lista los problemas con el nombre del campo en castellano, nunca la key', () => {
    render(<AiFeedbackNotice feedback={feedback()} productId="p1" />);
    expect(screen.getByText('Hay datos que debes corregir')).toBeInTheDocument();
    expect(screen.getByText('Descripción:')).toBeInTheDocument();
    expect(screen.queryByText(/fullDescription/)).toBeNull();
    expect(screen.getByText(/Falta la imagen principal/)).toBeInTheDocument();
  });

  it('explica que al reenviar se revisa de nuevo en segundos e indica el nº de revisión', () => {
    render(<AiFeedbackNotice feedback={feedback({ attempt: 2 })} productId="p1" />);
    expect(screen.getByText(/revisión nº 2/)).toBeInTheDocument();
    expect(screen.getByText(/lo revisaremos de nuevo en unos segundos/)).toBeInTheDocument();
  });

  it('en el detalle enlaza a la edición; en la edición salta al paso del campo', () => {
    const { unmount } = render(<AiFeedbackNotice feedback={feedback()} productId="p1" />);
    expect(screen.getByRole('link', { name: /Corregir ahora/ })).toHaveAttribute('href', '/dashboard/products/p1/edit');
    unmount();

    const onJump = vi.fn();
    render(<AiFeedbackNotice feedback={feedback()} productId="p1" onJumpToStep={onJump} />);
    fireEvent.click(screen.getByRole('button', { name: /Ir a «Básico»/ }));
    expect(onJump).toHaveBeenCalledWith('basic');
    expect(screen.queryByRole('link', { name: /Corregir ahora/ })).toBeNull();
  });

  it('una reversión del admin lo dice claramente', () => {
    render(
      <AiFeedbackNotice
        feedback={feedback({ kind: 'REVERTED', problems: [{ field: '', message: 'La foto no corresponde' }] })}
        productId="p1"
      />,
    );
    expect(screen.getByText('Un administrador ha revertido la publicación')).toBeInTheDocument();
    expect(screen.getByText(/La foto no corresponde/)).toBeInTheDocument();
  });

  it('mapea campos a etiqueta y paso', () => {
    expect(aiFieldLabel('productionInfo.story')).toBe('Historia del producto');
    expect(aiFieldStep('productionInfo.story')).toBe('production');
    expect(aiFieldLabel('algo_raro')).toBeNull();
  });
});
