'use client';

import * as React from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import type { StripeConnectInstance } from '@stripe/connect-js';
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from '@stripe/react-connect-js';
import { Spinner } from '@/components/shared';
import { Alert, AlertDescription, Button } from '@arcediano/ux-library';
import { stripeConnectAppearance, stripeConnectFonts } from '@/lib/stripe/connect-appearance';
import { saveStep6 } from '@/lib/api/onboarding';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

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

  // Copia local del accountId real, porque fetchClientSecret puede crear una
  // cuenta Stripe nueva (productor sin stripeAccountId todavía) y ese valor
  // nunca llega de vuelta a través de la prop `stripeAccountId` del padre --
  // sin esto, handleExit seguía viendo undefined y no guardaba nada al salir
  // (bug detectado por auditor-seguridad tras el hotfix que quitó la guarda
  // de render: el crash desaparecía pero el fallo se movía, en silencio, al
  // punto de salida del flujo).
  const [resolvedAccountId, setResolvedAccountId] = React.useState<string | undefined | null>(
    stripeAccountId,
  );

  // fetchClientSecret se captura UNA sola vez dentro de loadConnectAndInitialize
  // (más abajo) — un ref, no el state, para que siempre lea el accountId más
  // reciente sin necesidad de recrear la instancia de Connect en cada cambio.
  const resolvedAccountIdRef = React.useRef(resolvedAccountId);
  resolvedAccountIdRef.current = resolvedAccountId;

  React.useEffect(() => {
    if (stripeAccountId) {
      setResolvedAccountId(stripeAccountId);
    }
  }, [stripeAccountId]);

  /**
   * Fetch del clientSecret desde el endpoint de account-session.
   */
  const fetchClientSecret = React.useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/stripe/account-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: resolvedAccountIdRef.current ?? undefined,
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

      // Capturar el accountId real (nuevo o reutilizado) para que handleExit
      // pueda usarlo -- sin esto, un productor nuevo nunca queda vinculado.
      if (data.data.accountId) {
        setResolvedAccountId(data.data.accountId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingContext, source, onError]);

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
    // Usa resolvedAccountId (real, capturado en fetchClientSecret), no la
    // prop stripeAccountId -- para un productor nuevo esa prop nunca se
    // actualiza durante esta sesión de montaje.
    if (!resolvedAccountId) return;

    try {
      // Paso 1: Leer el estado real de la cuenta desde Stripe (server-side check)
      const statusResponse = await fetch(
        `/api/stripe/status?accountId=${encodeURIComponent(resolvedAccountId)}`,
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
            stripeAccountId: resolvedAccountId,
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
  }, [resolvedAccountId, onVerified]);

  // Nota: NO se exige stripeAccountId aquí -- un productor nuevo llega sin
  // cuenta todavía. fetchClientSecret envía accountId undefined en ese caso,
  // y POST /api/stripe/account-session crea la cuenta Express server-side
  // (ver route.ts: "Si no viene accountId... crear cuenta nueva"). Cortar
  // el render aquí impedía que ese flujo se disparase nunca -- bloqueaba a
  // todo productor que aún no tuviera cuenta, el caso más común.

  // La instancia de Connect se crea UNA vez con loadConnectAndInitialize() —
  // no son props sueltas de ConnectComponentsProvider/ConnectAccountOnboarding
  // (esa API no existe; ConnectComponentsProvider solo acepta `connectInstance`).
  // Pasar publishableKey/appearance/fonts/fetchClientSecret directamente como
  // props, como hacía la versión anterior, deja `connectInstance` undefined y
  // el SDK revienta al intentar crear el componente embebido
  // ("Cannot read properties of undefined (reading 'create')").
  const connectInstanceRef = React.useRef<StripeConnectInstance | null>(null);
  if (!connectInstanceRef.current && STRIPE_PUBLISHABLE_KEY) {
    connectInstanceRef.current = loadConnectAndInitialize({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      fetchClientSecret,
      appearance: stripeConnectAppearance,
      fonts: stripeConnectFonts,
    });
  }

  if (!STRIPE_PUBLISHABLE_KEY || !connectInstanceRef.current) {
    return (
      <Alert variant="error">
        <AlertDescription>
          No se pudo inicializar Stripe Connect. Por favor, recarga la página.
        </AlertDescription>
      </Alert>
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
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setError('')}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      <ConnectComponentsProvider connectInstance={connectInstanceRef.current}>
        <ConnectAccountOnboarding
          onLoaderStart={handleLoaderStart}
          onLoadError={handleLoadError}
          onExit={handleExit}
          collectionOptions={{
            fields: 'currently_due',
            futureRequirements: 'include',
          }}
        />
      </ConnectComponentsProvider>
    </div>
  );
}

StripeConnectOnboarding.displayName = 'StripeConnectOnboarding';
export default StripeConnectOnboarding;
