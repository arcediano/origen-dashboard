import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock @stripe/react-connect-js
vi.mock('@stripe/react-connect-js', () => ({
  loadConnectAndInitialize: vi.fn(),
  ConnectComponentsProvider: ({ children }: any) => <div>{children}</div>,
  ConnectAccountOnboarding: ({ onExit }: any) => (
    <button onClick={onExit}>Trigger onExit</button>
  ),
}));

vi.mock('@/lib/stripe/connect-appearance', () => ({
  stripeConnectAppearance: { test: 'appearance' },
  stripeConnectFonts: [{ cssSrc: 'test-font' }],
}));

vi.mock('@/lib/api/onboarding', () => ({
  saveStep6: vi.fn(),
}));

import { StripeConnectOnboarding } from '@/components/features/stripe/stripe-connect-onboarding';
import { saveStep6 } from '@/lib/api/onboarding';

describe('StripeConnectOnboarding', () => {
  const defaultProps = {
    stripeAccountId: 'acct_test123',
    source: 'onboarding' as const,
    onboardingContext: {
      email: 'producer@example.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      businessName: 'Test Business',
      website: 'https://example.com',
    },
    onVerified: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    vi.mocked(saveStep6).mockResolvedValue({ success: true } as any);
  });

  it('renderiza el componente embebido', () => {
    render(<StripeConnectOnboarding {...defaultProps} />);

    // Debe contener el botón que dispara onExit
    expect(screen.getByText('Trigger onExit')).toBeInTheDocument();
  });

  it('muestra error si stripeAccountId no es válido', () => {
    render(
      <StripeConnectOnboarding
        {...defaultProps}
        stripeAccountId={null}
      />
    );

    expect(screen.getByText(/No se pudo iniciar/)).toBeInTheDocument();
  });

  it('onExit no incluye stripeConnected en el payload (crítico para G2 fix)', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: true,
          },
        }),
      });

    const { getByText } = render(<StripeConnectOnboarding {...defaultProps} />);
    const exitButton = getByText('Trigger onExit');

    // Simular click en el botón que dispara onExit
    exitButton.click();

    await waitFor(() => {
      expect(saveStep6).toHaveBeenCalled();
    });

    // Verificación CRÍTICA: el payload NO debe incluir stripeConnected
    const payload = vi.mocked(saveStep6).mock.calls[0][0];
    expect(payload).not.toHaveProperty('stripeConnected');

    // Pero SÍ debe incluir otros campos
    expect(payload).toHaveProperty('stripeAccountId', 'acct_test123');
    expect(payload).toHaveProperty('acceptTerms', true);
  });

  it('onExit llama a onVerified después de guardar step6', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: true,
          },
        }),
      });

    const onVerified = vi.fn();
    const { getByText } = render(
      <StripeConnectOnboarding
        {...defaultProps}
        onVerified={onVerified}
      />
    );

    const exitButton = getByText('Trigger onExit');
    exitButton.click();

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled();
    });

    // Verificar que saveStep6 se llamó ANTES que onVerified
    const saveStep6Calls = vi.mocked(saveStep6).mock.invocationCallOrder;
    const onVerifiedCalls = onVerified.mock.invocationCallOrder;

    expect(saveStep6Calls[0]).toBeLessThan(onVerifiedCalls[0]);
  });

  it('maneja error en onExit sin fallar', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const onVerified = vi.fn();
    const { getByText } = render(
      <StripeConnectOnboarding
        {...defaultProps}
        onVerified={onVerified}
      />
    );

    const exitButton = getByText('Trigger onExit');
    exitButton.click();

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled();
    });

    // Debe continuar el flujo aunque haya error
    expect(onVerified).toHaveBeenCalled();
  });

  it('no guarda step6 si detailsSubmitted=false', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: false,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chargesEnabled: false,
            detailsSubmitted: false,
          },
        }),
      });

    const onVerified = vi.fn();
    const { getByText } = render(
      <StripeConnectOnboarding
        {...defaultProps}
        onVerified={onVerified}
      />
    );

    const exitButton = getByText('Trigger onExit');
    exitButton.click();

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled();
    });

    // saveStep6 NO debe ser llamado si detallesSubmitted es false
    expect(saveStep6).not.toHaveBeenCalled();
  });
});
