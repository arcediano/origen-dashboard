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

const base = { assistKey: 'clave-12345', onDraft: vi.fn(), onManual: vi.fn() };

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

  it('con cupo agotado (de antemano, sin intentar generar) muestra el aviso y deshabilita "Crear con IA"', async () => {
    const user = userEvent.setup();
    render(<AiProductIntake {...base} quota={{ used: 3, total: 3 }} />);

    expect(await screen.findByText('No te quedan créditos del asistente')).toBeTruthy();
    const createButton = screen.getByRole('button', { name: 'Crear con IA' });
    expect(createButton).toBeDisabled();
    expect(draftMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Recargar créditos' }));
    await waitFor(() => expect(pricingMock).toHaveBeenCalled());
  });

  it('con cupo disponible no muestra el aviso y "Crear con IA" queda habilitado al rellenar', async () => {
    render(<AiProductIntake {...base} quota={{ used: 1, total: 3 }} />);
    expect(screen.queryByText('No te quedan créditos del asistente')).toBeNull();
  });

  it('muestra de forma visual los créditos que quedan (sin gastados ni desglose) y que 1 crédito = 1 producto', () => {
    render(<AiProductIntake {...base} quota={{ used: 2, total: 5, free: 3, purchased: 2 }} />);
    expect(screen.getByTestId('ai-credits-remaining').textContent).toBe('3');
    const panel = screen.getByTestId('ai-credits-panel');
    expect(panel.getAttribute('data-state')).toBe('available');
    expect(screen.getByTestId('ai-credits-tokens').children).toHaveLength(3);
    expect(screen.getByTestId('ai-credits-equivalence').textContent).toMatch(/1 crédito\s*=\s*1 producto/);
    expect(panel.textContent).not.toMatch(/usado|gratis|comprado/i);
  });

  it('si el backend rechaza por cupo pese a que el cupo mostrado aún tenía margen, muestra el aviso reactivo', async () => {
    draftMock.mockRejectedValue(
      new AiAssistError('cupo agotado', 'AI_PRODUCER_QUOTA_EXCEEDED', 403),
    );
    const user = userEvent.setup();
    render(<AiProductIntake {...base} quota={{ used: 1, total: 3 }} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(draftMock).toHaveBeenCalled());
    const buyButton = await screen.findByRole('button', { name: 'Recargar créditos' });

    await user.click(buyButton);
    await waitFor(() => expect(pricingMock).toHaveBeenCalled());
  });

  it('un error distinto (p. ej. tope mensual) no marca los créditos como agotados', async () => {
    draftMock.mockRejectedValue(new AiAssistError('tope mensual', 'AI_MONTHLY_CAP_REACHED', 503));
    const user = userEvent.setup();
    render(<AiProductIntake {...base} quota={{ used: 1, total: 3 }} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(draftMock).toHaveBeenCalled());
    await screen.findByText(/no está disponible ahora mismo/);
    expect(screen.getByTestId('ai-credits-panel').getAttribute('data-state')).toBe('available');
  });
});
