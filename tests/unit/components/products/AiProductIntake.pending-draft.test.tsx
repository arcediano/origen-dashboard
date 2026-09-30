import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiProductIntake } from '@/app/dashboard/products/components/ai-onboarding/AiProductIntake';

const base = { assistKey: 'k', quota: { used: 0, total: 5 }, onDraft: vi.fn(), onManual: vi.fn() };

describe('AiProductIntake — borrador local a medias', () => {
  it('sin borrador no muestra el aviso', () => {
    render(<AiProductIntake {...base} />);
    expect(screen.queryByText('Tienes un borrador sin terminar')).toBeNull();
    expect(screen.getByText('Crea tu producto en un minuto')).toBeTruthy();
  });

  it('con borrador muestra el asistente Y ofrece continuar o descartar', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();
    render(
      <AiProductIntake
        {...base}
        pendingDraft={{ name: 'Queso Manchego', onResume, onDiscard }}
      />,
    );
    expect(screen.getByText('Crea tu producto en un minuto')).toBeTruthy();
    expect(screen.getByText('Tienes un borrador sin terminar')).toBeTruthy();
    expect(screen.getByText(/«Queso Manchego»/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar borrador' }));
    expect(onResume).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Descartar y empezar de nuevo' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
