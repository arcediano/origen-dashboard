/**
 * Tests unitarios para las funciones de la API de autenticación.
 * Usa MSW (ya configurado en vitest.setup.ts) para interceptar las peticiones.
 */

import { describe, it, expect } from 'vitest';
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  requestPasswordReset,
  registerProducer,
} from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

// ── loginUser ─────────────────────────────────────────────────────────────────

describe('loginUser', () => {
  it('devuelve tokens con credenciales correctas', async () => {
    const result = await loginUser({
      email: 'productor@test.es',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('mock-access-token');
    expect(result.data.refreshToken).toBe('mock-refresh-token');
  });

  it('el token de acceso devuelto es un string', async () => {
    const result = await loginUser({
      email: 'productor@test.es',
      password: 'Password1',
    });
    expect(typeof result.data.accessToken).toBe('string');
    expect(result.data.accessToken.length).toBeGreaterThan(0);
  });

  it('devuelve expiresIn como número', async () => {
    const result = await loginUser({
      email: 'productor@test.es',
      password: 'Password1',
    });
    expect(typeof result.data.expiresIn).toBe('number');
  });

  it('lanza GatewayError con credenciales incorrectas', async () => {
    await expect(
      loginUser({ email: 'malo@test.es', password: 'WrongPass1' })
    ).rejects.toThrow(GatewayError);
  });

  it('el GatewayError por credenciales incorrectas tiene status 401', async () => {
    try {
      await loginUser({ email: 'malo@test.es', password: 'WrongPass1' });
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect((err as GatewayError).status).toBe(401);
    }
  });

  it('el mensaje de error 401 es descriptivo', async () => {
    try {
      await loginUser({ email: 'malo@test.es', password: 'WrongPass1' });
    } catch (err) {
      expect((err as GatewayError).message).toBeTruthy();
    }
  });

  it('acepta el parámetro rememberMe sin error', async () => {
    const result = await loginUser({
      email: 'productor@test.es',
      password: 'Password1',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });
});

// ── getCurrentUser ────────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  it('devuelve los datos del usuario autenticado', async () => {
    const user = await getCurrentUser();
    expect(user.email).toBe('productor@test.es');
  });

  it('el usuario tiene rol PRODUCER', async () => {
    const user = await getCurrentUser();
    expect(user.role).toBe('PRODUCER');
  });

  it('el usuario tiene onboardingCompleted: true', async () => {
    const user = await getCurrentUser();
    expect(user.onboardingCompleted).toBe(true);
  });

  it('el usuario tiene todos los campos requeridos', async () => {
    const user = await getCurrentUser();
    expect(user).toMatchObject({
      id: expect.any(Number),
      email: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      role: expect.any(String),
      onboardingCompleted: expect.any(Boolean),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('el id del usuario es un número positivo', async () => {
    const user = await getCurrentUser();
    expect(user.id).toBeGreaterThan(0);
  });
});

// ── registerProducer ──────────────────────────────────────────────────────────

const VALID_REGISTRATION = {
  email: 'nuevo@test.es',
  password: 'Password1',
  firstName: 'Test',
  lastName: 'Productor',
  phone: '600000000',
  businessName: 'Huerta Ecológica Prueba',
  businessType: 'individual' as const,
  producerCategory: 'agricola',
  street: 'Calle Mayor',
  streetNumber: '1',
  municipio: 'Segovia',
  postalCode: '40001',
  province: 'Segovia',
  whyOrigin: 'Quiero vender mis productos ecológicos en un mercado de confianza',
  acceptsTerms: true as const,
  acceptsPrivacy: true as const,
};

describe('registerProducer', () => {
  it('registra un productor nuevo con datos válidos', async () => {
    const result = await registerProducer(VALID_REGISTRATION);
    expect(result.success).toBe(true);
  });

  it('devuelve un trackingCode en el registro exitoso', async () => {
    const result = await registerProducer(VALID_REGISTRATION);
    expect(result.data.trackingCode).toBe('TRACK-001');
  });

  it('el registro incluye los datos del usuario creado', async () => {
    const result = await registerProducer(VALID_REGISTRATION);
    expect(result.data).toMatchObject({
      id: expect.any(Number),
      email: expect.any(String),
      role: 'PRODUCER',
    });
  });

  it('lanza GatewayError 409 con email ya registrado', async () => {
    await expect(
      registerProducer({ ...VALID_REGISTRATION, email: 'duplicado@test.es' })
    ).rejects.toThrow(GatewayError);
  });

  it('el GatewayError 409 tiene el status correcto', async () => {
    try {
      await registerProducer({ ...VALID_REGISTRATION, email: 'duplicado@test.es' });
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect((err as GatewayError).status).toBe(409);
    }
  });

  it('acepta el campo streetComplement opcional', async () => {
    const result = await registerProducer({
      ...VALID_REGISTRATION,
      streetComplement: '2º A',
    });
    expect(result.success).toBe(true);
  });
});

// ── logoutUser ────────────────────────────────────────────────────────────────

describe('logoutUser', () => {
  it('se resuelve sin lanzar error', async () => {
    await expect(logoutUser()).resolves.not.toThrow();
  });

  it('devuelve undefined (void)', async () => {
    const result = await logoutUser();
    expect(result).toBeUndefined();
  });
});

// ── requestPasswordReset ──────────────────────────────────────────────────────

describe('requestPasswordReset', () => {
  it('se resuelve sin error para un email registrado', async () => {
    await expect(
      requestPasswordReset('productor@test.es')
    ).resolves.not.toThrow();
  });

  it('se resuelve sin error para un email NO registrado (seguridad anti-enumeración)', async () => {
    await expect(
      requestPasswordReset('noexiste@correo.es')
    ).resolves.not.toThrow();
  });

  it('devuelve undefined (void)', async () => {
    const result = await requestPasswordReset('productor@test.es');
    expect(result).toBeUndefined();
  });
});
