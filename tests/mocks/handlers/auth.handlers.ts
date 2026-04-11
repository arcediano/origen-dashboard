import { http, HttpResponse } from 'msw';
import { TEST_API_BASE } from '../api-base';

// En tests, el cliente browser usa el origin actual + /api/v1.
const BASE = TEST_API_BASE;

export const authHandlers = [
  // Login exitoso
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const { email, password } = body as { email: string; password: string };

    if (email === 'productor@test.es' && password === 'Password1') {
      return HttpResponse.json({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900,
        },
      });
    }

    return HttpResponse.json(
      { success: false, message: 'Credenciales incorrectas' },
      { status: 401 },
    );
  }),

  // Registro exitoso
  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const { email } = body as { email: string };

    if (email === 'duplicado@test.es') {
      return HttpResponse.json(
        { success: false, message: 'El email ya está registrado' },
        { status: 409 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Registro completado',
      data: {
        id: 42,
        email,
        firstName: 'Test',
        lastName: 'Productor',
        role: 'PRODUCER',
        producerCode: null,
        onboardingCompleted: false,
        trackingCode: 'TRACK-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Userinfo
  http.get(`${BASE}/auth/userinfo`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 42,
        email: 'productor@test.es',
        firstName: 'Test',
        lastName: 'Productor',
        role: 'PRODUCER',
        producerCode: 'PROD-042',
        onboardingCompleted: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
  }),

  // Forgot password
  http.post(`${BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({ success: true, message: 'Email enviado' });
  }),

  // Change password
  http.patch(`${BASE}/auth/change-password`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;

    if (body.currentPassword === 'WrongCurrent1!') {
      return HttpResponse.json(
        { success: false, message: 'La contraseña actual es incorrecta' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  }),

  // Logout
  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),
];

// Handlers de error reutilizables en tests individuales
export const authErrorHandlers = {
  loginServerError: http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 }),
  ),
  loginForbidden: http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ success: false, message: 'Cuenta pendiente de aprobación' }, { status: 403 }),
  ),
  registerConflict: http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ success: false, message: 'El email ya está registrado' }, { status: 409 }),
  ),
};
