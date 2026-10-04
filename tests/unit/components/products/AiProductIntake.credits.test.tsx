import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { draftMock, pricingMock } = vi.hoisted(() => ({
  draftMock: vi.fn(),
  pricingMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return {
    ...actual,
    draftProduct: draftMock,
    getAiCreditsPricing: pricingMock,
  };
});

vi.mock('@/lib/ai-assist/resize-label-image', () => ({
  resizeLabelImage: vi.fn().mockResolvedValue({ mediaType: 'image/jpeg', data: 'QUJD' }),
}));

vi.mock('@/lib/validations/image-quality', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/validations/image-quality')>();
  return { ...actual, getImageDimensions: vi.fn().mockResolvedValue({ width: 2000, height: 2000 }) };
});

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: () => null,
  PaymentElement: () => null,
  useStripe: () => null,
  useElements: () => null,
}));

import { AiAssistError } from '@/lib/api/ai-assist';
import { AiProductIntake } from '@/app/dashboard/products/components/ai-onboarding/AiProductIntake';

const base = { assistKey: 'clave-12345', quota: { used: 3, total: 3 }, onDraft: vi.fn(), onManual: vi.fn() };

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(['x'], 'producto.jpg', { type: 'image/jpeg' });
  const photoInput = document.querySelector('input[type="file"][accept^="image/jpeg"]') as HTMLInputElement;
  await user.upload(photoInput, file);
  const textarea = await screen.findByPlaceholderText(/Queso curado de oveja/);
  await user.type(textarea, 'Queso curado de oveja, 12 meses, elaborado en Soria.');
  await user.click(screen.getByRole('button', { name: 'Crear con IA' }));
}

describe('AiProductIntake — cupo agotado y compra de créditos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pricingMock.mockResolvedValue({ purchasedCredits: 0, presets: [] });
  });

  it('al agotar el cupo muestra el botón "Comprar créditos" y abre el modal', async () => {
    draftMock.mockRejectedValue(
      new AiAssistError('cupo agotado', 'AI_PRODUCER_QUOTA_EXCEEDED', 403),
    );
    const user = userEvent.setup();
    render(<AiProductIntake {...base} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(draftMock).toHaveBeenCalled());
    const buyButton = await screen.findByRole('button', { name: 'Comprar créditos' });

    await user.click(buyButton);
    await waitFor(() => expect(pricingMock).toHaveBeenCalled());
  });

  it('un error distinto (p. ej. tope mensual) no muestra el botón de comprar créditos', async () => {
    draftMock.mockRejectedValue(new AiAssistError('tope mensual', 'AI_MONTHLY_CAP_REACHED', 503));
    const user = userEvent.setup();
    render(<AiProductIntake {...base} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(draftMock).toHaveBeenCalled());
    await screen.findByText(/no está disponible ahora mismo/);
    expect(screen.queryByRole('button', { name: 'Comprar créditos' })).toBeNull();
  });
});
