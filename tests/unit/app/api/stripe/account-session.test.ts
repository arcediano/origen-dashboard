import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    vi.resetAllMocks();
  });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: 'acct_owner123',
          },
        },
      }),
    });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: existingAccountId,
          },
        },
      }),
    });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: null,
          },
        },
      }),
    });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: 'acct_123',
          },
        },
      }),
    });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: 'acct_user123',
          },
        },
      }),
    });

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          payment: {
            stripeAccountId: 'acct_123',
          },
        },
      }),
    });

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
});
