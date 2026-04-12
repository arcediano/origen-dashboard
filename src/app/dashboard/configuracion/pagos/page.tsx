/**
 * @page Configuración de Pagos
 * @version 1.1.0
 */

'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button } from '@arcediano/ux-library';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight, Landmark, ShieldCheck, CircleEllipsis } from 'lucide-react';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { loadOnboardingData } from '@/lib/api/onboarding';
import { startStripeOnboarding } from '@/lib/stripe/connect-client';

export default function PagosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [acceptedTermsAt, setAcceptedTermsAt] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPaymentState = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await loadOnboardingData();
        const story = response?.data?.story;
        const fiscal = response?.data?.fiscal;
        const payment = response?.data?.payment;

        if (!mounted) return;

        setIsConnected(!!payment?.stripeConnected);
        setStripeAccountId(payment?.stripeAccountId ?? null);
        setAcceptedTermsAt(payment?.acceptedTermsAt ?? null);
        setBusinessName(story?.businessName ?? fiscal?.businessName ?? null);
        setWebsite(story?.website ?? null);
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

  const paymentStage = isConnected
    ? 'connected'
    : stripeAccountId
      ? 'pending'
      : 'empty';

  const handleOpenStripe = async () => {
    setIsOpeningStripe(true);
    setLoadError(null);

    try {
      await startStripeOnboarding({
        stripeAccountId,
        businessName: businessName ?? undefined,
        website: website ?? undefined,
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo abrir Stripe');
      setIsOpeningStripe(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
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

        <div className="space-y-5">
          <section className="rounded-[30px] border border-origen-pradera/20 bg-[linear-gradient(135deg,rgba(246,243,232,0.92),rgba(255,255,255,0.98))] p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
                    <CreditCard className="h-6 w-6 text-origen-pradera" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-origen-bosque leading-tight">Panel de cobros y liquidación</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-origen-bosque sm:text-3xl">
                      {paymentStage === 'connected' && 'Tu cuenta está lista para recibir pagos'}
                      {paymentStage === 'pending' && 'Te queda un paso para activar los cobros'}
                      {paymentStage === 'empty' && 'Conecta Stripe para empezar a cobrar'}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-subtle sm:text-base">
                      Centraliza aquí el estado de tu cuenta Stripe, revisa si puedes cobrar y abre directamente el onboarding si necesitas corregir datos fiscales o bancarios.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[300px]">
                <div className="flex flex-wrap gap-2">
                  <span className={paymentStage === 'connected' ? 'inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700' : paymentStage === 'pending' ? 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700' : 'inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-subtle'}>
                    {paymentStage === 'connected' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : paymentStage === 'pending' ? <CircleEllipsis className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {paymentStage === 'connected' ? 'Cobros activos' : paymentStage === 'pending' ? 'Onboarding pendiente' : 'Sin cuenta de cobro'}
                  </span>
                  {acceptedTermsAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-subtle">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Terminos aceptados
                    </span>
                  )}
                </div>

                <Button onClick={handleOpenStripe} disabled={isLoading || isOpeningStripe} className="w-full lg:w-auto">
                  <span className="inline-flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isOpeningStripe
                        ? 'Abriendo Stripe...'
                        : paymentStage === 'connected'
                          ? 'Modificar cuenta en Stripe'
                          : paymentStage === 'pending'
                            ? 'Continuar onboarding de Stripe'
                            : 'Crear cuenta de cobro'}
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Landmark className="h-5 w-5 text-origen-pradera" aria-hidden="true" />
                  Estado de la cuenta de cobro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">Stripe</p>
                    <p className="mt-2 text-sm font-semibold text-origen-bosque">
                      {paymentStage === 'connected' ? 'Operativo' : paymentStage === 'pending' ? 'Pendiente' : 'No configurado'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{paymentStage === 'connected' ? 'Puedes seguir cobrando y editar datos cuando lo necesites.' : paymentStage === 'pending' ? 'La cuenta existe pero aún no terminó la verificación.' : 'Todavía no has iniciado el alta en Stripe.'}</p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">Cuenta</p>
                    <p className="mt-2 truncate text-sm font-semibold text-origen-bosque">{stripeAccountId ?? 'Se generará al iniciar el alta'}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Identificador técnico de Stripe asociado a tu perfil comercial.</p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">Verificación</p>
                    <p className="mt-2 text-sm font-semibold text-origen-bosque">{acceptedTermsAt ? new Date(acceptedTermsAt).toLocaleDateString('es-ES') : 'Pendiente'}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Fecha registrada de aceptación de términos para el alta de cobros.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-origen-pradera/20 bg-origen-crema/40 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-origen-pradera/10 flex-shrink-0">
                      {paymentStage === 'connected' ? <CheckCircle2 className="h-5 w-5 text-origen-pradera" aria-hidden="true" /> : <AlertCircle className="h-5 w-5 text-origen-pradera" aria-hidden="true" />}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-origen-bosque">{paymentStage === 'connected' ? 'Puedes modificar tus datos bancarios o fiscales desde aquí' : 'El acceso te lleva al onboarding real de Stripe, no a una pantalla intermedia'}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">Cuando pulses el CTA abriremos un Account Link directo de Stripe. Si ya tienes cuenta, renovamos el enlace; si no existe, creamos una nueva y guardamos el `stripeAccountId` antes de redirigir.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border-subtle p-4">
                    <p className="text-sm font-medium text-origen-bosque">1. Abre Stripe</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Accede al onboarding o edición con un enlace válido y seguro.</p>
                  </div>
                  <div className="rounded-xl border border-border-subtle p-4">
                    <p className="text-sm font-medium text-origen-bosque">2. Actualiza datos</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Revisa identidad fiscal, cuenta bancaria y cualquier requisito pendiente.</p>
                  </div>
                  <div className="rounded-xl border border-border-subtle p-4">
                    <p className="text-sm font-medium text-origen-bosque">3. Vuelve al panel</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Stripe te devolverá al dashboard cuando termines o si necesitas reanudar luego.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="rounded-2xl border border-border-subtle shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-origen-pradera" aria-hidden="true" />
                    Checklist de cobros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-sm font-medium text-origen-bosque">Cuenta Stripe {paymentStage === 'empty' ? 'sin iniciar' : 'registrada'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{paymentStage === 'empty' ? 'Todavía no existe una cuenta de cobro asociada.' : 'Ya existe una cuenta y puedes retomarla o editarla.'}</p>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-sm font-medium text-origen-bosque">Documentación y verificación</p>
                    <p className="mt-1 text-xs text-muted-foreground">Stripe puede pedir validar identidad, fiscalidad o cuenta bancaria según cambios recientes.</p>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-sm font-medium text-origen-bosque">Edición segura</p>
                    <p className="mt-1 text-xs text-muted-foreground">Si decides modificar la cuenta, el acceso abre Stripe directamente para evitar pasos manuales extra.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border-subtle shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-origen-pradera" aria-hidden="true" />
                    Recomendación operativa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">Revisa tus datos de cobro cada vez que cambies razón social, IBAN o titularidad. Si Stripe detecta inconsistencias puede pausar la liquidación hasta que completes la verificación.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
