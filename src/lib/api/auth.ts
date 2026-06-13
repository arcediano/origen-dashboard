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
  activeRole?: UserRole;
  roles?: UserRole[];
  producerCode: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCurrentUserPayload {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetActiveRolePayload {
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  errorCode?: 'DUPLICATE_EMAIL' | 'SERVER_ERROR';
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
  street: string;
  streetNumber: string;
  streetComplement?: string;
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
  rememberMe?: boolean;
}): Promise<LoginResponse> {
  return gatewayClient.post<LoginResponse>('/auth/login', {
    email: params.email,
    password: params.password,
    rememberMe: params.rememberMe ?? false,
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
  const response = await gatewayClient.get<{ success: boolean; data: AuthUser }>('/auth/userinfo');
  return response.data;
}

/**
 * Actualiza datos básicos del usuario autenticado.
 */
export async function updateCurrentUser(payload: UpdateCurrentUserPayload): Promise<void> {
  await gatewayClient.patch('/auth/me', payload);
}

/**
 * Cambia la contraseña del usuario autenticado.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await gatewayClient.patch('/auth/change-password', payload);
}

/**
 * Cambia el rol activo de la sesión actual.
 */
export async function setActiveRole(payload: SetActiveRolePayload): Promise<AuthUser> {
  const response = await gatewayClient.patch<{ success: boolean; data: AuthUser }>('/auth/active-role', payload);
  return response.data;
}

/**
 * Solicita un email de recuperación de contraseña.
 * El backend envía un enlace de un solo uso válido 30 minutos.
 * Por seguridad, la respuesta es siempre 200 aunque el email no exista.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await gatewayClient.post('/auth/forgot-password', { email });
}

// ─── TWO-FACTOR AUTHENTICATION (2FA) ──────────────────────────────────────────

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface TwoFactorEnableResponse {
  recoveryCodes: string[];
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}

/**
 * Obtiene el estado de 2FA del usuario autenticado.
 * Devuelve { enabled: boolean }.
 */
export async function getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
  const response = await gatewayClient.get<{ success: boolean; data: TwoFactorStatusResponse }>('/auth/2fa/status');
  return response.data;
}

/**
 * Inicia el setup de 2FA: genera un secreto TOTP y QR.
 * Devuelve { secret, qrCodeUrl, otpauthUrl }.
 */
export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  const response = await gatewayClient.post<{ success: boolean; data: TwoFactorSetupResponse }>('/auth/2fa/setup', {});
  return response.data;
}

/**
 * Habilita 2FA con verificación de código TOTP.
 * Body: { secret, code } donde code es de 6 dígitos.
 * Devuelve { recoveryCodes: string[] }.
 */
export async function enableTwoFactor(secret: string, code: string): Promise<TwoFactorEnableResponse> {
  const response = await gatewayClient.post<{ success: boolean; data: TwoFactorEnableResponse }>('/auth/2fa/enable', {
    secret,
    code,
  });
  return response.data;
}

/**
 * Deshabilita 2FA con verificación (código TOTP o contraseña actual).
 * Body: { totpCode?: string; password?: string } — al menos uno obligatorio.
 */
export async function disableTwoFactor(verification: string): Promise<void> {
  // Intentar como código TOTP primero (6 dígitos)
  if (/^\d{6}$/.test(verification)) {
    await gatewayClient.post('/auth/2fa/disable', { totpCode: verification });
  } else {
    // Si no es TOTP, asumir que es contraseña
    await gatewayClient.post('/auth/2fa/disable', { password: verification });
  }
}

/**
 * Verifica el código 2FA durante el login.
 * Body: { challengeToken, code } donde code es de 6 dígitos o un código de recuperación.
 * Devuelve los tokens de login (igual que un loginUser exitoso).
 */
export async function verifyTwoFactor(challengeToken: string, code: string): Promise<LoginResponse> {
  return gatewayClient.post<LoginResponse>('/auth/login/verify-2fa', {
    challengeToken,
    code,
  });
}
