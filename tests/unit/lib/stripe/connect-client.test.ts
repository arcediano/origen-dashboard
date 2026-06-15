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
        source: 'onboarding',
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
        source: 'onboarding',
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

  it('ignora cache cuando el contexto de origen difiere', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        accountId: 'acct_ctx',
        url: 'https://connect.stripe.com/setup/s/onboarding-link',
        createdAt: Date.now(),
        source: 'onboarding',
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: { onboardingUrl: 'https://connect.stripe.com/setup/s/payments-link' },
      }),
    } as Response);

    await startStripeOnboarding({ stripeAccountId: 'acct_ctx', source: 'account_payments' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('https://connect.stripe.com/setup/s/payments-link');
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
      body: JSON.stringify({ accountId: 'acct_456', source: 'onboarding' }),
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
        source: 'onboarding',
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
        source: 'onboarding',
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

describe('openStripeDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(saveStep6).mockReset();
    vi.mocked(saveStep6).mockResolvedValue({ success: true });
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('abre dashboard cuando cuenta existe y details_submitted=true', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          dashboardUrl: 'https://connect.stripe.com/express/acct_existing123',
        },
      }),
    } as Response);

    await openStripeDashboard('acct_existing123');

    expect(window.location.href).toBe('https://connect.stripe.com/express/acct_existing123');
  });

  it('cae a startStripeOnboarding cuando requiresOnboarding=true', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    vi.mocked(saveStep6).mockResolvedValue({ success: true });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === '/api/stripe/connect/dashboard-link') {
        return {
          json: async () => ({
            success: true,
            data: { requiresOnboarding: true },
          }),
        } as Response;
      }
      if (url === '/api/stripe/connect/refresh') {
        return {
          json: async () => ({
            success: true,
            data: {
              onboardingUrl: 'https://connect.stripe.com/setup/s/onboarding-link',
            },
          }),
        } as Response;
      }
      return { json: async () => ({}) } as Response;
    });

    await openStripeDashboard('acct_pending123');

    // Debería haber llamado a /api/stripe/connect/refresh (por el fallback a startStripeOnboarding)
    const refreshCall = fetchSpy.mock.calls.find(
      call => (typeof call[0] === 'string' ? call[0] : call[0].url) === '/api/stripe/connect/refresh'
    );
    expect(refreshCall).toBeDefined();
  });

  it('lanza error específico cuando cuenta está restringida', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          restricted: true,
          disabledReason: 'rejected.other',
        },
      }),
    } as Response);

    await expect(openStripeDashboard('acct_restricted123')).rejects.toThrow(
      'Tu cuenta de Stripe está restringida. Contacta con soporte para más información.'
    );

    // Verificar que NO se llamó a POST /api/stripe/connect
    expect(window.location.href).toBe('');
  });

  it('lanza error cuando restricted=true pero no se redirige a crear cuenta', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          restricted: true,
        },
      }),
    } as Response);

    await expect(openStripeDashboard('acct_restricted123')).rejects.toThrow(
      'Tu cuenta de Stripe está restringida'
    );

    // Verificar que solo llamó a /api/stripe/connect/dashboard-link, no creó cuenta nueva
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/stripe/connect/dashboard-link');
  });

  it('caso 2 completo: productor conectado modifica cuenta bancaria sin perder stripeAccountId', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    const originalAccountId = 'acct_existing123';
    const dashboardUrl = 'https://connect.stripe.com/express/acct_existing123';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          dashboardUrl,
        },
      }),
    } as Response);

    await openStripeDashboard(originalAccountId);

    // Verificar que:
    // 1. Se llamó a dashboard-link con la cuenta existente
    expect(fetchSpy).toHaveBeenCalledWith('/api/stripe/connect/dashboard-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stripeAccountId: originalAccountId }),
    });

    // 2. Se redirigió al dashboard de la MISMA cuenta (no se creó una nueva)
    expect(window.location.href).toBe(dashboardUrl);

    // 3. En ningún momento se llamó a POST /api/stripe/connect (crear cuenta nueva)
    const createAccountCalls = fetchSpy.mock.calls.filter(
      call => (typeof call[0] === 'string' ? call[0] : call[0].url) === '/api/stripe/connect'
    );
    expect(createAccountCalls).toHaveLength(0);
  });

  it('caso pending: productor sin onboarding completo cae a startStripeOnboarding sin cambiar stripeAccountId', async () => {
    const { openStripeDashboard } = await import('@/lib/stripe/connect-client');

    vi.mocked(saveStep6).mockResolvedValue({ success: true });

    const existingAccountId = 'acct_pending123';
    let callCount = 0;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.url;
      callCount++;

      if (url === '/api/stripe/connect/dashboard-link') {
        return {
          json: async () => ({
            success: true,
            data: { requiresOnboarding: true },
          }),
        } as Response;
      }

      if (url === '/api/stripe/connect/refresh') {
        return {
          json: async () => ({
            success: true,
            data: {
              onboardingUrl: 'https://connect.stripe.com/setup/s/onboarding-link-for-pending',
            },
          }),
        } as Response;
      }

      return { json: async () => ({}) } as Response;
    });

    await openStripeDashboard(existingAccountId);

    // Verificar que se hizo al menos una llamada (dashboard-link)
    expect(fetchSpy).toHaveBeenCalled();

    // Verificar que el primer argumento fue dashboard-link
    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall[0]).toBe('/api/stripe/connect/dashboard-link');

    // Verificar que se incluyó el stripeAccountId en la primera llamada
    const dashboardBody = JSON.parse((firstCall[1] as RequestInit).body as string);
    expect(dashboardBody.stripeAccountId).toBe(existingAccountId);

    // Verificar que en ningún momento se creó una cuenta nueva
    const createAccountCalls = fetchSpy.mock.calls.filter(
      call => (typeof call[0] === 'string' ? call[0] : call[0].url) === '/api/stripe/connect'
    );
    expect(createAccountCalls).toHaveLength(0);

    // Verificar que saveStep6 no fue llamado (porque ya existe cuenta)
    expect(saveStep6).not.toHaveBeenCalled();
  });
});
