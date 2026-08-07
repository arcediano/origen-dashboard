'use client';

import * as React from 'react';
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from '@stripe/react-connect-js';
import { Spinner } from '@/components/shared';
import { AlertCircle } from 'lucide-react';
import { stripeConnectAppearance, stripeConnectFonts } from '@/lib/stripe/connect-appearance';
import { saveStep6 } from '@/lib/api/onboarding';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

interface StripeConnectOnboardingProps {
  stripeAccountId?: string | null;
  source: 'onboarding' | 'account_payments';
  onboardingContext: {
    email?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    website?: string;
  };
  onVerified: () => void;
  onError?: (message: string) => void;
}

/**
 * Componente reutilizable para Stripe Connect Embedded Components.
 * Monta el flujo de onboarding inline sin redirigir fuera de la app.
 *
 * CRÍTICO (G2 fix): onExit nunca marca stripeConnected: true en el payload.
 * La fuente de verdad sigue siendo el webhook de Stripe.
 */
export function StripeConnectOnboarding({
  stripeAccountId,
  source,
  onboardingContext,
  onVerified,
  onError,
}: StripeConnectOnboardingProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');

  /**
   * Fetch del clientSecret desde el endpoint de account-session.
   */
  const fetchClientSecret = React.useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/account-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: stripeAccountId ?? undefined,
          email: onboardingContext.email,
          firstName: onboardingContext.firstName,
          lastName: onboardingContext.lastName,
          businessName: onboardingContext.businessName,
          website: onboardingContext.website,
          source,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la sesión de Stripe');
      }

      const data = await response.json() as {
        success: boolean;
        data?: { accountId: string; clientSecret: string };
      };
      if (!data.data?.clientSecret) {
        throw new Error('No client secret returned');
      }

      // IMPORTANTE: No loguear el clientSecret
      return data.data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      if (onError) {
        onError(message);
      }
      throw err;
    }
  }, [stripeAccountId, onboardingContext, source, onError]);

  /**
   * Se dispara cuando el componente embebido carga.
   * Ocultar el spinner cuando Stripe ha montado el iframe.
   */
  const handleLoaderStart = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Se dispara si hay un error cargando el componente embebido.
   */
  const handleLoadError = React.useCallback(
    (err: any) => {
      const message = err?.error?.message || 'Error desconocido';
      setError(message);
      if (onError) {
        onError(message);
      }
    },
    [onError]
  );

  /**
   * Se dispara cuando el usuario sale del flujo de onboarding (completado o abandonado).
   *
   * CRÍTICO (G2 fix - punto 6 del encargo):
   *   1. Leer el estado real de Stripe vía GET /api/stripe/status
   *   2. Guardar con saveStep6 PERO SIN incluir stripeConnected: true
   *   3. Llamar a onVerified() para que el padre recargue el estado real
   *
   * El campo stripeConnected debe seguir derivándose ÚNICAMENTE del webhook,
   * nunca del hecho de que onExit se haya disparado.
   */
  const handleExit = React.useCallback(async () => {
    if (!stripeAccountId) return;

    try {
      // Paso 1: Leer el estado real de la cuenta desde Stripe (server-side check)
      const statusResponse = await fetch(
        `${API_BASE_URL}/api/stripe/status?accountId=${encodeURIComponent(stripeAccountId)}`,
        { method: 'GET' },
      );

      if (!statusResponse.ok) {
        console.error('Failed to check account status');
        // No fallar aquí - continuar con el flujo normal
      } else {
        const statusData = await statusResponse.json() as {
          success: boolean;
          data?: { detailsSubmitted?: boolean; chargesEnabled?: boolean };
        };

        // Paso 2: Guardar step6 CON acceptTerms: true, PERO SIN stripeConnected
        // (ver tipo EnhancedStep6StripeData - stripeConnected es opcional)
        if (statusData.data?.detailsSubmitted) {
          await saveStep6({
            stripeAccountId,
            acceptTerms: true,
            // IMPORTANTE: NO incluir stripeConnected aquí
            // La fuente de verdad es el webhook que escribió detailsSubmitted
          });
        }
      }
    } catch (err) {
      console.error('Error in onExit handler:', err);
      // No fallar el flujo - al menos notificamos al padre
    }

    // Paso 3: Avisar al padre que recargue el estado real
    // El padre debe llamar al endpoint de readiness/producersOnboarding/data
    // para obtener los datos REALES que el webhook puso en BD
    onVerified();
  }, [stripeAccountId, onVerified]);

  // Si no hay stripeAccountId, mostrar error
  if (!stripeAccountId) {
    return (
      <div className="w-full p-4 bg-feedback-danger-subtle rounded-xl border border-feedback-danger/30 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle className="w-4 h-4 text-feedback-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-feedback-danger-text">
            No se pudo iniciar el onboarding de Stripe. Por favor, intenta de nuevo.
          </p>
        </div>
      </div>
    );
  }

  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="w-full p-4 bg-feedback-danger-subtle rounded-xl border border-feedback-danger/30 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle className="w-4 h-4 text-feedback-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-feedback-danger-text">
            No se pudo inicializar Stripe Connect. Por favor, recarga la página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-feedback-danger-subtle rounded-xl border border-feedback-danger/30 flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="flex items-start gap-2 flex-1">
            <AlertCircle className="w-4 h-4 text-feedback-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-feedback-danger-text">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="self-end text-xs font-medium text-feedback-danger-text underline underline-offset-2 sm:self-auto"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Nota: Los tipos de @stripe/react-connect-js tienen restricciones.
          Usamos `any` para pasar los props correctos según la documentación de Stripe.
          Esta estructura es válida según la guía oficial. */}
      {(() => {
        const ConnectProvider = ConnectComponentsProvider as any;
        const ConnectComponent = ConnectAccountOnboarding as any;
        return (
          <ConnectProvider
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            appearance={stripeConnectAppearance}
            fonts={stripeConnectFonts}
          >
            <ConnectComponent
              onLoaderStart={handleLoaderStart}
              onLoadError={handleLoadError}
              onExit={handleExit}
              collectionOptions={{
                fields: 'currently_due',
                futureRequirements: 'include',
              }}
              fetchClientSecret={fetchClientSecret}
            />
          </ConnectProvider>
        );
      })()}
    </div>
  );
}

StripeConnectOnboarding.displayName = 'StripeConnectOnboarding';
export default StripeConnectOnboarding;
