/**
 * @file reset-password-form.tsx
 * @description Formulario para establecer una nueva contraseña a partir del
 * token recibido por email (enlace de `SimpleForgotPassword`).
 *
 * Usa los componentes de la librería de UI:
 *   - `Input`  → contraseña/confirmación con toggle mostrar/ocultar integrado
 *   - `Button` → submit con estado de carga nativo
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { resetPassword } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

import { Button, Input } from '@arcediano/ux-library';

import { CheckCircle2, ArrowLeft, KeyRound, Lock } from 'lucide-react';

// ─── Estado de éxito ──────────────────────────────────────────────────────────

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center border border-origen-pradera/20">
        <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-hoja-tinta" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg md:text-xl font-bold text-origen-bosque">Contraseña actualizada</h3>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Ya puedes iniciar sesión en tu panel con tu nueva contraseña.
        </p>
      </div>

      <Link
        href="/auth/login"
        className="inline-flex items-center gap-2 text-sm text-hoja-tinta hover:underline font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Ir a iniciar sesión
      </Link>
    </motion.div>
  );
}

// ─── Enlace inválido/expirado ─────────────────────────────────────────────────

function InvalidTokenState() {
  return (
    <div className="text-center space-y-4">
      <h3 className="text-lg md:text-xl font-bold text-origen-bosque">Enlace no válido</h3>
      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        Este enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.
      </p>
      <Link
        href="/auth/forgot-password"
        className="inline-flex items-center gap-2 text-sm text-hoja-tinta hover:underline font-medium transition-colors"
      >
        Solicitar nuevo enlace
      </Link>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="bg-surface-alt rounded-2xl border border-border p-5 sm:p-6 md:p-8 shadow-lg">
          <InvalidTokenState />
        </div>
      </div>
    );
  }

  const validate = (): string => {
    if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword({ token, newPassword });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof GatewayError) {
        setError(err.message || 'No se pudo restablecer la contraseña. Solicita un nuevo enlace.');
      } else {
        setError('Error del servidor. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      <div className="bg-surface-alt rounded-2xl border border-border p-5 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">
        <AnimatePresence mode="wait">
          {submitted ? (
            <SuccessState key="success" />
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
                  <KeyRound className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-origen-bosque mb-1">
                  Crea tu nueva contraseña
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Elige una contraseña segura de al menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="password"
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  leftIcon={<Lock />}
                  inputSize="lg"
                />

                <Input
                  type="password"
                  label="Confirmar nueva contraseña"
                  placeholder="Repite la contraseña"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  leftIcon={<Lock />}
                  error={error}
                  inputSize="lg"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  loadingText="Guardando..."
                  className="w-full"
                >
                  Guardar nueva contraseña
                </Button>

                <div className="text-center pt-1">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-origen-pradera transition-colors"
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
    </div>
  );
}
