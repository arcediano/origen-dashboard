import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { quotaMock, reviewMock } = vi.hoisted(() => ({
  quotaMock: vi.fn(),
  reviewMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return { ...actual, getAiAssistQuota: quotaMock, reviewProfile: reviewMock };
});

// AddCreditsModal arrastra Stripe (loadStripe, Elements...) -- se stubea: ya
// tiene su propio test, aquí solo interesa que ProfileAiReviewButton lo abra
// cuando toca.
vi.mock('@/app/dashboard/products/components/ai-onboarding/AddCreditsModal', () => ({
  AddCreditsModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-credits-modal" /> : null,
}));

import { ProfileAiReviewButton } from '@/app/dashboard/profile/components/ProfileAiReviewButton';

const FIELDS = { tagline: 'Miel de mi pueblo' };

describe('ProfileAiReviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
  });

  it('deshabilitado si no hay ningún campo con texto', () => {
    render(<ProfileAiReviewButton fields={{}} onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Mejorar con IA' })).toBeDisabled();
  });

  it('pide confirmación de gasto de crédito antes de llamar a la IA', async () => {
    render(<ProfileAiReviewButton fields={FIELDS} onApply={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await waitFor(() => expect(quotaMock).toHaveBeenCalled());
    expect(screen.getByText('Revisar con el asistente de IA')).toBeInTheDocument();
    expect(reviewMock).not.toHaveBeenCalled();
  });

  it('sin créditos, abre el modal de compra en vez de confirmar gasto', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 5, total: 5 });
    render(<ProfileAiReviewButton fields={FIELDS} onApply={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await waitFor(() => expect(screen.getByTestId('add-credits-modal')).toBeInTheDocument());
    expect(screen.queryByText('Revisar con el asistente de IA')).not.toBeInTheDocument();
  });

  it('al confirmar, muestra las sugerencias y aplica solo las aceptadas', async () => {
    reviewMock.mockResolvedValue({
      suggestions: [
        { field: 'tagline', current: 'Miel de mi pueblo', suggested: 'Miel cruda de mi pueblo', reason: 'Más concreto' },
      ],
    });
    const onApply = vi.fn();
    render(<ProfileAiReviewButton fields={FIELDS} onApply={onApply} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gastar 1 crédito y revisar' }));

    await screen.findByText('Sugerencias del asistente');
    expect(screen.getByText('Miel cruda de mi pueblo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(onApply).toHaveBeenCalledWith('tagline', 'Miel cruda de mi pueblo');
    expect(screen.getByText('Aplicada')).toBeInTheDocument();
  });

  it('descartar una sugerencia no la aplica al formulario', async () => {
    reviewMock.mockResolvedValue({
      suggestions: [
        { field: 'tagline', current: 'Miel de mi pueblo', suggested: 'Miel cruda de mi pueblo', reason: 'Más concreto' },
      ],
    });
    const onApply = vi.fn();
    render(<ProfileAiReviewButton fields={FIELDS} onApply={onApply} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gastar 1 crédito y revisar' }));
    await screen.findByText('Sugerencias del asistente');

    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText('Descartada')).toBeInTheDocument();
  });

  it('sin sugerencias, avisa que los textos ya están bien', async () => {
    reviewMock.mockResolvedValue({ suggestions: [] });
    render(<ProfileAiReviewButton fields={FIELDS} onApply={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gastar 1 crédito y revisar' }));

    await screen.findByText('Tus textos ya están bien');
  });
});
