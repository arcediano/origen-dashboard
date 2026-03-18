// components/forms/SimpleForgotPassword.tsx
/**
 * @file SimpleForgotPassword.tsx
 * @description Formulario de recuperación de contraseña
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/atoms/button';
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
import { Spinner } from '@/components/shared';

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
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center border border-origen-pradera/20">
        <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-origen-pradera" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg md:text-xl font-bold text-origen-bosque">Revisa tu correo</h3>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
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
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      {/* Tarjeta principal */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">

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
              <div className="text-center mb-6 md:mb-8">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
                  <Lock className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-origen-bosque mb-1">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  Introduce tu email y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo email */}
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
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
                      'w-full h-11 md:h-12 px-3 md:px-4 text-sm',
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
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Botón */}
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "w-full max-w-xs h-12",
                      "bg-origen-bosque hover:bg-origen-pino",
                      "text-white text-sm font-semibold",
                      "rounded-xl shadow-md hover:shadow-lg",
                      "transition-all transform hover:-translate-y-0.5",
                      "disabled:opacity-50 disabled:hover:translate-y-0"
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" variant="white" />
                        Enviando enlace...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Enviar enlace de recuperación
                      </span>
                    )}
                  </Button>
                </div>

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
      <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs">
        <div className="flex items-center gap-1 group cursor-default">
          <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera group-hover:text-origen-hoja transition-colors" />
          <span className="text-gray-600 group-hover:text-gray-800 transition-colors">SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
        <div className="flex items-center gap-1 group cursor-default">
          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera group-hover:text-origen-hoja transition-colors" />
          <span className="text-gray-600 group-hover:text-gray-800 transition-colors">Enlace válido 30 min</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
        <div className="flex items-center gap-1 group cursor-default">
          <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 text-origen-pradera group-hover:text-origen-hoja transition-colors" />
          <span className="text-gray-600 group-hover:text-gray-800 transition-colors">Email seguro</span>
        </div>
      </div>
    </div>
  );
}
