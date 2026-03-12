/**
 * Módulo de API de autenticación
 *
 * Centraliza todas las llamadas al gateway relacionadas con auth:
 * registro, login, logout, refresh y datos del usuario actual.
 *
 * Las cookies HttpOnly (accessToken / refreshToken) las gestiona el gateway
 * automáticamente en login/refresh. El cliente no las manipula nunca.
 *
 * @module lib/api/auth
 */

import { gatewayClient } from './client';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'PRODUCER' | 'CUSTOMER';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  producerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: AuthUser & { trackingCode: string | null };
}

// ─── FUNCIONES ────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo productor.
 *
 * Envía al gateway todos los campos del formulario de registro.
 * El gateway crea el usuario en auth-service y la RegistrationRequest
 * en producers-service. El trackingCode es generado por el backend
 * y devuelto en la respuesta.
 */
export async function registerProducer(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessType: 'individual' | 'company';
  producerCategory: string;
  province: string;
  municipio: string;
  postalCode: string;
  whyOrigin: string;
  acceptsTerms: true;
  acceptsPrivacy: true;
}): Promise<RegisterResponse> {
  return gatewayClient.post<RegisterResponse>('/auth/register', params);
}

/**
 * Inicia sesión. El gateway establece las cookies HttpOnly
 * accessToken y refreshToken en la respuesta.
 */
export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return gatewayClient.post<LoginResponse>('/auth/login', {
    email: params.email,
    password: params.password,
  });
}

/**
 * Cierra la sesión del usuario actual.
 * El gateway invalida el refreshToken y borra las cookies.
 */
export async function logoutUser(): Promise<void> {
  await gatewayClient.post('/auth/logout');
}

/**
 * Refresca los tokens usando el refreshToken de la cookie HttpOnly.
 * Útil para extender la sesión de forma silenciosa.
 */
export async function refreshTokens(): Promise<void> {
  await gatewayClient.post('/auth/refresh');
}

/**
 * Devuelve los datos del usuario autenticado leyendo el accessToken de la cookie.
 * Lanza GatewayError con status 401 si no hay sesión activa.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  return gatewayClient.get<AuthUser>('/auth/userinfo');
}
