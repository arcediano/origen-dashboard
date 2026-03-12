// components/forms/SimpleForgotPassword.tsx
/**
 * @file SimpleForgotPassword.tsx
 * @description Formulario de recuperación de contraseña
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { requestPasswordReset } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

import {
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';

// ============================================================================
// ESTADO ÉXITO
// ============================================================================

function SuccessState({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center border border-origen-pradera/20">
        <CheckCircle2 className="w-10 h-10 text-origen-pradera" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-origen-bosque">Revisa tu correo</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
          Si <span className="font-medium text-origen-bosque">{email}</span> está registrado,
          recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
      </div>

      <div className="bg-origen-crema/60 rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-origen-bosque">¿No ves el email?</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-origen-pradera flex-shrink-0" />
            Revisa la carpeta de spam o correo no deseado
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-origen-pradera flex-shrink-0" />
            El enlace expira en 30 minutos
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-origen-pradera flex-shrink-0" />
            Comprueba que el email introducido es correcto
          </li>
        </ul>
      </div>

      <Link
        href="/auth/login"
        className="inline-flex items-center gap-2 text-sm text-origen-pradera hover:text-origen-bosque font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio de sesión
      </Link>
    </motion.div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function SimpleForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Introduce un email válido';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      // Siempre mostramos éxito aunque el email no exista (evita enumeración de usuarios)
      if (err instanceof GatewayError && err.status >= 500) {
        setError('Error del servidor. Inténtalo de nuevo más tarde.');
      } else {
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tarjeta principal */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">

        <AnimatePresence mode="wait">
          {submitted ? (
            <SuccessState key="success" email={email} />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-origen-bosque mb-1">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm text-gray-600">
                  Introduce tu email y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-origen-bosque flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-origen-pradera" />
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="nombre@productor.es"
                    autoFocus
                    className={cn(
                      'w-full h-12 px-4 text-sm',
                      'bg-white border rounded-xl',
                      'focus:outline-none focus:ring-2 focus:ring-origen-pradera/20',
                      'transition-all duration-200',
                      error
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:border-origen-pradera',
                    )}
                  />
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Botón */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12',
                    'bg-origen-bosque hover:bg-origen-pino',
                    'text-white text-sm font-semibold',
                    'rounded-xl shadow-md hover:shadow-lg',
                    'transition-all transform hover:-translate-y-0.5',
                    'disabled:opacity-50 disabled:hover:translate-y-0',
                    'mt-2',
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando enlace...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Enviar enlace de recuperación
                    </span>
                  )}
                </Button>

                {/* Volver al login */}
                <div className="text-center pt-1">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-origen-pradera transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">Enlace válido 30 min</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-origen-pradera" />
          <span className="text-gray-600">Email seguro</span>
        </div>
      </div>
    </div>
  );
}
