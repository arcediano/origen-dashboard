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

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { loginUser } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { CheckboxWithLabel } from '@/components/ui/atoms/checkbox';

import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Store,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Banner de sesión expirada ────────────────────────────────────────────────
// Usa useSearchParams → requiere Suspense para SSR/SSG

function SessionBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const reason = searchParams.get('reason');

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
      await loginUser({ email: trimmedEmail, password: trimmedPassword, rememberMe });
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

      if (!loggedUser || loggedUser.role !== 'PRODUCER') {
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      <div className="bg-surface-alt rounded-2xl border border-border p-5 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">

        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
            <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-origen-bosque mb-1">
            Acceso productores
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">Gestiona tu tienda y ventas</p>
        </div>

        {/* Banner sesión expirada */}
        <Suspense fallback={null}>
          <SessionBanner />
        </Suspense>

        {/* Error general */}
        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 md:mb-6 p-3 bg-feedback-danger-subtle border border-red-200 rounded-lg flex items-start gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">{errors.general}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
              className="w-full sm:w-full"
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
