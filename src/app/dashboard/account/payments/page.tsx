/**
 * @page Account - Payments
 * @version 2.0.0
 * @description Panel de cobros y liquidación, rediseñado con componentes de UX Library.
 * Utiliza StatGrid + StatCard para el estado de la cuenta, Card variant="section" para secciones,
 * Alert con trailing para mensajes de estado, y soporte para Stripe dashboard link.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, CardIconHeader, Alert, AlertDescription, StatGrid, StatCard, PageLoader, PageError, MobilePullRefresh } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight, Landmark, ShieldCheck, CircleEllipsis, Loader2 } from 'lucide-react';
import { loadProducerProfile } from '@/lib/api/onboarding';
import { startStripeOnboarding, openStripeDashboard } from '@/lib/stripe/connect-client';

interface StripeStatusResponse {
  success: boolean;
  data?: {
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
  };
  error?: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const isFirstLoad = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [acceptedTermsAt, setAcceptedTermsAt] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Extraer loadPaymentState a useCallback para reutilizar en múltiples efectos
  const loadPaymentState = useCallback(async () => {
    try {
      const response = await loadProducerProfile();
      const story = response?.data?.story;
      const fiscal = response?.data?.fiscal;
      const payment = response?.data?.payment;

      setIsConnected(!!payment?.stripeConnected);
      setStripeAccountId(payment?.stripeAccountId ?? null);
      setAcceptedTermsAt(payment?.acceptedTermsAt ?? null);
      setBusinessName(story?.businessName ?? fiscal?.businessName ?? null);
      setWebsite(story?.website ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Error al cargar estado de cobros');
    }
  }, []);

  // Efecto de montaje inicial
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setIsLoading(true);
      setLoadError(null);
      await loadPaymentState();
      if (mounted) {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [loadPaymentState]);

  // Efecto para refresco automático al volver de Stripe
  useEffect(() => {
    let mounted = true;

    const handleVisibilityChange = async () => {
      // Solo actuar si la pestaña es visible y existe una cuenta Stripe asociada
      if (document.visibilityState === 'visible' && stripeAccountId) {
        if (!mounted) return;

        setIsRefreshing(true);

        try {
          // Recargar el perfil del productor
          await loadPaymentState();

          // Adicionalmente, verificar el estado actual de la cuenta en Stripe
          const statusRes = await fetch(
            `/api/stripe/status?accountId=${encodeURIComponent(stripeAccountId)}`
          );

          if (!mounted) return;

          if (statusRes.ok) {
            const json = await statusRes.json() as StripeStatusResponse;
            if (json.success && json.data?.chargesEnabled !== undefined) {
              // Reflejar el nuevo estado de forma optimista
              setIsConnected(json.data.chargesEnabled);
            }
          } else {
            // Si el endpoint falla, degradar silenciosamente (no mostrar error)
            console.warn('No se pudo refrescar el estado de Stripe:', statusRes.statusText);
          }
        } catch (error) {
          // Degradar silenciosamente en caso de error en el refresco en segundo plano
          console.warn(
            'Error refrescando estado de Stripe:',
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          if (mounted) setIsRefreshing(false);
        }
      }
    };

    // Registrar listener de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stripeAccountId, loadPaymentState]);

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

  // Microcopy adicional para el caso "cambiar cuenta bancaria"
  const getBankAccountHelpText = () => {
    if (paymentStage === 'connected') {
      return 'Si necesitas cambiar tu cuenta bancaria o actualizar datos de pago, pulsa "Modificar cuenta en Stripe" para acceder de forma segura a tu cuenta existente y realizar los cambios. Tu historial de cobros y configuración permanecerán intactos.';
    }
    return null;
  };

  if (isFirstLoad.current && isLoading) {
    return <PageLoader />;
  }

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

        {loadError && !isLoading ? (
          <PageError
            message={loadError}
            onRetry={() => {
              setLoadError(null);
              setIsLoading(true);
              void loadPaymentState();
            }}
          />
        ) : (
          <MobilePullRefresh
            onRefresh={async () => {
              setIsRefreshing(true);
              try {
                await loadPaymentState();
              } catch (error) {
                console.warn('Error refrescando datos:', error);
              } finally {
                setIsRefreshing(false);
              }
            }}
          >
            <div className="space-y-4 sm:space-y-6">
              {/* Hero Section - Card variant="section" + CardIconHeader */}
              <Card variant="section">
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 lg:flex-row lg:items-end lg:justify-between p-4 sm:p-5 lg:p-6">
                  <div className="max-w-2xl">
                    <CardIconHeader
                      icon={<CreditCard className="h-6 w-6 text-origen-pradera" aria-hidden="true" />}
                      title="Panel de cobros y liquidación"
                      size="md"
                    />
                    <h2 className="mt-3 text-xl sm:text-2xl lg:text-3xl font-bold text-origen-bosque">
                      {paymentStage === 'connected'
                        ? 'Tu cuenta está lista para recibir pagos'
                        : paymentStage === 'pending'
                          ? 'Te queda un paso para activar los cobros'
                          : 'Conecta Stripe para empezar a cobrar'}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-text-subtle">
                      Revisa estado, verificación y acceso directo a Stripe para activar o actualizar tus datos de cobro.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-auto lg:min-w-[300px]">
                    <div className="flex flex-wrap gap-2 items-center">
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
                      {isRefreshing && (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-origen-pradera" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={paymentStage === 'connected' ? handleOpenDashboard : handleOpenStripe}
                      disabled={isOpeningStripe}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <span className="inline-flex items-center gap-2">
                        {isOpeningStripe
                          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
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
              </Card>

              <div className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                <Card className="rounded-xl sm:rounded-2xl">
                  <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Landmark className="h-5 w-5 text-origen-pradera" aria-hidden="true" />
                      Estado de la cuenta de cobro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-5 lg:p-6">
                    {/* StatGrid de 3 tarjetas con variante según estado - responsive móvil-first */}
                    <StatGrid
                      items={[
                        {
                          label: 'Stripe',
                          value: paymentStage === 'connected' ? 'Operativo' : paymentStage === 'pending' ? 'Pendiente' : 'No configurado',
                          valueClassName: 'text-base sm:text-lg lg:text-xl',
                          subtitle: paymentStage === 'connected' ? 'Puedes seguir cobrando y editar datos cuando lo necesites.' : paymentStage === 'pending' ? 'La cuenta existe pero aún no terminó la verificación.' : 'Todavía no has iniciado el alta en Stripe.',
                          variant: getStatVariant(),
                        },
                        {
                          label: 'Cuenta',
                          value: stripeAccountId ?? 'Se generará al iniciar el alta',
                          valueClassName: 'text-base sm:text-lg lg:text-xl',
                          subtitle: 'Identificador técnico de Stripe asociado a tu perfil comercial.',
                          variant: getStatVariant(),
                        },
                        {
                          label: 'Verificación',
                          value: acceptedTermsAt ? new Date(acceptedTermsAt).toLocaleDateString('es-ES') : 'Pendiente',
                          valueClassName: 'text-base sm:text-lg lg:text-xl',
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

                    {/* Texto adicional para explicar el cambio de cuenta bancaria */}
                    {getBankAccountHelpText() && (
                      <p className="text-xs sm:text-sm text-text-subtle leading-relaxed">
                        {getBankAccountHelpText()}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  {/* Card "Próximos pasos" - variant="section" + CardIconHeader */}
                  <Card variant="section" className="rounded-xl sm:rounded-2xl">
                    <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
                      <CardIconHeader
                        icon={<ShieldCheck className="h-5 w-5 text-origen-pradera" aria-hidden="true" />}
                        title="Próximos pasos"
                        size="md"
                      />
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 sm:p-5 lg:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between rounded-xl border border-border-subtle bg-surface-alt p-4 min-h-[44px] sm:min-h-auto">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-origen-bosque">{paymentStage === 'empty' ? 'Inicia tu cuenta Stripe' : paymentStage === 'pending' ? 'Completa la verificacion pendiente' : 'Mantén tus datos al dia'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{paymentStage === 'empty' ? 'Sin cuenta activa no podrás recibir liquidaciones.' : paymentStage === 'pending' ? 'Finaliza el alta para habilitar cobros.' : 'Actualiza datos fiscales o bancarios cuando cambien.'}</p>
                        </div>
                        <Badge
                          variant={paymentStage === 'empty' ? 'neutral' : paymentStage === 'pending' ? 'warning' : 'success'}
                          size="xs"
                          className="shrink-0 w-fit"
                        >
                          {paymentStage === 'empty' ? 'Pendiente' : paymentStage === 'pending' ? 'En progreso' : 'Hecho'}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between rounded-xl border border-border-subtle bg-surface-alt p-4 min-h-[44px] sm:min-h-auto">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-origen-bosque">Documentacion y verificacion</p>
                          <p className="mt-1 text-xs text-muted-foreground">Ten a mano documentación fiscal y bancaria para evitar pausas de pago.</p>
                        </div>
                        <Badge
                          variant={paymentStage === 'connected' ? 'success' : 'neutral'}
                          size="xs"
                          className="shrink-0 w-fit"
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
          </MobilePullRefresh>
        )}
      </div>
    </div>
  );
}
