/**
 * @page Configuración de Pagos
 * @version 1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button } from '@arcediano/ux-library';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { loadOnboardingData } from '@/lib/api/onboarding';

export default function PagosPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [acceptedTermsAt, setAcceptedTermsAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPaymentState = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await loadOnboardingData();
        const payment = response?.data?.payment;

        if (!mounted) return;

        setIsConnected(!!payment?.stripeConnected);
        setStripeAccountId(payment?.stripeAccountId ?? null);
        setAcceptedTermsAt(payment?.acceptedTermsAt ?? null);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Error al cargar estado de cobros');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadPaymentState();

    return () => {
      mounted = false;
    };
  }, []);

  const handleConnectStripe = () => {
    router.push('/onboarding?step=6');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">

      {/* Cabecera canónica */}
      <PageHeader
        title="Cobros"
        description="Gestiona Stripe, el estado de tu cuenta y cómo cobras tus ventas"
        badgeIcon={CreditCard}
        badgeText="Cobros"
        tooltip="Cobros"
        tooltipDetailed="Conecta y gestiona tu cuenta de Stripe para recibir pagos, revisar verificaciones y evitar bloqueos."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">

        {loadError && (
          <Alert className="mb-5 border-feedback-danger/30 bg-feedback-danger/10">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <div className="mb-5 rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <CreditCard className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Cobros listos para vender</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Mantén activa tu integración con Stripe para recibir pagos sin fricción y con trazabilidad.</p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-origen-pradera" />
              Stripe Connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-origen-pradera" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Procesa pagos con tarjeta, transferencia y métodos locales</p>
              </div>
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
              ) : (
                <Button variant="primary" onClick={handleConnectStripe} disabled={isLoading}>
                  Conectar Stripe
                </Button>
              )}
            </div>

            {isConnected && (
              <div className="p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-origen-pradera" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">Cuenta verificada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Puedes recibir pagos de forma inmediata.
                    </p>
                    {stripeAccountId && (
                      <p className="text-xs text-muted-foreground mt-1">Cuenta Stripe: {stripeAccountId}</p>
                    )}
                    {acceptedTermsAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Terminos aceptados: {new Date(acceptedTermsAt).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-origen-hoja/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-origen-bosque" />
                </div>
                <div>
                  <p className="text-sm font-medium text-origen-bosque">Siguiente recomendación</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verifica periódicamente tus datos fiscales y bancarios para evitar pausas en la liquidación.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
