/**
 * Página de refresco del Account Link de Stripe.
 *
 * Stripe redirige aquí cuando el Account Link expira (caducidad de 5 minutos)
 * o cuando el productor vuelve atrás sin completar el formulario.
 * URL esperada: /onboarding/stripe/refresh?accountId=acct_xxx
 *
 * Flujo:
 *   1. Lee `accountId` de los query params
 *   2. Genera un nuevo Account Link llamando a POST /api/stripe/connect/refresh
 *   3. Redirige automáticamente al nuevo enlace de Stripe
 *
 * Nota: `useSearchParams()` requiere Suspense — el contenido se extrae a
 * `StripeRefreshContent` y la página lo envuelve con un fallback de carga.
 */

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/shared';

// ─── Contenido principal (usa useSearchParams) ────────────────────────────────

function StripeRefreshContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');

  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!accountId) {
      setError(true);
      return;
    }

    refreshLink(accountId);
  }, [accountId]);

  async function refreshLink(acctId: string) {
    try {
      const res = await fetch('/api/stripe/connect/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: acctId }),
      });
      const json = await res.json() as { success: boolean; data?: { onboardingUrl: string } };

      if (json.success && json.data?.onboardingUrl) {
        window.location.href = json.data.onboardingUrl;
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">
        <RefreshCw className="w-12 h-12 text-gray-400 mx-auto" />
        <h1 className="text-xl font-bold text-origen-bosque">Enlace expirado</h1>
        <p className="text-sm text-gray-600 mb-4">
          No pudimos renovar el enlace de Stripe. Vuelve al onboarding e inténtalo de nuevo.
        </p>
        <button
          onClick={() => router.push('/onboarding')}
          className="w-full h-11 bg-origen-bosque text-white rounded-xl text-sm font-medium hover:bg-origen-pino transition-colors"
        >
          Volver al onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">
      <Spinner size="xl" variant="primary" className="mx-auto" />
      <h1 className="text-xl font-bold text-origen-bosque">Renovando enlace...</h1>
      <p className="text-sm text-gray-500">
        El enlace anterior expiró. Generando uno nuevo, serás redirigido automáticamente.
      </p>
    </div>
  );
}

// ─── Página (envuelve en Suspense para satisfacer el requisito de Next.js) ────

export default function StripeRefreshPage() {
  return (
    <div className="min-h-screen bg-origen-crema flex items-center justify-center p-6">
      <React.Suspense
        fallback={
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">
            <Spinner size="xl" variant="primary" className="mx-auto" />
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        }
      >
        <StripeRefreshContent />
      </React.Suspense>
    </div>
  );
}
