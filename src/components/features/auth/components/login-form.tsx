/**
 * @file login-form.tsx
 * @description Formulario de acceso para productores.
 *
 * Usa los componentes de la librería de UI:
 *   - `Input`             → campos email y contraseña (con validación integrada)
 *   - `CheckboxWithLabel` → recordar sesión
 *   - `Button`            → submit con estado de carga nativo
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { loginUser, verifyTwoFactor } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

import { Button, Input } from '@arcediano/ux-library';
import { CheckboxWithLabel } from '@arcediano/ux-library';

import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Store,
  Clock,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Banner de sesión expirada ────────────────────────────────────────────────
// Usa useSearchParams → requiere Suspense para SSR/SSG

function SessionBanner() {
  const searchParams = useSearchParams();
  const [fallbackNotice, setFallbackNotice] = useState<{ reason: string; message: string } | null>(null);

  const queryMessage = searchParams.get('message');
  const queryReason = searchParams.get('reason');

  useEffect(() => {
    if (queryMessage) return;
    if (typeof window === 'undefined') return;

    const rawNotice = window.sessionStorage.getItem('auth:logout-notice');
    if (!rawNotice) return;

    try {
      const parsed = JSON.parse(rawNotice) as { reason?: string; message?: string };
      if (parsed?.reason && parsed?.message) {
        setFallbackNotice({ reason: parsed.reason, message: parsed.message });
      }
    } catch {
      // noop: si el JSON es inválido no mostramos fallback
    } finally {
      window.sessionStorage.removeItem('auth:logout-notice');
    }
  }, [queryMessage]);

  const message = queryMessage ?? fallbackNotice?.message ?? null;
  const reason = queryReason ?? fallbackNotice?.reason ?? null;

  if (!message) return null;

  const isInactivity = reason === 'inactivity' || reason === 'hidden';

  return (
    <div
      className={cn(
        'mb-5 p-3 border rounded-lg flex items-start gap-2 text-sm',
        isInactivity
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-feedback-danger-subtle border-red-200 text-red-700',
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{isInactivity ? '⏰' : '🔒'}</span>
      <span>{decodeURIComponent(message)}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SimpleLogin() {
  const router = useRouter();
  const { setUserFromLogin, clearUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 2FA State
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  // ── Validación ──────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};

    if (!email.trim()) {
      next.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Introduce un email válido';
    }

    if (!password) {
      next.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      next.password = 'Mínimo 8 caracteres';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const next: Record<string, string> = {};
    if (!trimmedEmail) {
      next.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = 'Introduce un email válido';
    }
    if (!trimmedPassword) {
      next.password = 'La contraseña es requerida';
    } else if (trimmedPassword.length < 8) {
      next.password = 'Mínimo 8 caracteres';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);

    // ── Paso 1: autenticar ───────────────────────────────────────────────────
    try {
      const loginResponse = await loginUser({ email: trimmedEmail, password: trimmedPassword, rememberMe });

      // Verificar si la respuesta indica 2FA requerido
      const responseData = loginResponse as any;
      if (responseData.requiresTwoFactor && responseData.challengeToken) {
        // Guardar el challengeToken y mostrar formulario 2FA
        setChallengeToken(responseData.challengeToken);
        setRequiresTwoFactor(true);
        setTwoFactorCode('');
        setRecoveryCode('');
        setUseRecoveryCode(false);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      if (err instanceof GatewayError && err.status === 401) {
        setErrors({ general: 'Credenciales incorrectas. Revisa tu email y contraseña.' });
      } else if (err instanceof GatewayError && err.status === 403) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' });
      }
      setIsLoading(false);
      return;
    }

    // ── Paso 2: cargar perfil ────────────────────────────────────────────────
    try {
      const loggedUser = await setUserFromLogin(trimmedEmail);
      const hasProducerMembership =
        (loggedUser?.roles?.includes('PRODUCER') ?? false) ||
        loggedUser?.role === 'PRODUCER';

      if (!loggedUser || !hasProducerMembership) {
        clearUser();
        setErrors({ general: 'Tu cuenta no tiene acceso al panel de productores.' });
        return;
      }

      router.push(loggedUser.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err) {
      setErrors({ general: 'Sesión iniciada correctamente, pero no se pudo cargar tu perfil. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit 2FA ───────────────────────────────────────────────────────────────

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = useRecoveryCode ? recoveryCode.trim() : twoFactorCode;

    if (!code) {
      setErrors({ twoFactor: useRecoveryCode ? 'El código de recuperación es requerido' : 'El código de 6 dígitos es requerido' });
      return;
    }

    if (!useRecoveryCode && !/^\d{6}$/.test(code)) {
      setErrors({ twoFactor: 'El código debe tener exactamente 6 dígitos' });
      return;
    }

    setIsLoading(true);

    try {
      await verifyTwoFactor(challengeToken, code);
    } catch (err) {
      if (err instanceof GatewayError && err.status === 401) {
        setErrors({ twoFactor: 'Código incorrecto o expirado. Intenta de nuevo.' });
      } else {
        setErrors({ twoFactor: 'Error al verificar el código. Inténtalo de nuevo.' });
      }
      setIsLoading(false);
      return;
    }

    // ── Cargar perfil después de 2FA exitoso ─────────────────────────────────
    try {
      const loggedUser = await setUserFromLogin(email);
      const hasProducerMembership =
        (loggedUser?.roles?.includes('PRODUCER') ?? false) ||
        loggedUser?.role === 'PRODUCER';

      if (!loggedUser || !hasProducerMembership) {
        clearUser();
        setErrors({ twoFactor: 'Tu cuenta no tiene acceso al panel de productores.' });
        setIsLoading(false);
        return;
      }

      router.push(loggedUser.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err) {
      setErrors({ twoFactor: 'Verificación exitosa, pero no se pudo cargar tu perfil. Inténtalo de nuevo.' });
      setIsLoading(false);
    }
  };

  // ── Volver al formulario de login ────────────────────────────────────────────

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setChallengeToken('');
    setTwoFactorCode('');
    setRecoveryCode('');
    setUseRecoveryCode(false);
    setErrors({});
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      <div className="bg-surface-alt rounded-2xl border border-border p-5 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">

        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className={cn(
            "w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl flex items-center justify-center shadow-md",
            requiresTwoFactor
              ? 'bg-gradient-to-br from-origen-pradera to-origen-hoja'
              : 'bg-gradient-to-br from-origen-bosque to-origen-pino'
          )}>
            {requiresTwoFactor ? (
              <Smartphone className="w-7 h-7 md:w-8 md:h-8 text-white" />
            ) : (
              <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-origen-bosque mb-1">
            {requiresTwoFactor ? 'Verifica tu identidad' : 'Acceso productores'}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {requiresTwoFactor ? 'Ingresa el código de 6 dígitos de tu aplicación de autenticación' : 'Gestiona tu tienda y ventas'}
          </p>
        </div>

        {/* Banner sesión expirada */}
        {!requiresTwoFactor && (
          <Suspense fallback={null}>
            <SessionBanner />
          </Suspense>
        )}

        {/* Error general o 2FA */}
        <AnimatePresence>
          {(errors.general || errors.twoFactor) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 md:mb-6 p-3 bg-feedback-danger-subtle border border-red-200 rounded-lg flex items-start gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">{errors.general || errors.twoFactor}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!requiresTwoFactor ? (
          // ────────────────────────────────────────────────────────────────────
          // FORMULARIO DE LOGIN NORMAL
          // ────────────────────────────────────────────────────────────────────
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Email */}
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="nombre@productor.es"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              leftIcon={<Mail />}
              error={errors.email}
              inputSize="lg"
            />

            {/* Contraseña */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                {/* El label lo pinta el componente Input con la prop `label` */}
                <span /> {/* spacer para alinear el enlace a la derecha */}
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] md:text-xs text-origen-pradera hover:text-origen-bosque transition-colors"
                >
                  ¿Olvidaste?
                </Link>
              </div>
              <Input
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                leftIcon={<Lock />}
                error={errors.password}
                inputSize="lg"
              />
            </div>

            {/* Recordar sesión */}
            <CheckboxWithLabel
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(v === true)}
              label="Recordar mi sesión"
              size="sm"
            />

            {/* Separador + submit */}
            <div className="border-t border-origen-crema/40 pt-4 space-y-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                loadingText="Iniciando sesión..."
                className="w-full sm:w-full text-white disabled:text-white/90"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Acceder al panel
              </Button>

              <p className="text-center text-[11px] md:text-xs text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="text-origen-pradera hover:text-origen-bosque font-medium"
                >
                  Regístrate como productor
                </Link>
              </p>
            </div>
          </form>
        ) : (
          // ────────────────────────────────────────────────────────────────────
          // FORMULARIO DE VERIFICACIÓN 2FA
          // ────────────────────────────────────────────────────────────────────
          <form onSubmit={handleVerify2FA} className="space-y-4 md:space-y-5">
            {!useRecoveryCode ? (
              <>
                {/* Código TOTP */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-origen-bosque">
                    Código de 6 dígitos
                  </label>
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={twoFactorCode[i] || ''}
                        onChange={(e) => {
                          const newCode = twoFactorCode.split('');
                          newCode[i] = e.target.value.slice(-1);
                          const code = newCode.join('').slice(0, 6);
                          setTwoFactorCode(code);
                          // Auto-focus next input
                          if (e.target.value && i < 5) {
                            const nextInput = document.querySelector(
                              `input[data-2fa-digit="${i + 1}"]`
                            ) as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }}
                        className="!w-10 h-10 text-center"
                        disabled={isLoading}
                        data-2fa-digit={i}
                      />
                    ))}
                  </div>
                </div>

                {/* Toggle a código de recuperación */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(true);
                      setTwoFactorCode('');
                      setErrors({});
                    }}
                    className="text-xs text-origen-pradera hover:text-origen-bosque transition-colors underline"
                  >
                    Usar código de recuperación
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Input de código de recuperación */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-origen-bosque">
                    Código de recuperación
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: ABCD-EFGH-IJKL"
                    value={recoveryCode}
                    onChange={(e) => {
                      setRecoveryCode(e.target.value);
                      if (errors.twoFactor) setErrors({ ...errors, twoFactor: '' });
                    }}
                    disabled={isLoading}
                    inputSize="lg"
                  />
                </div>

                {/* Toggle volver a código TOTP */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(false);
                      setRecoveryCode('');
                      setErrors({});
                    }}
                    className="text-xs text-origen-pradera hover:text-origen-bosque transition-colors underline"
                  >
                    Usar código TOTP
                  </button>
                </div>
              </>
            )}

            {/* Separador + submit */}
            <div className="border-t border-origen-crema/40 pt-4 space-y-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                loadingText="Verificando..."
                className="w-full sm:w-full text-white disabled:text-white/90"
              >
                Verificar
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="w-full sm:w-full"
              >
                Volver atrás
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Trust badges */}
      <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-muted-foreground">SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-muted-foreground">+500 productores</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-muted-foreground">Respuesta 24h</span>
        </div>
      </div>
    </div>
  );
}

