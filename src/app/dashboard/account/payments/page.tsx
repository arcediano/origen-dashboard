/**
 * @page Account - Payments
 * @version 2.0.0
 * @description Panel de cobros y liquidación, rediseñado con componentes de UX Library.
 * Utiliza StatGrid + StatCard para el estado de la cuenta, Card variant="section" para secciones,
 * Alert con trailing para mensajes de estado, y soporte para Stripe dashboard link.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, CardIconHeader, Alert, AlertDescription, StatGrid, StatCard } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight, Landmark, ShieldCheck, CircleEllipsis, Loader2 } from 'lucide-react';
import { loadProducerProfile } from '@/lib/api/onboarding';
import { startStripeOnboarding, openStripeDashboard } from '@/lib/stripe/connect-client';

export default function PaymentsPage() {
  const router = useRouter();
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
        const response = await loadProducerProfile();
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
        source: 'account_payments',
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo abrir Stripe');
      setIsOpeningStripe(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsOpeningStripe(true);
    setLoadError(null);

    try {
      if (stripeAccountId) {
        await openStripeDashboard(stripeAccountId);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo abrir el panel de Stripe');
      setIsOpeningStripe(false);
    }
  };

  // Determinar variante de color para StatCard según estado
  const getStatVariant = (): 'bosque' | 'hoja' | 'arena' => {
    if (paymentStage === 'connected') return 'bosque';
    if (paymentStage === 'pending') return 'hoja';
    return 'arena';
  };

  // Contenido del Alert según el estado del pago
  const getAlertContent = () => {
    if (paymentStage === 'connected') {
      return 'Puedes editar tus datos de cobro cuando lo necesites. El acceso es seguro y siempre se genera con un enlace actualizado.';
    }
    return 'El botón te lleva directamente al onboarding real de Stripe. El acceso es seguro y siempre se genera con un enlace actualizado.';
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        <PageHeader
          title="Cobros"
          description="Gestiona Stripe, el estado de tu cuenta y cómo cobras tus ventas"
          badgeIcon={CreditCard}
          badgeText="Cobros"
          tooltip="Cobros"
          tooltipDetailed="Conecta y gestiona tu cuenta de Stripe para recibir pagos, revisar verificaciones y evitar bloqueos."
          showBackButton
          onBack={() => router.push('/dashboard/account')}
        />
        {loadError && (
          <Alert className="mb-5 border-feedback-danger/30 bg-feedback-danger/10">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-5">
            {/* Hero skeleton */}
            <div className="rounded-2xl border border-origen-pradera/20 bg-origen-crema/50 p-4 shadow-sm sm:p-6 animate-pulse">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-border-subtle flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-40 rounded-full bg-border-subtle" />
                    <div className="h-7 w-72 rounded-full bg-border-subtle" />
                    <div className="h-3 w-56 rounded-full bg-border-subtle" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 lg:min-w-[300px]">
                  <div className="h-7 w-36 rounded-full bg-border-subtle" />
                  <div className="h-10 w-full rounded-xl bg-border-subtle" />
                </div>
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] animate-pulse">
              <div className="rounded-2xl border border-border-subtle shadow-sm p-6 space-y-4">
                <div className="h-5 w-48 rounded-full bg-border-subtle" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl border border-border-subtle bg-surface-alt p-4 space-y-2">
                      <div className="h-3 w-16 rounded-full bg-border-subtle" />
                      <div className="h-4 w-24 rounded-full bg-border-subtle" />
                      <div className="h-3 w-full rounded-full bg-border-subtle" />
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-origen-pradera/20 bg-origen-crema/40 p-4 h-20" />
              </div>
              <div className="rounded-2xl border border-border-subtle shadow-sm p-6 space-y-4">
                <div className="h-5 w-36 rounded-full bg-border-subtle" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl border border-border-subtle bg-surface-alt p-4 space-y-1.5">
                    <div className="h-4 w-40 rounded-full bg-border-subtle" />
                    <div className="h-3 w-full rounded-full bg-border-subtle" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <div className="space-y-5">
          {/* Hero Section - Card variant="section" + CardIconHeader */}
          <Card variant="section">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between p-4 sm:p-6">
              <div className="max-w-2xl">
                <CardIconHeader
                  icon={<CreditCard className="h-6 w-6 text-origen-pradera" aria-hidden="true" />}
                  title="Panel de cobros y liquidación"
                  size="md"
                />
                <h2 className="mt-3 text-h2 text-origen-bosque">
                  {isLoading
                    ? 'Verificando estado de cobros...'
                    : paymentStage === 'connected'
                      ? 'Tu cuenta está lista para recibir pagos'
                      : paymentStage === 'pending'
                        ? 'Te queda un paso para activar los cobros'
                        : 'Conecta Stripe para empezar a cobrar'}
                </h2>
                <p className="mt-2 max-w-xl text-small leading-relaxed text-text-subtle">
                  Revisa estado, verificación y acceso directo a Stripe para activar o actualizar tus datos de cobro.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[300px]">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={paymentStage === 'connected' ? 'success' : paymentStage === 'pending' ? 'warning' : 'neutral'}
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    {paymentStage === 'connected' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : paymentStage === 'pending' ? <CircleEllipsis className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {paymentStage === 'connected' ? 'Cobros activos' : paymentStage === 'pending' ? 'Onboarding pendiente' : 'Sin cuenta de cobro'}
                  </Badge>
                  {acceptedTermsAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-subtle">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Terminos aceptados
                    </span>
                  )}
                </div>

                <Button
                  onClick={paymentStage === 'connected' ? handleOpenDashboard : handleOpenStripe}
                  disabled={isLoading || isOpeningStripe}
                  className="w-full lg:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                    <span>
                      {isLoading
                        ? 'Cargando estado...'
                        : isOpeningStripe
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
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <Landmark className="h-5 w-5 text-origen-pradera" aria-hidden="true" />
                  Estado de la cuenta de cobro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* StatGrid de 3 tarjetas con variante según estado */}
                <StatGrid
                  items={[
                    {
                      label: 'Stripe',
                      value: paymentStage === 'connected' ? 'Operativo' : paymentStage === 'pending' ? 'Pendiente' : 'No configurado',
                      valueClassName: 'text-base sm:text-lg',
                      subtitle: paymentStage === 'connected' ? 'Puedes seguir cobrando y editar datos cuando lo necesites.' : paymentStage === 'pending' ? 'La cuenta existe pero aún no terminó la verificación.' : 'Todavía no has iniciado el alta en Stripe.',
                      variant: getStatVariant(),
                    },
                    {
                      label: 'Cuenta',
                      value: stripeAccountId ?? 'Se generará al iniciar el alta',
                      valueClassName: 'text-base sm:text-lg',
                      subtitle: 'Identificador técnico de Stripe asociado a tu perfil comercial.',
                      variant: getStatVariant(),
                    },
                    {
                      label: 'Verificación',
                      value: acceptedTermsAt ? new Date(acceptedTermsAt).toLocaleDateString('es-ES') : 'Pendiente',
                      valueClassName: 'text-base sm:text-lg',
                      subtitle: 'Fecha registrada de aceptación de términos para el alta de cobros.',
                      variant: getStatVariant(),
                    },
                  ]}
                  columns={3}
                />

                {/* Alert con prop trailing para el estado del pago */}
                <Alert
                  variant={paymentStage === 'connected' ? 'success' : 'default'}
                  trailing={
                    <Badge
                      variant={paymentStage === 'connected' ? 'success' : paymentStage === 'pending' ? 'warning' : 'neutral'}
                      size="sm"
                      className="flex items-center gap-1.5 shrink-0"
                    >
                      {paymentStage === 'connected' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : paymentStage === 'pending' ? <CircleEllipsis className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {paymentStage === 'connected' ? 'Listo' : paymentStage === 'pending' ? 'En progreso' : 'Vacío'}
                    </Badge>
                  }
                >
                  <AlertDescription>
                    {getAlertContent()}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="space-y-5">
              {/* Card "Próximos pasos" - variant="section" + CardIconHeader */}
              <Card variant="section">
                <CardHeader>
                  <CardIconHeader
                    icon={<ShieldCheck className="h-5 w-5 text-origen-pradera" aria-hidden="true" />}
                    title="Próximos pasos"
                    size="md"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">{paymentStage === 'empty' ? 'Inicia tu cuenta Stripe' : paymentStage === 'pending' ? 'Completa la verificacion pendiente' : 'Mantén tus datos al dia'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{paymentStage === 'empty' ? 'Sin cuenta activa no podrás recibir liquidaciones.' : paymentStage === 'pending' ? 'Finaliza el alta para habilitar cobros.' : 'Actualiza datos fiscales o bancarios cuando cambien.'}</p>
                    </div>
                    <Badge
                      variant={paymentStage === 'empty' ? 'neutral' : paymentStage === 'pending' ? 'warning' : 'success'}
                      size="xs"
                      className="shrink-0"
                    >
                      {paymentStage === 'empty' ? 'Pendiente' : paymentStage === 'pending' ? 'En progreso' : 'Hecho'}
                    </Badge>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Documentacion y verificacion</p>
                      <p className="mt-1 text-xs text-muted-foreground">Ten a mano documentación fiscal y bancaria para evitar pausas de pago.</p>
                    </div>
                    <Badge
                      variant={paymentStage === 'connected' ? 'success' : 'neutral'}
                      size="xs"
                      className="shrink-0"
                    >
                      {paymentStage === 'connected' ? 'Hecho' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <p className="text-sm font-medium text-origen-bosque">Acceso directo y seguro</p>
                    <p className="mt-1 text-xs text-muted-foreground">Siempre entrarás con un enlace temporal válido generado para tu cuenta.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
