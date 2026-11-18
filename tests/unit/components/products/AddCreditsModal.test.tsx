import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { pricingMock, checkoutMock, statusMock, confirmPaymentMock, cardsMock, savedCheckoutMock, setDefaultMock, nextActionMock } =
  vi.hoisted(() => ({
    pricingMock: vi.fn(),
    checkoutMock: vi.fn(),
    statusMock: vi.fn(),
    confirmPaymentMock: vi.fn(),
    cardsMock: vi.fn(),
    savedCheckoutMock: vi.fn(),
    setDefaultMock: vi.fn(),
    nextActionMock: vi.fn(),
  }));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return {
    ...actual,
    getAiCreditsPricing: pricingMock,
    checkoutAiCredits: checkoutMock,
    getAiCreditPurchaseStatus: statusMock,
    getAiCreditCards: cardsMock,
    checkoutAiCreditsWithSavedCard: savedCheckoutMock,
    setAiCreditDefaultCard: setDefaultMock,
  };
});

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({ handleNextAction: nextActionMock }) }));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div data-testid="elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment: confirmPaymentMock }),
  useElements: () => ({}),
}));

import { AddCreditsModal } from '@/app/dashboard/products/components/ai-onboarding/AddCreditsModal';

// Precios 2026-10-08: 1 crédito = 1,00 €; -15% desde 5 créditos; -30% desde 10.
const presets = [
  { credits: 1, unitPriceCents: 100, discountPct: 0, subtotalCents: 100, discountCents: 0, totalCents: 100, currency: 'eur' },
  { credits: 5, unitPriceCents: 100, discountPct: 15, subtotalCents: 500, discountCents: 75, totalCents: 425, currency: 'eur' },
  { credits: 10, unitPriceCents: 100, discountPct: 30, subtotalCents: 1000, discountCents: 300, totalCents: 700, currency: 'eur' },
];

describe('AddCreditsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pricingMock.mockResolvedValue({ purchasedCredits: 0, presets });
    cardsMock.mockResolvedValue({ defaultId: null, methods: [] });
    setDefaultMock.mockResolvedValue(undefined);
  });

  it('carga y muestra las 3 cantidades preconfiguradas con su descuento', async () => {
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await waitFor(() => expect(pricingMock).toHaveBeenCalled());

    expect(await screen.findByText('1 crédito')).toBeTruthy();
    expect(screen.getByText('5 créditos')).toBeTruthy();
    expect(screen.getByText('10 créditos')).toBeTruthy();
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
      totalCents: 425,
      credits: 5,
      currency: 'eur',
    });
    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
    await user.click(await screen.findByText('5 créditos'));
    await user.click(screen.getByRole('button', { name: 'Continuar al pago' }));

    expect(checkoutMock).toHaveBeenCalledWith(5);
    expect(await screen.findByTestId('payment-element')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Pagar 4,25/ })).toBeTruthy();
  });

  it('confirma el pago, sondea el estado hasta SUCCEEDED y avisa de la compra', async () => {
    const user = userEvent.setup();
    const onCreditsPurchased = vi.fn();
    checkoutMock.mockResolvedValue({
      purchaseId: 'purchase-1',
      clientSecret: 'pi_123_secret_abc',
      totalCents: 425,
      credits: 5,
      currency: 'eur',
    });
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
    statusMock.mockResolvedValueOnce({ status: 'PENDING', credits: 5 });
    statusMock.mockResolvedValueOnce({ status: 'SUCCEEDED', credits: 5 });

    render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={onCreditsPurchased} />);
    await user.click(await screen.findByText('5 créditos'));
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
      totalCents: 100,
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

  describe('pago de un clic con tarjeta guardada', () => {
    const visa = { id: 'pm_1', brand: 'visa', last4: '4242', expMonth: 8, expYear: 2099 };
    const master = { id: 'pm_2', brand: 'mastercard', last4: '0005', expMonth: 1, expYear: 2099 };

    beforeEach(() => {
      cardsMock.mockResolvedValue({ defaultId: 'pm_1', methods: [visa, master] });
    });

    it('muestra la tarjeta guardada (sin el número completo) y paga con un solo botón', async () => {
      const onPurchased = vi.fn();
      savedCheckoutMock.mockResolvedValue({
        purchaseId: 'pur_1', status: 'succeeded', clientSecret: null, totalCents: 425, credits: 5, currency: 'eur',
      });
      const user = userEvent.setup();
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={onPurchased} />);

      expect(await screen.findByText('Visa •••• 4242')).toBeTruthy();
      expect(screen.queryByTestId('payment-element')).toBeNull();
      await user.click(await screen.findByText('5 créditos'));
      await user.click(screen.getByTestId('pay-saved'));

      await waitFor(() => expect(savedCheckoutMock).toHaveBeenCalledWith(5, 'pm_1'));
      expect(checkoutMock).not.toHaveBeenCalled();
      await waitFor(() => expect(onPurchased).toHaveBeenCalled());
      expect(await screen.findByText('Créditos añadidos a tu cuenta.')).toBeTruthy();
    });

    it('el botón muestra el importe a pagar y no cobra sin elegir cantidad', async () => {
      const user = userEvent.setup();
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
      await screen.findByText('Visa •••• 4242');
      expect((screen.getByTestId('pay-saved') as HTMLButtonElement).disabled).toBe(true);
      await user.click(await screen.findByText('10 créditos'));
      expect(screen.getByTestId('pay-saved').textContent).toMatch(/Pagar/);
      expect(savedCheckoutMock).not.toHaveBeenCalled();
    });

    it('«Cambiar» permite elegir otra tarjeta guardada y la deja como predeterminada', async () => {
      const user = userEvent.setup();
      savedCheckoutMock.mockResolvedValue({
        purchaseId: 'pur_2', status: 'succeeded', clientSecret: null, totalCents: 100, credits: 1, currency: 'eur',
      });
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
      await screen.findByText('Visa •••• 4242');
      await user.click(screen.getByTestId('change-card'));
      await user.click(screen.getByRole('radio', { name: /Mastercard •••• 0005/ }));
      expect(setDefaultMock).toHaveBeenCalledWith('pm_2');
      expect(await screen.findByText('Mastercard •••• 0005')).toBeTruthy();
      await user.click(await screen.findByText('1 crédito'));
      await user.click(screen.getByTestId('pay-saved'));
      await waitFor(() => expect(savedCheckoutMock).toHaveBeenCalledWith(1, 'pm_2'));
    });

    it('«Usar otra tarjeta» vuelve al flujo con tarjeta nueva (Payment Element)', async () => {
      const user = userEvent.setup();
      checkoutMock.mockResolvedValue({
        purchaseId: 'pur_3', clientSecret: 'sec', totalCents: 100, credits: 1, currency: 'eur',
      });
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
      await screen.findByText('Visa •••• 4242');
      await user.click(screen.getByTestId('change-card'));
      await user.click(screen.getByTestId('use-new-card'));
      await user.click(await screen.findByText('1 crédito'));
      await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
      expect(await screen.findByTestId('payment-element')).toBeTruthy();
    });

    it('si el banco pide 3D Secure completa la autenticación en el navegador y espera la confirmación', async () => {
      savedCheckoutMock.mockResolvedValue({
        purchaseId: 'pur_4', status: 'requires_action', clientSecret: 'sec_4', totalCents: 100, credits: 1, currency: 'eur',
      });
      nextActionMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
      statusMock.mockResolvedValue({ status: 'SUCCEEDED', credits: 1 });
      const onPurchased = vi.fn();
      const user = userEvent.setup();
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={onPurchased} />);
      await screen.findByText('Visa •••• 4242');
      await user.click(await screen.findByText('1 crédito'));
      await user.click(screen.getByTestId('pay-saved'));
      await waitFor(() => expect(nextActionMock).toHaveBeenCalledWith({ clientSecret: 'sec_4' }));
      await waitFor(() => expect(onPurchased).toHaveBeenCalled());
    });

    it('si el banco rechaza el pago muestra el motivo y deja probar con otra tarjeta', async () => {
      savedCheckoutMock.mockRejectedValue(new Error('Tu banco ha rechazado el pago con esta tarjeta. Prueba con otra tarjeta.'));
      const onPurchased = vi.fn();
      const user = userEvent.setup();
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={onPurchased} />);
      await screen.findByText('Visa •••• 4242');
      await user.click(await screen.findByText('1 crédito'));
      await user.click(screen.getByTestId('pay-saved'));
      expect(await screen.findByText(/rechazado el pago/)).toBeTruthy();
      expect(onPurchased).not.toHaveBeenCalled();
      expect(screen.getByTestId('change-card')).toBeTruthy();
    });

    it('una tarjeta caducada avisa y no permite cobrar', async () => {
      cardsMock.mockResolvedValue({
        defaultId: 'pm_old',
        methods: [{ id: 'pm_old', brand: 'visa', last4: '1111', expMonth: 1, expYear: 2020 }],
      });
      const user = userEvent.setup();
      render(<AddCreditsModal open onOpenChange={vi.fn()} onCreditsPurchased={vi.fn()} />);
      await screen.findByText('Visa •••• 1111');
      await user.click(await screen.findByText('1 crédito'));
      expect(screen.getByText(/ha caducado/)).toBeTruthy();
      expect((screen.getByTestId('pay-saved') as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
