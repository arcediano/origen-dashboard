/**
 * Página de retorno tras completar el onboarding de Stripe Connect.
 *
 * Stripe redirige aquí cuando el productor finaliza el formulario de conexión.
 * URL esperada: /onboarding/stripe/complete?accountId=acct_xxx
 *
 * Flujo:
 *   1. Lee `accountId` de los query params
 *   2. Verifica el estado de la cuenta con GET /api/stripe/status
 *   3. Si detailsSubmitted → actualiza step 6 como conectado vía saveStep6()
 *   4. Redirige a /onboarding con mensaje de éxito
 *
 * Nota: `useSearchParams()` requiere Suspense — el contenido se extrae a
 * `StripeCompleteContent` y la página lo envuelve con un fallback de carga.
 */

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { saveStep6 } from '@/lib/api/onboarding';
import { Spinner } from '@/components/shared';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type VerificationState = 'verifying' | 'success' | 'incomplete' | 'error';

// ─── Contenido principal (usa useSearchParams) ────────────────────────────────

function StripeCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');

  const [state, setState] = React.useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (!accountId) {
      setState('error');
      setErrorMessage('No se encontró el identificador de la cuenta Stripe.');
      return;
    }

    verifyAndSave(accountId);
  }, [accountId]);

  async function verifyAndSave(acctId: string) {
    try {
      // 1. Verificar estado de la cuenta en Stripe
      const res = await fetch(`/api/stripe/status?accountId=${acctId}`);
      const json = await res.json() as {
        success: boolean;
        data?: { detailsSubmitted: boolean; chargesEnabled: boolean };
      };

      if (!json.success || !json.data) {
        setState('error');
        setErrorMessage('No se pudo verificar el estado de la cuenta Stripe.');
        return;
      }

      if (!json.data.detailsSubmitted) {
        // El productor no completó el formulario — volver al onboarding
        setState('incomplete');
        return;
      }

      // 2. Actualizar el paso 6 en BD como conectado
      await saveStep6({
        stripeConnected: true,
        stripeAccountId: acctId,
        acceptTerms: true,
      });

      setState('success');

      // 3. Redirigir al onboarding tras 2 segundos
      setTimeout(() => router.push('/onboarding'), 2000);
    } catch {
      setState('error');
      setErrorMessage('Ocurrió un error al procesar la conexión con Stripe.');
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">

      {state === 'verifying' && (
        <>
          <Spinner size="xl" variant="primary" className="mx-auto" />
          <h1 className="text-xl font-bold text-origen-bosque">Verificando conexión...</h1>
          <p className="text-sm text-gray-500">Estamos confirmando tu cuenta con Stripe.</p>
        </>
      )}

      {state === 'success' && (
        <>
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
          <h1 className="text-xl font-bold text-origen-bosque">¡Cuenta conectada!</h1>
          <p className="text-sm text-gray-600">
            Tu cuenta Stripe está lista para recibir pagos. Redirigiendo al onboarding...
          </p>
        </>
      )}

      {state === 'incomplete' && (
        <>
          <XCircle className="w-14 h-14 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-origen-bosque">Conexión incompleta</h1>
          <p className="text-sm text-gray-600 mb-4">
            No completaste todos los pasos en Stripe. Puedes retomarlo cuando quieras.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full h-11 bg-origen-bosque text-white rounded-xl text-sm font-medium hover:bg-origen-pino transition-colors"
          >
            Volver al onboarding
          </button>
        </>
      )}

      {state === 'error' && (
        <>
          <XCircle className="w-14 h-14 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-origen-bosque">Error de conexión</h1>
          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full h-11 bg-origen-bosque text-white rounded-xl text-sm font-medium hover:bg-origen-pino transition-colors"
          >
            Volver al onboarding
          </button>
        </>
      )}

    </div>
  );
}

// ─── Página (envuelve en Suspense para satisfacer el requisito de Next.js) ────

export default function StripeCompletePage() {
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
        <StripeCompleteContent />
      </React.Suspense>
    </div>
  );
}
