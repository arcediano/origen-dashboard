import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/onboarding', () => ({
  saveStep6: vi.fn(),
}));

import { saveStep6 } from '@/lib/api/onboarding';
import { startStripeOnboarding } from '@/lib/stripe/connect-client';

const LOCAL_STORAGE_KEY = 'origen:stripe:onboarding-link';

describe('startStripeOnboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(saveStep6).mockReset();
    vi.mocked(saveStep6).mockResolvedValue({ success: true });
    window.localStorage.clear();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('reutiliza account link cacheado reciente para la misma cuenta', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        accountId: 'acct_123',
        url: 'https://connect.stripe.com/setup/s/recent-link',
        createdAt: Date.now(),
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await startStripeOnboarding({ stripeAccountId: 'acct_123' });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/recent-link');
  });

  it('ignora cache cuando no se conoce stripeAccountId y crea flujo nuevo', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        accountId: 'acct_prev',
        url: 'https://connect.stripe.com/setup/s/recent-link',
        createdAt: Date.now(),
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          accountId: 'acct_new',
          onboardingUrl: 'https://connect.stripe.com/setup/s/create-new-link',
        },
      }),
    } as Response);

    await startStripeOnboarding({ businessName: 'Nueva Tienda' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/stripe/connect', expect.any(Object));
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/create-new-link');
  });

  it('renueva account link cuando no hay cache valido y existe stripeAccountId', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: { onboardingUrl: 'https://connect.stripe.com/setup/s/new-refresh-link' },
      }),
    } as Response);

    await startStripeOnboarding({ stripeAccountId: 'acct_456' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/stripe/connect/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'acct_456' }),
    });
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/new-refresh-link');
  });

  it('crea cuenta y guarda step6 cuando no existe stripeAccountId', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          accountId: 'acct_789',
          onboardingUrl: 'https://connect.stripe.com/setup/s/create-link',
        },
      }),
    } as Response);

    await startStripeOnboarding({
      email: 'producer@example.com',
      firstName: 'Ana',
      lastName: 'Ruiz',
      businessName: 'Huerta Ana',
      website: 'https://huerta.example.com',
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'producer@example.com',
        firstName: 'Ana',
        lastName: 'Ruiz',
        businessName: 'Huerta Ana',
        website: 'https://huerta.example.com',
      }),
    });

    expect(saveStep6).toHaveBeenCalledWith({
      stripeConnected: false,
      stripeAccountId: 'acct_789',
      acceptTerms: false,
    });
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/create-link');
  });

  it('descarta cache expirado y renueva link', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        accountId: 'acct_expired',
        url: 'https://connect.stripe.com/setup/s/expired-link',
        createdAt: Date.now() - 10 * 60 * 1000,
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: { onboardingUrl: 'https://connect.stripe.com/setup/s/refreshed-after-expire' },
      }),
    } as Response);

    await startStripeOnboarding({ stripeAccountId: 'acct_expired' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/refreshed-after-expire');
  });

  it('falla si refresh devuelve URL no confiable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: { onboardingUrl: 'https://evil.example.com/phishing' },
      }),
    } as Response);

    await expect(
      startStripeOnboarding({ stripeAccountId: 'acct_unsafe' }),
    ).rejects.toThrow('URL de Stripe no válida');
  });

  it('propaga error cuando refresh falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Cuenta no encontrada',
      }),
    } as Response);

    await expect(
      startStripeOnboarding({ stripeAccountId: 'acct_missing' }),
    ).rejects.toThrow('Cuenta no encontrada');
  });

  it('propaga error cuando create falla y no persiste step6', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Stripe no disponible',
      }),
    } as Response);

    await expect(startStripeOnboarding({ businessName: 'Demo' })).rejects.toThrow('Stripe no disponible');
    expect(saveStep6).not.toHaveBeenCalled();
  });

  it('propaga error si saveStep6 falla y evita redireccion', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          accountId: 'acct_save_fail',
          onboardingUrl: 'https://connect.stripe.com/setup/s/link-after-save',
        },
      }),
    } as Response);

    vi.mocked(saveStep6).mockRejectedValueOnce(new Error('Fallo al guardar Step6'));

    await expect(startStripeOnboarding({ businessName: 'Demo' })).rejects.toThrow('Fallo al guardar Step6');
    expect(window.location.href).toBe('');
  });
});
