/**
 * @file step-stripe.tsx
 * @description Paso 5 del onboarding: configuración de pagos con Stripe Connect.
 *
 * Flujo de conexión embebido (Stripe Connect Embedded Components):
 *   1. El productor ve el componente StripeConnectOnboarding embebido.
 *   2. Se llama a POST /api/stripe/account-session → crea AccountSession.
 *   3. El componente monta el formulario de Stripe inline (sin redirección).
 *   4. Al salir (onExit), se verifica el estado real con GET /api/stripe/status
 *      y se vincula la cuenta con `saveStep5` (SIN `stripeConnected`: solo lo escribe el webhook).
 *   5. Se llama a `onRequestRefresh` para que el padre recargue el estado real del servidor.
 *
 * Props opcionales (precargan Stripe): `userEmail`, `firstName`, `lastName`,
 * `businessName` (del registro) y `website` (del Perfil comercial).
 */

'use client';

import * as React from 'react';
import { Alert, Checkbox } from '@arcediano/ux-library';
import { StripeConnectOnboarding } from '@/components/features/stripe/stripe-connect-onboarding';
import { useStripeConnectPolling } from '@/lib/stripe/use-stripe-connect-polling';
import type { StripeData } from '@/lib/onboarding/types';
import { AlertCircle, CheckCircle2, CreditCard, Info, Lock, Shield, Zap } from 'lucide-react';
import { FieldError } from '../FormBits';
import { StepSection } from '../StepSection';

export type { StripeData as EnhancedStripeData };

export interface EnhancedStep5PaymentsProps {
  data: StripeData;
  onChange: (data: StripeData) => void;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  /** Nombre del negocio (del registro) — precarga Stripe. */
  businessName?: string;
  /** Web del negocio (Perfil comercial) — precarga Stripe. */
  website?: string;
  /**
   * Recarga el estado desde el servidor tras completar el onboarding embebido.
   * Si devuelve una promesa, el polling espera a que resuelva antes del
   * siguiente tick, evitando peticiones solapadas.
   */
  onRequestRefresh?: () => void | Promise<void>;
  errors?: Record<string, string>;
}

export function EnhancedStep5Payments({
  data,
  onChange,
  userEmail,
  firstName,
  lastName,
  businessName,
  website,
  onRequestRefresh,
  errors = {},
}: EnhancedStep5PaymentsProps) {
  const handleVerified = React.useCallback(() => {
    if (onRequestRefresh) void onRequestRefresh();
  }, [onRequestRefresh]);

  // `onVerified` solo se dispara al cerrar el formulario embebido, normalmente
  // antes de que Stripe termine de verificar la cuenta. Sin este polling, un
  // productor que espera ver "¡Cuenta conectada!" nunca lo vería actualizarse.
  // Nivel lento: el formulario está siempre visible y el wizard permite
  // terminar sin Stripe conectado.
  const handlePollTick = React.useCallback(async () => {
    await onRequestRefresh?.();
  }, [onRequestRefresh]);

  useStripeConnectPolling({
    active: Boolean(data.stripeAccountId) && !data.stripeConnected,
    fastTier: false,
    onTick: handlePollTick,
  });

  const connected = data.stripeConnected;

  return (
    <div className="space-y-4">
      {!connected && (
        <Alert variant="warning" className="items-start">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Necesitas conectar Stripe para cobrar tus pedidos</span>
              <span className="mt-0.5 block text-sm">
                Puedes hacerlo ahora o más tarde desde tu panel, pero hasta entonces no podrás publicar productos ni cobrar pedidos.
              </span>
            </span>
          </span>
        </Alert>
      )}

      <StepSection
        icon={<CreditCard className="h-5 w-5" />}
        title="¿Cómo funcionan los pagos?"
        description="Stripe es nuestro proveedor de pagos certificado."
      >
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: 'Conecta', desc: 'Vincula tu cuenta bancaria con Stripe en menos de 5 minutos.' },
            { title: 'Vende', desc: 'Tus clientes pagan con tarjeta de forma segura.' },
            { title: 'Cobra', desc: 'El dinero llega a tu cuenta en 1-2 días laborables.' },
          ].map((item, i) => (
            <li
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-border-subtle bg-origen-crema/20 p-3 sm:flex-col sm:items-center sm:text-center"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-origen-bosque text-sm font-bold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold text-origen-bosque">{item.title}</span>
                <span className="mt-0.5 block text-xs text-text-subtle">{item.desc}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-feedback-success-text">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Pagos seguros · PCI-DSS
        </p>
      </StepSection>

      <StepSection
        icon={connected ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        title={connected ? '¡Cuenta conectada!' : 'Conectar cuenta de cobro'}
        description={
          connected
            ? 'Stripe está configurado y listo para procesar pagos.'
            : 'Necesitarás tu email, IBAN y DNI/CIF.'
        }
        className={connected ? 'border-feedback-success/40' : undefined}
      >
        {connected ? (
          <Alert variant="success">
            Tu cuenta bancaria está lista para recibir los pagos de tus pedidos.
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="flex items-start gap-2 rounded-xl border border-origen-pradera/20 bg-origen-crema/30 p-3 text-xs text-text-subtle">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-hoja-tinta" aria-hidden="true" />
              <span>
                ¿No tienes cuenta de Stripe? <span className="font-medium">La creas durante el proceso, es gratis</span>: solo hace falta un email y tus datos bancarios.
              </span>
            </p>

            <StripeConnectOnboarding
              stripeAccountId={data.stripeAccountId}
              source="onboarding"
              onboardingContext={{ email: userEmail, firstName, lastName, businessName, website }}
              onVerified={handleVerified}
            />

            <p className="flex items-center gap-2 text-xs text-text-subtle">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Conexión segura · Cifrado SSL · Datos protegidos
            </p>
          </div>
        )}
      </StepSection>

      <StepSection
        icon={<Shield className="h-5 w-5" />}
        title="Términos y condiciones"
        description="Necesario para finalizar."
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="accept-terms"
            checked={data.acceptTerms}
            onCheckedChange={(c) => onChange({ ...data, acceptTerms: c === true })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2"
            aria-describedby={errors['accept-terms'] ? 'accept-terms-error' : undefined}
          />
          <div className="min-w-0 flex-1">
            <label htmlFor="accept-terms" className="block min-h-6 cursor-pointer text-sm font-medium text-origen-bosque">
              He leído y acepto los términos y condiciones de Stripe y de Origen
            </label>
            <p className="mt-1 text-xs leading-relaxed text-text-subtle">
              Al operar en Origen aceptas los{' '}
              <a href="https://stripe.com/es/legal" target="_blank" rel="noopener noreferrer" className="text-hoja-tinta underline underline-offset-2">
                Términos de Stripe
              </a>{' '}
              y la{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="text-hoja-tinta underline underline-offset-2">
                Política de privacidad de Origen
              </a>
              .
            </p>
            <div className="mt-2"><FieldError id="accept-terms-error">{errors['accept-terms']}</FieldError></div>
          </div>
        </div>
      </StepSection>
    </div>
  );
}

EnhancedStep5Payments.displayName = 'EnhancedStep5Payments';

export default EnhancedStep5Payments;
