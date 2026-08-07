import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openStripeDashboard } from '@/lib/stripe/connect-client';

describe('openStripeDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('abre dashboard cuando cuenta existe y details_submitted=true', async () => {
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

  it('lanza error cuando requiresOnboarding=true (flujo embebido)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: true,
        data: { requiresOnboarding: true },
      }),
    } as Response);

    await expect(openStripeDashboard('acct_pending123')).rejects.toThrow(
      'La cuenta debe completar el onboarding de Stripe antes de acceder al dashboard'
    );

    // No debe redirigir a ningún lado
    expect(window.location.href).toBe('');
  });

  it('lanza error específico cuando cuenta está restringida', async () => {
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

    // Verificar que NO se redirigió
    expect(window.location.href).toBe('');
  });

  it('lanza error cuando restricted=true pero no se redirige a crear cuenta', async () => {
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

    // Verificar que solo llamó a /api/stripe/connect/dashboard-link, sin crear cuenta nueva
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/stripe/connect/dashboard-link');
  });

  it('caso completo: productor conectado modifica cuenta bancaria sin perder stripeAccountId', async () => {
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
  });

  it('lanza error genérico cuando fetch falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Error al abrir panel',
      }),
    } as Response);

    await expect(openStripeDashboard('acct_error')).rejects.toThrow(
      'Error al abrir panel'
    );
  });
});
