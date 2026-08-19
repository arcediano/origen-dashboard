import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

// Mock del módulo stripe
vi.mock('stripe', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockRetrieve = vi.fn();
  return {
    // Función normal, no arrow — `new Stripe(...)` requiere un constructor
    // válido; una arrow function nunca puede invocarse con `new` (limitación
    // del lenguaje, no de vitest).
    default: vi.fn(function () {
      return { accounts: { create: mockCreate, update: mockUpdate, retrieve: mockRetrieve } };
    }),
    __esModule: true,
  };
});

import Stripe from 'stripe';
import {
  buildCreateAccountIdempotencyKey,
  createConnectAccount,
} from '@/lib/stripe/server';

describe('lib/stripe/server', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Limpiar la instancia lazy de _stripe entre tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildCreateAccountIdempotencyKey', () => {
    it('construye una key determinista para un producerId válido', () => {
      const producerId = 'uuid-a-1234';
      const key1 = buildCreateAccountIdempotencyKey(producerId);
      const key2 = buildCreateAccountIdempotencyKey(producerId);

      expect(key1).toBe(`connect-account-create:${producerId}`);
      expect(key2).toBe(`connect-account-create:${producerId}`);
      expect(key1).toBe(key2); // Determinismo: dos llamadas con el mismo input, mismo output
    });

    it('dos productores distintos nunca comparten la misma key', () => {
      const key1 = buildCreateAccountIdempotencyKey('uuid-a');
      const key2 = buildCreateAccountIdempotencyKey('uuid-b');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('connect-account-create:uuid-a');
      expect(key2).toBe('connect-account-create:uuid-b');
    });

    it('lanza si producerId es undefined', () => {
      expect(() => buildCreateAccountIdempotencyKey(undefined as any)).toThrow();
    });

    it('lanza si producerId es null', () => {
      expect(() => buildCreateAccountIdempotencyKey(null as any)).toThrow();
    });

    it('lanza si producerId es string vacío', () => {
      expect(() => buildCreateAccountIdempotencyKey('')).toThrow();
    });

    it('lanza si producerId es whitespace only', () => {
      expect(() => buildCreateAccountIdempotencyKey('   ')).toThrow();
    });
  });

  describe('createConnectAccount', () => {
    it('invoca stripe.accounts.create con idempotencyKey correcto', async () => {
      // Re-importar después de resetModules para obtener una nueva instancia
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      // Configurar el mock para que retorne un objeto account válido
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_123',
      });

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate } };
      } as any);

      const sellerId = 'uuid-test-producer-123';
      await testFunc({
        sellerId,
        email: 'test@example.com',
      });

      // Verificar que se llamó con la key correcta como segundo argumento
      expect(mockCreate).toHaveBeenCalledWith(
        expect.any(Object),
        { idempotencyKey: `connect-account-create:${sellerId}` }
      );
    });

    it('usa el sellerId real en metadata.sellerId (no un valor con Date.now())', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_456',
      });

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate } };
      } as any);

      const sellerId = 'uuid-real-producer-456';
      await testFunc({
        sellerId,
      });

      // Verificar que metadata.sellerId contiene el UUID real, no timestamp
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.metadata.sellerId).toBe(sellerId);
      expect(callArgs.metadata.sellerId).not.toMatch(/\d{13}/); // No debe contener timestamp (13 dígitos)
    });

    it('lanza si sellerId es vacío (validación interna)', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      await expect(
        testFunc({
          sellerId: '',
        })
      ).rejects.toThrow();
    });

    it('lanza si sellerId es undefined (validación interna)', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      await expect(
        testFunc({
          sellerId: undefined as any,
        })
      ).rejects.toThrow();
    });

    it('no llama a stripe.accounts.create si sellerId es vacío', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn();
      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate } };
      } as any);

      try {
        await testFunc({
          sellerId: '',
        });
      } catch {
        // Esperado que lance
      }

      // Verificar que el mock de create NUNCA fue llamado
      expect(mockCreate).not.toHaveBeenCalled();
    });

    // NOTA: `maxNetworkRetries: 2` en el constructor de Stripe se verifica por
    // revisión manual del código (línea del `new Stripe(...)` en `getStripe()`),
    // no con un test — probar la inicialización lazy de un singleton de módulo
    // requeriría `vi.resetModules()` + `vi.doMock()` sin limpieza posterior, lo
    // que contamina el registro de módulos para los tests siguientes que usan
    // `await import('@/lib/stripe/server')` (ver los tests de `createConnectAccount`
    // más abajo, que dependen del mock hoisted al inicio del archivo).

    // === TESTS NUEVOS PARA REDISEÑO DE ETAPA 2 ===

    it('invariante: dos llamadas con mismo sellerId pero datos de perfil distintos producen el MISMO payload exacto a create()', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_inv',
      });

      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      const sellerId = 'uuid-invariant-test';

      // Primera llamada con email y businessName
      await testFunc({
        sellerId,
        email: 'a@example.com',
        businessName: 'Negocio A',
      });

      const payload1 = mockCreate.mock.calls[0][0];

      // Resetear mock para segunda llamada
      mockCreate.mockClear();
      mockUpdate.mockClear();

      // Segunda llamada con sellerId IGUAL pero email y businessName DISTINTOS
      await testFunc({
        sellerId,
        email: 'b@example.com',
        businessName: 'Negocio B',
      });

      const payload2 = mockCreate.mock.calls[0][0];

      // Verificación: payloads idénticos (invariante central)
      expect(payload1).toEqual(payload2);
      expect(payload1).toEqual({
        type: 'express',
        country: 'ES',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          sellerId,
          platform: 'origen-marketplace',
        },
      });
    });

    it('payload de create() nunca contiene email, business_profile, firstName, lastName', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_clean',
      });

      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      // Llamada con TODOS los campos de perfil posibles
      await testFunc({
        sellerId: 'uuid-all-fields',
        email: 'test@example.com',
        businessName: 'Test Business',
        website: 'https://example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const payload = mockCreate.mock.calls[0][0];

      // Verificar que NINGUNOS de estos campos aparecen en el payload de create()
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('business_profile');
      expect(payload.metadata).not.toHaveProperty('firstName');
      expect(payload.metadata).not.toHaveProperty('lastName');

      // Verificar que solo los campos invariables están presentes
      expect(Object.keys(payload)).toEqual(expect.arrayContaining([
        'type',
        'country',
        'capabilities',
        'metadata',
      ]));
    });

    it('tras creación exitosa, invoca accounts.update() con campos de perfil correctamente mapeados', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_update',
      });

      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      const sellerId = 'uuid-update-test';
      const email = 'profile@example.com';
      const businessName = 'My Business';
      const website = 'https://mybiz.com';
      const firstName = 'Jane';
      const lastName = 'Smith';

      await testFunc({
        sellerId,
        email,
        businessName,
        website,
        firstName,
        lastName,
      });

      // Verificar que update fue llamado con los campos correctos
      expect(mockUpdate).toHaveBeenCalledWith(
        'acct_test_update',
        expect.objectContaining({
          email,
          business_profile: {
            name: businessName,
            url: website,
          },
          metadata: expect.objectContaining({
            sellerId,
            platform: 'origen-marketplace',
            firstName,
            lastName,
          }),
        })
      );
    });

    it('si solo se proporciona sellerId (sin campos de perfil), update NO se llama', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const mockCreate = vi.fn().mockResolvedValue({
        id: 'acct_test_no_update',
      });

      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      await testFunc({
        sellerId: 'uuid-only-seller',
      });

      // Verificar que create fue llamado
      expect(mockCreate).toHaveBeenCalled();
      // Pero update NO fue llamado
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('si accounts.update() rechaza, createConnectAccount resuelve con la cuenta creada (no relanza)', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const accountId = 'acct_test_update_fail';
      const mockCreate = vi.fn().mockResolvedValue({
        id: accountId,
      });

      const updateError = new Error('Update failed: invalid email');
      const mockUpdate = vi.fn().mockRejectedValue(updateError);

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      // Llamada con datos de perfil (provocará que se intente update)
      const result = await testFunc({
        sellerId: 'uuid-update-fail',
        email: 'bad@example.com',
      });

      // Verificar que retorna la cuenta creada (no lanza)
      expect(result.id).toBe(accountId);

      // Verificar que update fue intentado
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('si accounts.create() rechaza con idempotency_error, relanza sin reintentar', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const idempotencyError = new Error('Keys for idempotent requests can only be used with one set of request parameters');
      // Simular que es un Stripe StripeError con type 'idempotency_error'
      (idempotencyError as any).type = 'idempotency_error';

      const mockCreate = vi.fn().mockRejectedValue(idempotencyError);
      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      // Debe relanzar el error
      await expect(
        testFunc({
          sellerId: 'uuid-idempotency-err',
          email: 'test@example.com',
        })
      ).rejects.toThrow(idempotencyError);

      // Verificar que create fue llamado EXACTAMENTE UNA VEZ (sin reintento)
      expect(mockCreate).toHaveBeenCalledTimes(1);

      // Verificar que update NUNCA fue llamado (fallo en create bloquea update)
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('otros errores de Stripe (no idempotency_error) se propagan sin cambios', async () => {
      const { createConnectAccount: testFunc } = await import('@/lib/stripe/server');

      const invalidRequestError = new Error('Invalid country code');
      (invalidRequestError as any).type = 'invalid_request_error';

      const mockCreate = vi.fn().mockRejectedValue(invalidRequestError);
      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(Stripe).mockImplementation(function () {
        return { accounts: { create: mockCreate, update: mockUpdate } };
      } as any);

      // Debe relanzar el error de invalid_request_error
      await expect(
        testFunc({
          sellerId: 'uuid-invalid-request',
        })
      ).rejects.toThrow(invalidRequestError);

      // Verificar que update NUNCA fue llamado
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
