/**
 * @page Account - Payments
 * @version 2.1.0
 * @description Panel de cobros y liquidación, con componentes de UX Library.
 * StatCard (en grid manual, no StatGrid -- ver comentario junto a su uso)
 * para el estado de la cuenta, Card variant="section" para secciones,
 * Alert para mensajes de estado, y soporte para Stripe dashboard link.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, CardIconHeader, Alert, AlertDescription, PageLoader, PageError, MobilePullRefresh, appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD, toast } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight, Landmark, ShieldCheck, CircleEllipsis, Loader2, X, Clock, ChevronDown } from 'lucide-react';
import { loadProducerProfile } from '@/lib/api/onboarding';
import { fetchSellerPayouts, type SellerPayoutItem } from '@/lib/api/orders';
import { openStripeDashboard } from '@/lib/stripe/connect-client';
import { useStripeConnectPolling } from '@/lib/stripe/use-stripe-connect-polling';
import { StripeConnectOnboarding } from '@/components/features/stripe/stripe-connect-onboarding';

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
  const embeddedPanelRef = useRef<HTMLDivElement>(null);
  const prevConnectedRef = useRef<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);
  const [showEmbeddedOnboarding, setShowEmbeddedOnboarding] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [acceptedTermsAt, setAcceptedTermsAt] = useState<string | null>(null);
  const [hasDebt, setHasDebt] = useState(false);
  const [debtAmountCents, setDebtAmountCents] = useState(0);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<SellerPayoutItem[]>([]);
  const [payoutsTotal, setPayoutsTotal] = useState(0);

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
      setHasDebt(!!payment?.hasDebt);
      setDebtAmountCents(payment?.debtAmountCents ?? 0);
      setBusinessName(story?.businessName ?? fiscal?.businessName ?? null);
      setWebsite(story?.website ?? null);
      // Nota: firstName, lastName, email no están disponibles en OnboardingData
      // Se obtienen del contexto de autenticación si es necesario
      setFirstName(null);
      setLastName(null);
      setUserEmail(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Error al cargar estado de cobros');
    }
  }, []);

  const paymentStage = isConnected
    ? 'connected'
    : stripeAccountId
      ? 'pending'
      : 'empty';

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

  // Cuenta atrás por pedido: solo tiene sentido con cuenta de cobro activa.
  // Vista previa de los próximos 5 Transfers pendientes (ya vienen ordenados
  // por fecha ascendente desde el backend) — no es una tabla paginada, solo
  // detalle para complementar el mensaje general de "14 días tras la entrega".
  useEffect(() => {
    if (paymentStage !== 'connected') return;
    let mounted = true;

    void (async () => {
      const res = await fetchSellerPayouts({ page: 1, limit: 5 });
      if (!mounted) return;
      if (res.data) {
        setPayouts(res.data.items);
        setPayoutsTotal(res.data.total);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [paymentStage]);

  // Refresco real del estado embebido — no depende de visibilitychange.
  // Nivel rápido mientras el panel está abierto, nivel lento (más
  // espaciado) mientras la cuenta sigue "pending" con el panel cerrado,
  // para cubrir verificaciones de Stripe que se completan en segundo
  // plano. Ver D1 del plan de desarrollo para la justificación de por
  // qué se consulta loadPaymentState() (BD) y no /api/stripe/status
  // (Stripe en vivo) en cada tick.
  //
  // La mecánica vive en useStripeConnectPolling porque el paso 6 del
  // wizard de onboarding sufre exactamente el mismo problema y usa el
  // mismo hook (Etapa 5 del plan de desarrollo).
  const isFastTier = showEmbeddedOnboarding && paymentStage !== 'connected';
  const isSlowTier = !showEmbeddedOnboarding && paymentStage === 'pending';

  useStripeConnectPolling({
    active: isFastTier || isSlowTier,
    fastTier: isFastTier,
    onTick: loadPaymentState,
  });

  // Aviso explícito cuando la cuenta pasa a activa mientras el usuario
  // sigue en la página (heurística de Nielsen "visibilidad del estado
  // del sistema") — solo en una transición real false -> true, nunca en
  // la carga inicial (isConnected arranca en null, no en false).
  useEffect(() => {
    if (prevConnectedRef.current === false && isConnected === true) {
      setShowEmbeddedOnboarding(false);
      toast({
        title: 'Tu cuenta de Stripe está activa',
        description: 'Ya puedes recibir pagos en tu cuenta.',
        variant: 'success',
      });
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  // Red de seguridad para scrollIntoView del panel embebido (Etapa 3, 3.3)
  useEffect(() => {
    if (showEmbeddedOnboarding && paymentStage !== 'connected') {
      embeddedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showEmbeddedOnboarding]);

  const handleOpenStripe = async () => {
    setIsOpeningStripe(true);
    setLoadError(null);
    setShowEmbeddedOnboarding(true);
    setIsOpeningStripe(false);
  };

  const handleCloseEmbedded = () => {
    setShowEmbeddedOnboarding(false);
  };

  const handleEmbeddedVerified = async () => {
    // El componente se encargó de verificar y guardar
    // Ahora recargamos el estado para reflejar los cambios
    setShowEmbeddedOnboarding(false);
    await loadPaymentState();
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

  // Contenido del Alert según el estado del pago. Antes había un segundo
  // párrafo aparte (getBankAccountHelpText) que decía prácticamente lo
  // mismo para el caso "connected" -- se fusiona en un único mensaje para
  // no repetir el mismo aviso dos veces y ahorrar scroll en móvil.
  const getAlertContent = () => {
    if (paymentStage === 'connected') {
      return 'Si necesitas cambiar tu cuenta bancaria o actualizar datos de pago, pulsa "Modificar cuenta en Stripe" para acceder de forma segura a tu cuenta existente. Tu historial de cobros y configuración permanecerán intactos.';
    }
    return 'El botón te lleva directamente al onboarding real de Stripe. El acceso es seguro y siempre se genera con un enlace actualizado.';
  };

  if (isFirstLoad.current && isLoading) {
    return <PageLoader className="animate-fade-in" />;
  }

  return (
    <div className="w-full">
      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8`}>
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

        {hasDebt && !isLoading && (
          <Alert variant="error" className="mb-4 sm:mb-6">
            <AlertDescription>
              Tienes un saldo negativo de <strong>{(debtAmountCents / 100).toFixed(2)}€</strong> pendiente
              de saldar: una devolución reciente no se pudo compensar automáticamente en Stripe. Se irá
              descontando de tus próximas transferencias hasta quedar a cero — no necesitas hacer nada,
              solo te avisamos para que no te sorprenda un cobro más bajo de lo esperado.
            </AlertDescription>
          </Alert>
        )}

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
              <Card variant="section" padding="none">
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                      <CardIconHeader
                        icon={<CreditCard className="h-6 w-6 text-hoja-tinta" aria-hidden="true" />}
                        title="Panel de cobros y liquidación"
                        size="md"
                      />
                      <h2 className="mt-3 text-lg sm:text-xl lg:text-2xl font-bold text-origen-bosque leading-tight">
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
                          <Badge variant="outline" size="sm" className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Terminos aceptados
                          </Badge>
                        )}
                        {isRefreshing && (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-hoja-tinta" aria-hidden="true" />
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={
                          paymentStage === 'connected'
                            ? handleOpenDashboard
                            : showEmbeddedOnboarding
                              ? handleCloseEmbedded
                              : handleOpenStripe
                        }
                        variant={showEmbeddedOnboarding && paymentStage !== 'connected' ? 'outline' : 'primary'}
                        disabled={isOpeningStripe}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        <span className="inline-flex items-center gap-2">
                          {isOpeningStripe ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : showEmbeddedOnboarding && paymentStage !== 'connected' ? (
                            <X className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>
                            {isOpeningStripe
                              ? 'Abriendo Stripe...'
                              : showEmbeddedOnboarding && paymentStage !== 'connected'
                                ? 'Cerrar formulario'
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

                  {showEmbeddedOnboarding && paymentStage !== 'connected' && (
                    <div
                      ref={embeddedPanelRef}
                      className="mt-4 sm:mt-5 lg:mt-6 border-t border-border-subtle pt-4 sm:pt-5"
                      aria-live="polite"
                    >
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                        {paymentStage === 'pending' ? 'Continuar onboarding' : 'Crear cuenta Stripe'}
                      </p>
                      <StripeConnectOnboarding
                        stripeAccountId={stripeAccountId}
                        source="account_payments"
                        onboardingContext={{
                          email: userEmail ?? undefined,
                          firstName: firstName ?? undefined,
                          lastName: lastName ?? undefined,
                          businessName: businessName ?? undefined,
                          website: website ?? undefined,
                        }}
                        onVerified={handleEmbeddedVerified}
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/*
                Opción C del canvas de design (decisión del humano en vivo,
                2026-09-04): franja de ancho completo con "Próximos cobros"
                justo debajo del hero (lo primero que se ve tras el estado
                general), y debajo un grid de 2 columnas ahora simétrico
                (antes 1.7fr/1fr) para estado de cuenta / próximos pasos, con
                la explicación de cómo funcionan los cobros colapsada dentro
                de "Próximos pasos" en vez de ser su propia card aparte.
              */}
              {paymentStage === 'connected' && payouts.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between px-0.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-origen-bosque">
                      <Clock className="h-4 w-4 text-hoja-tinta" aria-hidden="true" />
                      Próximos cobros
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {payouts.slice(0, 3).map((payout, index) => (
                      <button
                        key={payout.orderId}
                        type="button"
                        onClick={() => router.push(`/dashboard/orders/${payout.orderId}`)}
                        className={`rounded-2xl border p-3.5 text-left transition-colors hover:border-origen-pradera/50 min-h-11 ${
                          index === 0
                            ? 'border-origen-pradera bg-gradient-to-b from-white to-origen-crema'
                            : 'border-border-subtle bg-surface-alt'
                        }`}
                      >
                        <p className="text-xs font-semibold text-text-subtle truncate">Pedido {payout.orderNumber}</p>
                        <p className="mt-1 text-xl font-extrabold text-origen-bosque tabular-nums">
                          {payout.netAmount.toFixed(2)} €
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                          <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          {formatDistanceToNow(new Date(payout.transferScheduledAt), { addSuffix: true, locale: es })}
                          {' · '}
                          {format(new Date(payout.transferScheduledAt), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </button>
                    ))}
                  </div>
                  {payoutsTotal > Math.min(payouts.length, 3) && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      +{payoutsTotal - Math.min(payouts.length, 3)} pedido{payoutsTotal - Math.min(payouts.length, 3) === 1 ? '' : 's'} más pendiente{payoutsTotal - Math.min(payouts.length, 3) === 1 ? '' : 's'} de cobro
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6 lg:items-start">
                <Card className="rounded-xl sm:rounded-2xl" padding="none">
                  <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Landmark className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
                      Estado de la cuenta de cobro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    {/*
                      Filas compactas (text-sm/text-xs, patrón de
                      security/page.tsx) en vez de StatCard: 3 datos de
                      estado/identificador no son KPIs -- ni el componente
                      ni su tamaño tipográfico encajaban con ningún patrón
                      real del resto de la sección "Cuenta".
                    */}
                    <div className="divide-y divide-border-subtle">
                      <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                        <span className="text-sm font-medium text-text-subtle">Stripe</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-origen-bosque">
                            {paymentStage === 'connected' ? 'Operativo' : paymentStage === 'pending' ? 'Pendiente' : 'No configurado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {paymentStage === 'connected' ? 'Puedes editar tus datos cuando lo necesites.' : paymentStage === 'pending' ? 'Verificación todavía en curso.' : 'Todavía no has iniciado el alta.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3">
                        <span className="text-sm font-medium text-text-subtle">Verificación</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-origen-bosque">
                            {acceptedTermsAt ? new Date(acceptedTermsAt).toLocaleDateString('es-ES') : 'Pendiente'}
                          </p>
                          <p className="text-xs text-muted-foreground">Aceptación de términos de cobro.</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                        <span className="text-sm font-medium text-text-subtle shrink-0">Cuenta</span>
                        <div className="text-right min-w-0">
                          <p className="text-sm font-bold text-origen-bosque break-all">
                            {stripeAccountId ?? 'Se generará al iniciar el alta'}
                          </p>
                          <p className="text-xs text-muted-foreground">Identificador técnico de tu cuenta Stripe.</p>
                        </div>
                      </div>
                    </div>

                    <Alert variant={paymentStage === 'connected' ? 'success' : 'default'} className="mt-4">
                      <AlertDescription>
                        {getAlertContent()}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card variant="section" className="rounded-xl sm:rounded-2xl" padding="none">
                  <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
                    <CardIconHeader
                      icon={<ShieldCheck className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />}
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

                    {/*
                      details/summary nativo: la explicación de cómo
                      funcionan los cobros (antes su propia Card en la
                      columna derecha) pasa a disclosure colapsado dentro
                      de "Próximos pasos", Opción C del canvas.
                    */}
                    <details className="group border-t border-border-subtle pt-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-text-subtle [&::-webkit-details-marker]:hidden">
                        Cómo funcionan tus cobros
                        <ChevronDown className="h-3.5 w-3.5 text-text-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                        <p>
                          Cada venta se transfiere a tu cuenta de Stripe <strong className="text-origen-bosque">14 días naturales después de la entrega</strong> del
                          pedido — el tiempo de retención que Origen usa para poder gestionar posibles devoluciones sin pedirte que adelantes ese dinero.
                        </p>
                        <p>
                          Si un pedido se devuelve dentro de ese plazo, la transferencia simplemente no llega a ejecutarse. Si se devuelve después de que ya la
                          hayas cobrado, el importe se descuenta de tu siguiente venta.
                        </p>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </div>
            </div>
          </MobilePullRefresh>
        )}
      </div>
    </div>
  );
}
