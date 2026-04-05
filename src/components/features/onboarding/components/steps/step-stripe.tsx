/**
 * @file step-stripe.tsx
 * @description Paso 6 del onboarding: Configuración de pagos con Stripe Connect.
 *
 * Flujo real de conexión:
 *   1. Usuario hace clic en "Conectar con Stripe"
 *   2. Se llama a POST /api/stripe/connect → crea cuenta Express en Stripe
 *   3. Se guarda el stripeAccountId en BD (saveStep6) antes de redirigir,
 *      por si el usuario abandona el flujo de Stripe a mitad
 *   4. Se redirige a la URL de onboarding de Stripe
 *   5. Stripe redirige a /onboarding/stripe/complete?accountId=xxx al terminar
 *   6. La página complete verifica el estado y actualiza stripeConnected=true en BD
 *
 * Props opcionales:
 *   userEmail    — Pre-rellena el email en la cuenta Stripe (del perfil del usuario)
 *   businessName — Pre-rellena el nombre del negocio en Stripe (del paso 2)
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Button } from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { saveStep6 } from '@/lib/api/onboarding';
import { Spinner } from '@/components/shared';

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
  stripeConnected: boolean;
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
}: EnhancedStep6StripeProps) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState('');

  // ── Manejadores ────────────────────────────────────────────────────────────

  /**
   * Inicia el flujo real de Stripe Connect:
   *   1. Crea la cuenta Express en Stripe vía API route interna
   *   2. Guarda el stripeAccountId en BD antes de redirigir (tolerancia a fallos)
   *   3. Redirige a la URL de onboarding de Stripe
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError('');

    try {
      // 1. Crear cuenta Stripe Express
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          firstName,
          lastName,
          businessName,
          website,
        }),
      });

      const json = await res.json() as {
        success: boolean;
        data?: { accountId: string; onboardingUrl: string };
        error?: string;
        detail?: string;
      };

      if (!json.success || !json.data) {
        const errorMsg = json.detail
          ? `${json.error}: ${json.detail}`
          : (json.error ?? 'Error al crear la cuenta Stripe');
        throw new Error(errorMsg);
      }

      const { accountId, onboardingUrl } = json.data;

      // 2. Persistir el accountId ANTES de redirigir — si el usuario abandona
      //    el flujo de Stripe, el ID queda guardado para poder reanudar después
      await saveStep6({
        stripeConnected: false,
        stripeAccountId: accountId,
        acceptTerms: false,
      });

      // 3. Redirigir al onboarding de Stripe (misma ventana)
      window.location.href = onboardingUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setConnectError(msg);
      setIsConnecting(false);
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Necesitas conectar Stripe para cobrar tus pedidos
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Sin cuenta de pagos, los pedidos que recibas quedarán en espera y no podrás procesarlos.
                Puedes conectarlo ahora o después desde tu panel, pero hasta entonces no podrás operar.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-amber-200">
            Pendiente de configurar
          </span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 1: CÓMO FUNCIONAN LOS PAGOS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">¿Cómo funcionan los pagos?</h2>
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
              desc: 'Tus clientes pagan con tarjeta, bizum o transferencia de forma segura',
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
                <div className="w-10 h-10 rounded-full bg-origen-pradera text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
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
          <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <Shield className="w-3.5 h-3.5" />
            Pagos seguros · PCI-DSS compliant
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 2: CONECTAR CUENTA
      ────────────────────────────────────────────────────────────────────── */}
      <div className={cn(
        'bg-surface-alt rounded-2xl border p-6 md:p-8 shadow-sm transition-all',
        data.stripeConnected ? 'border-green-200' : 'border-border hover:border-origen-pradera/30',
      )}>

        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            data.stripeConnected
              ? 'bg-green-50'
              : 'bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20',
          )}>
            {data.stripeConnected
              ? <CheckCircle2 className="w-6 h-6 text-green-600" />
              : <Zap className="w-6 h-6 text-origen-pradera" />
            }
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">
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
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Cuenta Stripe conectada correctamente</p>
                <p className="text-xs text-green-700 mt-1">
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
          <div className="flex flex-col items-center gap-4">
            {/* Aviso de qué datos necesita el productor */}
            <div className="w-full p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
                <span>
                  ¿No tienes cuenta Stripe?{' '}
                  <span className="font-medium">La crearás durante el proceso, es gratis</span>.
                  Solo necesitas un email y tus datos bancarios.
                </span>
              </p>
            </div>

            {/* Error de conexión con reintento */}
            {connectError && (
              <div className="w-full p-3 bg-feedback-danger-subtle rounded-xl border border-red-200 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <AlertCircle className="w-4 h-4 text-feedback-danger flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{connectError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectError('')}
                  className="text-xs font-medium text-red-700 underline underline-offset-2 whitespace-nowrap self-end sm:self-auto"
                >
                  Reintentar
                </button>
              </div>
            )}

            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full sm:w-auto h-12 px-8 bg-origen-bosque hover:bg-origen-pino text-white text-base"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" variant="white" />
                  Conectando con Stripe...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Conectar con Stripe
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 text-xs text-text-subtle">
              <Lock className="w-3.5 h-3.5" />
              <span>Conexión segura · Cifrado SSL · Datos protegidos</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              También puedes conectarlo después desde tu panel, pero tus pedidos quedarán en espera hasta entonces.
            </p>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          CARD 3: TÉRMINOS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:border-origen-pradera/30 transition-all">
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
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2"
              >
                Términos de Stripe
              </a>{' '}y la{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2"
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
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">¡Todo listo para finalizar!</h3>
              <p className="text-sm text-green-700 mt-0.5">
                Tu cuenta de cobro está conectada y los términos aceptados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Pagos seguros</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Protección contra fraude</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep6Stripe.displayName = 'EnhancedStep6Stripe';
export default EnhancedStep6Stripe;
