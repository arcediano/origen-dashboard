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

    await screen.findByText('Tu perfil ya está bien');
  });

  const PHOTO = {
    collection: 'teamPhotos' as const,
    itemId: 'item-1',
    key: 'producers/1/documents/team/a.jpg',
    url: 'https://cdn.test/a.jpg',
  };

  it('variant="banner" muestra un aviso prominente con los créditos restantes', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
    render(<ProfileAiReviewButton variant="banner" fields={FIELDS} onApply={vi.fn()} />);

    expect(screen.getByText('Mejora tu perfil con IA')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('profile-ai-review-banner-credits')).toHaveTextContent('4'));
  });

  it('deshabilitado sin texto NI fotos', () => {
    render(<ProfileAiReviewButton fields={{}} onApply={vi.fn()} photos={[]} />);
    expect(screen.getByRole('button', { name: 'Mejorar con IA' })).toBeDisabled();
  });

  it('habilitado con solo fotos, aunque no haya texto', () => {
    render(<ProfileAiReviewButton fields={{}} onApply={vi.fn()} photos={[PHOTO]} />);
    expect(screen.getByRole('button', { name: 'Mejorar con IA' })).not.toBeDisabled();
  });

  it('al aceptar una sugerencia de foto, la convierte en File y llama a onApplyPhoto', async () => {
    reviewMock.mockResolvedValue({
      suggestions: [],
      photoSuggestions: [{ collection: 'teamPhotos', key: PHOTO.key, after: 'data:image/jpeg;base64,Zm9v' }],
    });
    const onApplyPhoto = vi.fn();
    render(
      <ProfileAiReviewButton
        fields={{}}
        onApply={vi.fn()}
        photos={[PHOTO]}
        onApplyPhoto={onApplyPhoto}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mejorar con IA' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gastar 1 crédito y revisar' }));
    await screen.findByText('Sugerencias del asistente');

    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => expect(onApplyPhoto).toHaveBeenCalledTimes(1));
    const [collection, itemId, file] = onApplyPhoto.mock.calls[0];
    expect(collection).toBe('teamPhotos');
    expect(itemId).toBe('item-1');
    expect(file).toBeInstanceOf(File);
  });
});
