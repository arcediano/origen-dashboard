/**
 * @file step-stripe.tsx
 * @description Paso 6 del onboarding: Configuración de pagos con Stripe Connect.
 *
 * Flujo de conexión embebido (Stripe Connect Embedded Components):
 *   1. Usuario ve Card 2 con componente StripeConnectOnboarding embebido
 *   2. Se llama a POST /api/stripe/account-session → crea AccountSession
 *   3. El componente embebido monta el formulario de Stripe inline (sin redirección)
 *   4. Usuario completa el onboarding dentro del iframe de Connect.js
 *   5. Al salir (onExit), se verifica el estado real con GET /api/stripe/status
 *   6. Se guarda con saveStep6 (SIN stripeConnected en el payload)
 *   7. Se llama a onRequestRefresh para que el padre recargue el estado real desde el servidor
 *
 * Props opcionales:
 *   userEmail       — Pre-rellena el email en la cuenta Stripe (del perfil del usuario)
 *   businessName    — Pre-rellena el nombre del negocio en Stripe (del paso 2)
 *   onRequestRefresh — Callback para que el padre recargue el estado (ej. loadOnboardingData)
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Button } from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { Spinner } from '@/components/shared';
import { StripeConnectOnboarding } from '@/components/features/stripe/stripe-connect-onboarding';

import {
  CreditCard,
  Shield,
  CheckCircle2,
  Lock,
  Zap,
  Info,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface EnhancedStep6StripeData {
  stripeConnected?: boolean; // ⚠️ G2 FIX: Ahora opcional (no se persiste desde el cliente)
  stripeAccountId?: string;
  acceptTerms: boolean;
}

export interface EnhancedStep6StripeProps {
  data: EnhancedStep6StripeData;
  onChange: (data: EnhancedStep6StripeData) => void;
  /** Email del usuario — pre-rellena la cuenta Stripe */
  userEmail?: string;
  /** Nombre del usuario */
  firstName?: string;
  /** Apellidos del usuario */
  lastName?: string;
  /** Nombre del negocio (paso 2) — pre-rellena Stripe */
  businessName?: string;
  /** Web del negocio (paso 2) — pre-rellena Stripe */
  website?: string;
  /** Callback para recargar el estado desde el servidor tras completar onboarding embebido */
  onRequestRefresh?: () => void;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function EnhancedStep6Stripe({
  data,
  onChange,
  userEmail,
  firstName,
  lastName,
  businessName,
  website,
  onRequestRefresh,
}: EnhancedStep6StripeProps) {
  // ── Manejadores ────────────────────────────────────────────────────────────

  /**
   * Se llama cuando el onboarding embebido se completa.
   * Recarga el estado real del servidor para que el padre vea los cambios.
   */
  const handleVerified = React.useCallback(() => {
    if (onRequestRefresh) {
      onRequestRefresh();
    }
  }, [onRequestRefresh]);

  const handleDisconnect = () => {
    onChange({ stripeConnected: false, stripeAccountId: undefined, acceptTerms: false });
  };

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    onChange({ ...data, acceptTerms: checked === true });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ──────────────────────────────────────────────────────────────────────
          BANNER DE IMPACTO — mobile-first, siempre visible si no conectado
      ────────────────────────────────────────────────────────────────────── */}
      {!data.stripeConnected && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-feedback-warning-subtle border border-feedback-warning/30 rounded-2xl">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-feedback-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-feedback-warning-text">
                Necesitas conectar Stripe para cobrar tus pedidos
              </p>
              <p className="text-xs text-feedback-warning-text/80 mt-0.5">
                Sin cuenta de pagos, los pedidos que recibas quedarán en espera y no podrás procesarlos.
                Puedes conectarlo ahora o después desde tu panel, pero hasta entonces no podrás operar.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-medium bg-feedback-warning-subtle text-feedback-warning-text px-2.5 py-1 rounded-full border border-feedback-warning/30">
            Pendiente de configurar
          </span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 1: CÓMO FUNCIONAN LOS PAGOS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface-alt rounded-2xl border border-border p-4 md:p-5 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-hoja-tinta" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-origen-bosque sm:text-xl">¿Cómo funcionan los pagos?</h2>
            <p className="text-sm text-muted-foreground">Stripe es nuestro proveedor de pagos certificado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Conecta',
              desc: 'Vincula tu cuenta bancaria a través de Stripe en menos de 5 minutos',
              step: '1',
            },
            {
              title: 'Vende',
              desc: 'Tus clientes pagan con tarjeta de forma segura',
              step: '2',
            },
            {
              title: 'Cobra',
              desc: 'El dinero llega a tu cuenta en 1-2 días laborables automáticamente',
              step: '3',
            },
          ].map((item) => (
              <div
                key={item.step}
                className="flex sm:flex-col items-start sm:items-center sm:text-center gap-3 p-4 bg-origen-crema/20 rounded-xl border border-border-subtle"
              >
                <div className="w-10 h-10 rounded-full bg-origen-bosque text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-origen-bosque text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-feedback-success-text bg-feedback-success-subtle px-3 py-1.5 rounded-full border border-feedback-success/30">
            <Shield className="w-3.5 h-3.5" />
            Pagos seguros · PCI-DSS compliant
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 2: CONECTAR CUENTA
      ────────────────────────────────────────────────────────────────────── */}
      <div className={cn(
        'bg-surface-alt rounded-2xl border p-4 md:p-5 shadow-sm transition-all',
        data.stripeConnected ? 'border-feedback-success/40' : 'border-border hover:border-origen-pradera/30',
      )}>

        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            data.stripeConnected
              ? 'bg-feedback-success-subtle'
              : 'bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20',
          )}>
            {data.stripeConnected
              ? <CheckCircle2 className="w-6 h-6 text-feedback-success" />
              : <Zap className="w-6 h-6 text-hoja-tinta" />
            }
          </div>
          <div>
            <h2 className="text-lg font-bold text-origen-bosque sm:text-xl">
              {data.stripeConnected ? '¡Cuenta conectada!' : 'Conectar cuenta de cobro'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data.stripeConnected
                ? 'Stripe está configurado y listo para procesar pagos'
                : 'Necesitarás email, IBAN y DNI/CIF'}
            </p>
          </div>
        </div>

        {data.stripeConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-feedback-success-subtle rounded-xl border border-feedback-success/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-feedback-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-feedback-success-text">Cuenta Stripe conectada correctamente</p>
                <p className="text-xs text-feedback-success-text/80 mt-1">
                  Tu cuenta bancaria está lista para recibir los pagos de tus pedidos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-text-subtle hover:text-muted-foreground underline underline-offset-2"
            >
              Cambiar cuenta
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Aviso de qué datos necesita el productor */}
            <div className="w-full p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 text-hoja-tinta flex-shrink-0 mt-0.5" />
                <span>
                  ¿No tienes cuenta Stripe?{' '}
                  <span className="font-medium">La crearás durante el proceso, es gratis</span>.
                  Solo necesitas un email y tus datos bancarios.
                </span>
              </p>
            </div>

            {/* Componente embebido de Stripe Connect */}
            <StripeConnectOnboarding
              stripeAccountId={data.stripeAccountId}
              source="onboarding"
              onboardingContext={{
                email: userEmail,
                firstName,
                lastName,
                businessName,
                website,
              }}
              onVerified={handleVerified}
            />

            <div className="flex items-center gap-2 text-xs text-text-subtle">
              <Lock className="w-3.5 h-3.5" />
              <span>Conexión segura · Cifrado SSL · Datos protegidos</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Completa el onboarding de Stripe en este formulario. Tus pedidos quedarán en espera hasta que conectes tu cuenta bancaria.
            </p>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 3: TÉRMINOS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface-alt rounded-2xl border border-border p-4 md:p-5 shadow-sm hover:border-origen-pradera/30 transition-all">
        <div className="flex items-start gap-4">
          <Checkbox
            id="accept-terms"
            checked={data.acceptTerms}
            onCheckedChange={handleTermsChange}
            className="h-5 w-5 rounded-md border-2 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1">
            <label htmlFor="accept-terms" className="text-sm font-medium text-origen-bosque cursor-pointer">
              He leído y acepto los términos y condiciones de Stripe y de Origen
            </label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Al operar en Origen aceptas los{' '}
              <a
                href="https://stripe.com/es/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hoja-tinta hover:underline underline underline-offset-2"
              >
                Términos de Stripe
              </a>{' '}y la{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-hoja-tinta hover:underline underline underline-offset-2"
              >
                Política de privacidad de Origen
              </a>.
              Puedes leerlos antes de conectar tu cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          RESUMEN FINAL
      ────────────────────────────────────────────────────────────────────── */}
      {data.stripeConnected && data.acceptTerms && (
        <div className="bg-feedback-success-subtle rounded-2xl border border-feedback-success/30 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-feedback-success/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-feedback-success" />
            </div>
            <div>
              <h3 className="font-semibold text-feedback-success-text">¡Todo listo para finalizar!</h3>
              <p className="text-sm text-feedback-success-text/80 mt-0.5">
                Tu cuenta de cobro está conectada y los términos aceptados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-hoja-tinta" />
          <span>Pagos seguros</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-hoja-tinta" />
          <span>Protección contra fraude</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep6Stripe.displayName = 'EnhancedStep6Stripe';
export default EnhancedStep6Stripe;

