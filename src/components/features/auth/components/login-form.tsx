// components/forms/SimpleLogin.tsx
/**
 * @file SimpleLogin.tsx
 * @description Formulario de login premium - v2.0.0
 * @version 2.0.0 - Manual de Marca v3.0 "Bosque Profundo" + Mejoras responsive
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/atoms/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// ICONOS
// ============================================================================

import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Store,
  Clock
} from 'lucide-react';

// ============================================================================
// BANNER DE SESIÓN — muestra el motivo del cierre de sesión (si existe)
// Usa useSearchParams → requiere Suspense para SSR/SSG
// ============================================================================

function SessionBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const reason = searchParams.get('reason');

  if (!message) return null;

  const isInactivity = reason === 'inactivity' || reason === 'hidden';

  return (
    <div className={cn(
      'mb-5 p-3 border rounded-lg flex items-start gap-2 text-sm',
      isInactivity
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-red-50 border-red-200 text-red-700'
    )}>
      <span className="flex-shrink-0 mt-0.5">{isInactivity ? '⏰' : '🔒'}</span>
      <span>{decodeURIComponent(message)}</span>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function SimpleLogin() {
  const router = useRouter();
  const { setUserFromLogin, clearUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Introduce un email válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // Paso 1: Login (solo devuelve tokens, NO user)
      await loginUser({ email, password, rememberMe });

      // Paso 2: Cargar usuario del backend (hace GET /auth/userinfo con retries automáticos)
      // setUserFromLogin maneja el timing issue automáticamente con 3 intentos
      // ✅ Capturar el usuario devuelto para validación inmediata
      const loggedUser = await setUserFromLogin(email);

      // Paso 3: Validar rol usando el usuario devuelto (NO el estado del contexto)
      if (!loggedUser || loggedUser.role !== 'PRODUCER') {
        clearUser();
        setErrors({ general: 'Tu cuenta no tiene acceso al panel de productores.' });
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof GatewayError && err.status === 401) {
        setErrors({ general: 'Credenciales incorrectas. Revisa tu email y contraseña.' });
      } else if (err instanceof GatewayError && err.status === 403) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      {/* Tarjeta principal */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">

        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
            <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-origen-bosque mb-1">Acceso productores</h2>
          <p className="text-xs md:text-sm text-gray-600">Gestiona tu tienda y ventas</p>
        </div>

        {/* Banner de sesión expirada / inactividad */}
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
              className="mb-5 md:mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">{errors.general}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

          {/* Campo Email */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="nombre@productor.es"
                className={cn(
                  "w-full h-11 md:h-12 px-3 md:px-4 text-sm",
                  "bg-white border rounded-xl",
                  "focus:outline-none focus:ring-2",
                  "focus:ring-origen-pradera/20",
                  "transition-all duration-200",
                  errors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-200 focus:border-origen-pradera"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
                Contraseña <span className="text-red-500">*</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[10px] md:text-xs text-origen-pradera hover:text-origen-bosque transition-colors"
              >
                ¿Olvidaste?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full h-11 md:h-12 px-3 md:px-4 text-sm",
                  "bg-white border rounded-xl",
                  "focus:outline-none focus:ring-2",
                  "focus:ring-origen-pradera/20",
                  "transition-all duration-200 pr-10 md:pr-11",
                  errors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-200 focus:border-origen-pradera"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-origen-bosque p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Checkbox personalizado */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              className={cn(
                "w-4 h-4 rounded border transition-all",
                "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                rememberMe
                  ? "bg-origen-bosque border-origen-bosque"
                  : "border-gray-300 hover:border-origen-pradera"
              )}
            >
              {rememberMe && (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="text-[11px] md:text-xs text-gray-600">Recordar mi sesión</span>
          </div>

          {/* Separador visual - Borde de marca */}
          <div className="border-t border-origen-crema/40 pt-4">

            {/* Contenedor para centrar botón */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full max-w-xs h-11 md:h-12",
                  "bg-origen-bosque hover:bg-origen-pino",
                  "text-white text-sm font-semibold",
                  "rounded-xl shadow-md hover:shadow-lg",
                  "transition-all transform hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:hover:translate-y-0"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Acceder al panel
                  </span>
                )}
              </Button>
            </div>

            {/* Enlace a registro */}
            <div className="text-center pt-4">
              <p className="text-[11px] md:text-xs text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-origen-pradera hover:text-origen-bosque font-medium">
                  Regístrate como productor
                </Link>
              </p>
            </div>
          </div> {/* Cierre del separador visual */}
        </form>
      </div>

      {/* Trust badges */}
      <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-gray-600">SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-gray-600">+500 productores</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera" />
          <span className="text-gray-600">Respuesta 24h</span>
        </div>
      </div>
    </div>
  );
}
