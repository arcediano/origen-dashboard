import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { pricingMock, checkoutMock, statusMock, confirmPaymentMock } = vi.hoisted(() => ({
  pricingMock: vi.fn(),
  checkoutMock: vi.fn(),
  statusMock: vi.fn(),
  confirmPaymentMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return {
    ...actual,
    getAiCreditsPricing: pricingMock,
    checkoutAiCredits: checkoutMock,
    getAiCreditPurchaseStatus: statusMock,
  };
});

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div data-testid="elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment: confirmPaymentMock }),
  useElements: () => ({}),
}));

import { AddCreditsModal } from '@/app/dashboard/products/components/ai-onboarding/AddCreditsModal';

const presets = [
  { credits: 1, unitPriceCents: 180, discountPct: 0, subtotalCents: 180, discountCents: 0, totalCents: 180, currency: 'eur' },
  { credits: 3, unitPriceCents: 180, discountPct: 15, subtotalCents: 540, discountCents: 81, totalCents: 459, currency: 'eur' },
  { credits: 5, unitPriceCents: 180, discountPct: 30, subtotalCents: 900, discountCents: 270, totalCents: 630, currency: 'eur' },
];

describe('AddCreditsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pricingMock.mockResolvedValue({ purchasedCredits: 0, presets });
  });

  it('carga y muestra las 3 cantidades preconfiguradas con su descuento', async () => {
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await waitFor(() => expect(pricingMock).toHaveBeenCalled());

    expect(await screen.findByText('1 crédito')).toBeTruthy();
    expect(screen.getByText('3 créditos')).toBeTruthy();
    expect(screen.getByText('5 créditos')).toBeTruthy();
    expect(screen.getByText('-15%')).toBeTruthy();
    expect(screen.getByText('-30%')).toBeTruthy();
    expect(screen.getByText('Sin descuento')).toBeTruthy();
  });

  it('muestra cuántos créditos ya tiene comprados el productor', async () => {
    pricingMock.mockResolvedValue({ purchasedCredits: 2, presets });
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    expect(await screen.findByText(/Ya tienes 2 créditos comprados disponibles/)).toBeTruthy();
  });

  it('solo ofrece las 3 cantidades fijas (sin opción de cantidad libre)', async () => {
    const user = userEvent.setup();
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await screen.findByText('1 crédito');

    expect(screen.queryByText('Otros')).toBeNull();
    const continueButton = screen.getByRole('button', { name: 'Continuar al pago' });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByText('5 créditos'));
    expect(continueButton).not.toBeDisabled();
  });

  it('inicia el checkout con la cantidad elegida y pasa al Payment Element', async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({
      purchaseId: 'purchase-1',
      clientSecret: 'pi_123_secret_abc',
      totalCents: 459,
      credits: 3,
      currency: 'eur',
    });
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await user.click(await screen.findByText('3 créditos'));
    await user.click(screen.getByRole('button', { name: 'Continuar al pago' }));

    expect(checkoutMock).toHaveBeenCalledWith(3);
    expect(await screen.findByTestId('payment-element')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Pagar 4,59/ })).toBeTruthy();
  });

  it('confirma el pago, sondea el estado hasta SUCCEEDED y avisa de la compra', async () => {
    const user = userEvent.setup();
    const onCreditsPurchased = vi.fn();
    checkoutMock.mockResolvedValue({
      purchaseId: 'purchase-1',
      clientSecret: 'pi_123_secret_abc',
      totalCents: 459,
      credits: 3,
      currency: 'eur',
    });
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
    statusMock.mockResolvedValueOnce({ status: 'PENDING', credits: 3 });
    statusMock.mockResolvedValueOnce({ status: 'SUCCEEDED', credits: 3 });

    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={onCreditsPurchased} />);
    await user.click(await screen.findByText('3 créditos'));
    await user.click(screen.getByRole('button', { name: 'Continuar al pago' }));
    await user.click(await screen.findByRole('button', { name: /Pagar/ }));

    await waitFor(() => expect(onCreditsPurchased).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(statusMock).toHaveBeenCalledWith('purchase-1');
    expect(await screen.findByText('Créditos añadidos a tu cuenta.')).toBeTruthy();
  });

  it('un error de Stripe al confirmar se muestra sin avanzar', async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({
      purchaseId: 'purchase-1',
      clientSecret: 'pi_123_secret_abc',
      totalCents: 180,
      credits: 1,
      currency: 'eur',
    });
    confirmPaymentMock.mockResolvedValue({ error: { message: 'Tarjeta rechazada.' } });

    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await user.click(await screen.findByText('1 crédito'));
    await user.click(screen.getByRole('button', { name: 'Continuar al pago' }));
    await user.click(await screen.findByRole('button', { name: /Pagar/ }));

    expect(await screen.findByText('Tarjeta rechazada.')).toBeTruthy();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
