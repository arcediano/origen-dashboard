// components/forms/SimpleLogin.tsx
/**
 * @file SimpleLogin.tsx
 * @description Formulario de login premium - CORREGIDO v1.1.0
 * @version 1.1.0 - Eliminados todos los usos de Menta (#06D6A0)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

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
  ArrowRight,
  Shield,
  Sparkles,
  Store,
  Clock,
  Leaf,
  User,
  Check
} from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL - VERSIÓN CORREGIDA
// ============================================================================

export function SimpleLogin() {
  const router = useRouter();
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
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      await loginUser({ email, password, rememberMe });
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
    <div className="w-full max-w-md mx-auto">
      {/* Tarjeta principal */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">
        
        {/* Header - MEJORADO */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-origen-bosque mb-1">Acceso productores</h2>
          <p className="text-sm text-gray-600">Gestiona tu tienda y ventas</p>
        </div>

        {/* Error general */}
        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">{errors.general}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-origen-pradera" />
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="nombre@productor.es"
                className={cn(
                  "w-full h-12 px-4 text-sm",
                  "bg-white border rounded-xl",
                  "focus:outline-none focus:ring-2",
                  // CORREGIDO: focus:ring-origen-menta/20 → focus:ring-origen-pradera/20
                  "focus:ring-origen-pradera/20",
                  "transition-all duration-200",
                  errors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    // CORREGIDO: focus:border-origen-menta → focus:border-origen-pradera
                    : "border-gray-200 focus:border-origen-pradera"
                )}
              />
            </div>
            {/* Mensaje de error en rojo - OK */}
            {errors.email && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-origen-pradera" />
                Contraseña <span className="text-red-500">*</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-origen-pradera hover:text-origen-bosque transition-colors"
              >
                ¿Olvidaste?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full h-12 px-4 text-sm",
                  "bg-white border rounded-xl",
                  "focus:outline-none focus:ring-2",
                  // CORREGIDO: focus:ring-origen-menta/20 → focus:ring-origen-pradera/20
                  "focus:ring-origen-pradera/20",
                  "transition-all duration-200 pr-11",
                  errors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    // CORREGIDO: focus:border-origen-menta → focus:border-origen-pradera
                    : "border-gray-200 focus:border-origen-pradera"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-origen-bosque"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Mensaje de error en rojo - OK */}
            {errors.password && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
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
                // CORREGIDO: focus:ring-origen-menta/50 → focus:ring-origen-pradera/50
                "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                rememberMe
                  ? "bg-origen-bosque border-origen-bosque"
                  : "border-gray-300 hover:border-origen-pradera"
              )}
            >
              {rememberMe && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
            <span className="text-xs text-gray-600">Recordar mi sesión</span>
          </div>

          {/* Botón de acceso */}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-12",
              "bg-origen-bosque hover:bg-origen-pino",
              "text-white text-sm font-semibold",
              "rounded-xl shadow-md hover:shadow-lg",
              "transition-all transform hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:hover:translate-y-0",
              "mt-2"
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

          {/* Enlace a registro */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-origen-pradera hover:text-origen-bosque font-medium">
                Regístrate como productor
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">+500 productores</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">Respuesta 24h</span>
        </div>
      </div>
    </div>
  );
}