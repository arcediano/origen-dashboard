import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/stripe/server', () => ({
  createConnectAccount: vi.fn(),
  createAccountSession: vi.fn(),
}));

import { cookies } from 'next/headers';
import { createConnectAccount, createAccountSession } from '@/lib/stripe/server';
import { POST } from '@/app/api/stripe/account-session/route';

describe('POST /api/stripe/account-session', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper para configurar mocks de fetch distinguiendo por URL.
   * Esto evita falsos positivos cuando ahora hay dos endpoints de gateway:
   * 1. /api/v1/producers/onboarding/data
   * 2. /api/v1/producers/onboarding/step/link-stripe-account
   */
  const setupFetchMockForNewAccount = (newAccountId: string) => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('onboarding/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              payment: {
                stripeAccountId: null, // Productor nuevo, sin cuenta
              },
            },
          }),
        });
      }
      if (url.includes('link-stripe-account')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  };

  const setupFetchMockForExistingAccount = (accountId: string) => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('onboarding/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              payment: {
                stripeAccountId: accountId,
              },
            },
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  };

  it('devuelve 401 sin cookie accessToken', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const request = {
      json: async () => ({ accountId: 'acct_123' }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No autenticado');
  });

  it('devuelve 403 cuando accountId no coincide con stripeAccountId del productor', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForExistingAccount('acct_owner123');

    const request = {
      json: async () => ({ accountId: 'acct_different' }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('no autorizada');
  });

  it('reutiliza stripeAccountId existente cuando no viene accountId', async () => {
    const existingAccountId = 'acct_existing123';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForExistingAccount(existingAccountId);

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_existing',
    } as any);

    const request = {
      json: async () => ({
        email: 'producer@example.com',
        businessName: 'Test Business',
      }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.accountId).toBe(existingAccountId);
    expect(createConnectAccount).not.toHaveBeenCalled();
    expect(createAccountSession).toHaveBeenCalledWith(existingAccountId);
  });

  it('crea cuenta nueva cuando productor no tiene stripeAccountId', async () => {
    const newAccountId = 'acct_new123';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForNewAccount(newAccountId);

    vi.mocked(createConnectAccount).mockResolvedValue({
      id: newAccountId,
    } as any);

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_new',
    } as any);

    const request = {
      json: async () => ({
        email: 'producer@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: 'Nueva Tienda',
        website: 'https://tienda.example.com',
      }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.accountId).toBe(newAccountId);
    expect(createConnectAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'producer@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: 'Nueva Tienda',
        website: 'https://tienda.example.com',
      })
    );
    expect(createAccountSession).toHaveBeenCalledWith(newAccountId);
  });

  it('nunca loguea clientSecret en respuesta', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForExistingAccount('acct_123');

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_secret',
    } as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = {
      json: async () => ({ accountId: 'acct_123' }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(data.data.clientSecret).toBe('cs_test_secret');
    // Verificar que el cliente no loguea el secret
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('cs_test_secret')
    );

    consoleSpy.mockRestore();
  });

  it('devuelve 400 cuando accountId es inválido', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForExistingAccount('acct_user123');

    const request = {
      json: async () => ({ accountId: 'invalid_account' }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('inválido');
  });

  it('devuelve 500 con mensaje detallado en dev cuando hay error', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForExistingAccount('acct_123');

    const testError = new Error('Stripe API error');
    vi.mocked(createAccountSession).mockRejectedValue(testError);

    const request = {
      json: async () => ({ accountId: 'acct_123' }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('onboarding');
  });

  // ─── NUEVOS TESTS — Etapa 4 del plan ───────────────────────────────────────

  it('vincula el accountId recien creado antes de devolver el clientSecret', async () => {
    const newAccountId = 'acct_brand_new_link';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    setupFetchMockForNewAccount(newAccountId);

    vi.mocked(createConnectAccount).mockResolvedValue({
      id: newAccountId,
    } as any);

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_link_success',
    } as any);

    const request = {
      json: async () => ({
        email: 'test@example.com',
        businessName: 'Test Link Biz',
      }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.accountId).toBe(newAccountId);

    // Verificar que fetch fue llamado a link-stripe-account
    const linkCalls = fetchMock.mock.calls.filter((call: any) =>
      call[0]?.includes('link-stripe-account')
    );
    expect(linkCalls.length).toBeGreaterThan(0);

    // Verificar que el body de la llamada de link incluye el stripeAccountId
    const linkCall = linkCalls[0];
    const bodyStr = linkCall[1]?.body as string;
    expect(bodyStr).toContain(newAccountId);
  });

  it('devuelve 500 y no expone clientSecret si falla el vinculo', async () => {
    const newAccountId = 'acct_link_fail';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    // Mock que falla en el vinculo
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('onboarding/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              payment: {
                stripeAccountId: null,
              },
            },
          }),
        });
      }
      if (url.includes('link-stripe-account')) {
        // Simular que el vinculo falla
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    vi.mocked(createConnectAccount).mockResolvedValue({
      id: newAccountId,
    } as any);

    // No debe llegar a createAccountSession porque el vinculo falla antes
    const createSessionSpy = vi.fn();
    vi.mocked(createAccountSession).mockImplementation(createSessionSpy);

    const request = {
      json: async () => ({
        email: 'fail@example.com',
        businessName: 'Fail Biz',
      }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/vinculo|Stripe|error/i);

    // Verificar que createAccountSession NUNCA fue llamado
    // porque la excepción del vinculo ocurre antes de eso
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('refetch a mitad de onboarding: 1a llamada crea y vincula, 2a reutiliza', async () => {
    const newAccountId = 'acct_refetchtest123';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    let onboardingDataCalls = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('onboarding/data')) {
        onboardingDataCalls++;
        // 1a llamada: no tiene stripeAccountId
        // Siguientes: sí tiene (simulando que BD fue actualizada)
        if (onboardingDataCalls === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                payment: {
                  stripeAccountId: null,
                },
              },
            }),
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                payment: {
                  stripeAccountId: newAccountId,
                },
              },
            }),
          });
        }
      }
      if (url.includes('link-stripe-account')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    vi.mocked(createConnectAccount).mockResolvedValue({
      id: newAccountId,
    } as any);

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_refetch_1a',
    } as any);

    // Primera llamada: sin accountId (crea cuenta nueva)
    const request1 = {
      json: async () => ({
        email: 'refetch@example.com',
        businessName: 'Refetch Test',
      }),
    } as NextRequest;

    const response1 = await POST(request1);
    const data1 = await response1.json() as any;

    expect(response1.status).toBe(200);
    expect(data1.data.accountId).toBe(newAccountId);
    expect(createConnectAccount).toHaveBeenCalledTimes(1);

    // Segunda llamada: CON accountId (refetch tras expiración del client_secret)
    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_refetch_2a',
    } as any);

    const request2 = {
      json: async () => ({
        accountId: newAccountId, // ← Aquí viene el accountId de la 1a sesión
      }),
    } as NextRequest;

    const response2 = await POST(request2);
    const data2 = await response2.json() as any;

    expect(response2.status).toBe(200);
    expect(data2.success).toBe(true);
    expect(data2.data.accountId).toBe(newAccountId);
    // createConnectAccount no debe haber sido llamado 2a vez
    expect(createConnectAccount).toHaveBeenCalledTimes(1);
    // La 2a llamada debe reutilizar la cuenta
    expect(vi.mocked(createAccountSession)).toHaveBeenCalledWith(newAccountId);
  });

  it('reutilización tras abandono: segunda sesión sin accountId reutiliza la ya vinculada', async () => {
    const linkedAccountId = 'acct_reuse_abandoned';

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    // Simular que la cuenta ya fue vinculada en BD desde la sesión anterior
    setupFetchMockForExistingAccount(linkedAccountId);

    vi.mocked(createAccountSession).mockResolvedValue({
      clientSecret: 'cs_test_reuse',
    } as any);

    const request = {
      json: async () => ({
        email: 'reuse@example.com',
        businessName: 'Reuse Biz',
      }),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.accountId).toBe(linkedAccountId);
    // createConnectAccount NO debe ser llamado porque la cuenta ya existe
    expect(createConnectAccount).not.toHaveBeenCalled();
  });
});
