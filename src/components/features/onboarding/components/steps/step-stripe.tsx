// 📁 /src/components/onboarding/steps/EnhancedStep6Stripe.tsx
/**
 * @file EnhancedStep6Stripe.tsx
 * @description Paso 6: Configuración de pagos — Fase 1 (simulación + info post-aprobación)
 * @version 5.0.0 - Diseño 3 cards: Explicación → Conectar → Términos
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/atoms/button';
import { Checkbox } from '@/components/ui/atoms/checkbox';

import {
  CreditCard,
  Shield,
  CheckCircle2,
  Lock,
  Zap,
  Info,
  Euro,
  ArrowRight,
  Mail,
} from 'lucide-react';

// Euro is kept for the "Vende" step icon in the how-it-works grid

// ============================================================================
// TIPOS
// ============================================================================

export interface EnhancedStep6StripeData {
  stripeConnected: boolean;
  acceptTerms: boolean;
}

export interface EnhancedStep6StripeProps {
  data: EnhancedStep6StripeData;
  onChange: (data: EnhancedStep6StripeData) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep6Stripe({ data, onChange }: EnhancedStep6StripeProps) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  // ========================================================================
  // MANEJADORES
  // ========================================================================

  const handleConnect = async () => {
    setIsConnecting(true);
    // Fase 1: simulación — en Fase 2 esto redirigirá al OAuth de Stripe
    await new Promise(resolve => setTimeout(resolve, 1800));
    onChange({ ...data, stripeConnected: true });
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    onChange({ stripeConnected: false, acceptTerms: false });
  };

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    onChange({ ...data, acceptTerms: checked === true });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">

      {/* ====================================================================
          CARD 1: CÓMO FUNCIONA
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">¿Cómo funcionan los pagos?</h2>
            <p className="text-sm text-gray-600">Stripe es nuestro proveedor de pagos certificado</p>
          </div>
        </div>

        {/* Steps explicativos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: CreditCard,
              title: 'Conecta',
              desc: 'Vincula tu cuenta bancaria a través de Stripe en menos de 5 minutos',
              step: '1',
            },
            {
              icon: Euro,
              title: 'Vende',
              desc: 'Tus clientes pagan con tarjeta, bizum o transferencia de forma segura',
              step: '2',
            },
            {
              icon: Zap,
              title: 'Cobra',
              desc: 'El dinero llega a tu cuenta en 1-2 días laborables automáticamente',
              step: '3',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-3 p-4 bg-origen-crema/20 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-origen-pradera text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-origen-bosque text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* PCI Badge */}
        <div className="mt-5 flex justify-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <Shield className="w-3.5 h-3.5" />
            Pagos seguros · PCI-DSS compliant
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: CONECTAR CUENTA
      ==================================================================== */}
      <div className={cn(
        "bg-white rounded-2xl border p-6 md:p-8 shadow-sm transition-all",
        data.stripeConnected ? "border-green-200" : "border-gray-200 hover:border-origen-pradera/30"
      )}>

        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            data.stripeConnected
              ? "bg-green-50"
              : "bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20"
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
            <p className="text-sm text-gray-600">
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
                <p className="text-sm font-medium text-green-800">Simulación completada correctamente</p>
                <p className="text-xs text-green-700 mt-1">
                  En producción, aquí se mostrará la cuenta bancaria y el estado real de tu cuenta Stripe.
                </p>
              </div>
            </div>

            {/* Fase 1: aviso de conexión real por email */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <span className="font-medium">Nota:</span> La conexión real con Stripe se completará por email una vez que tu perfil sea aprobado por nuestro equipo. Te avisaremos en 24-48h.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Cambiar cuenta
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
                <span>
                  ¿No tienes cuenta Stripe? <span className="font-medium">La crearás durante el proceso, es gratis</span>.
                  Solo necesitas un email y tus datos bancarios.
                </span>
              </p>
            </div>

            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="h-12 px-8 bg-origen-bosque hover:bg-origen-pino text-white text-base min-w-[220px]"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Conectando con Stripe...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Conectar con Stripe
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Conexión segura · Cifrado SSL · Datos protegidos</span>
            </div>

            <p className="text-xs text-gray-400">
              Este paso es opcional — podrás conectarlo más tarde desde tu panel
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 3: TÉRMINOS
      ==================================================================== */}
      <div className={cn(
        "bg-white rounded-2xl border p-6 md:p-8 shadow-sm transition-all",
        !data.stripeConnected && "opacity-60",
        data.stripeConnected && "border-gray-200 hover:border-origen-pradera/30"
      )}>

        <div className="flex items-start gap-4">
          <Checkbox
            id="accept-terms"
            checked={data.acceptTerms}
            onCheckedChange={handleTermsChange}
            disabled={!data.stripeConnected}
            className={cn(
              "h-5 w-5 rounded-md border-2 mt-0.5 flex-shrink-0",
              !data.stripeConnected && "cursor-not-allowed"
            )}
          />
          <div className="flex-1">
            <label
              htmlFor="accept-terms"
              className={cn(
                "text-sm font-medium text-origen-bosque",
                data.stripeConnected ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              Acepto los términos y condiciones de Stripe y de Origen
            </label>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Al conectar, aceptas los{' '}
              <a href="https://stripe.com/es/legal" target="_blank" rel="noopener noreferrer"
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2">
                Términos de Stripe
              </a>{' '}y la{' '}
              <a href="#" onClick={(e) => e.preventDefault()}
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2">
                Política de privacidad de Origen
              </a>.
            </p>
            {!data.stripeConnected && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                <Info className="w-3.5 h-3.5" />
                Conecta Stripe primero para aceptar los términos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          RESUMEN FINAL
      ==================================================================== */}
      {data.stripeConnected && data.acceptTerms && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">¡Todo listo para finalizar!</h3>
              <p className="text-sm text-green-700 mt-0.5">
                Puedes completar tu registro ahora. La conexión real con Stripe llegará por email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TRUST BADGES
      ==================================================================== */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-500 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Pagos seguros</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
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
