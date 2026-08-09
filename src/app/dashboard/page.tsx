/**
 * @page ProducerDashboard
 * @description Dashboard principal - Refactorizado con componentes modulares
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, X } from 'lucide-react';
import { Button, PageLoader, PageError, ToggleGroup, ToggleGroupItem } from '@arcediano/ux-library';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { DashboardFooter } from '@/app/dashboard/components/footer/DashboardFooter';
import {
  AlertList,
  DashboardShell,
  StatsGrid,
  OrdersSummary,
  TopProducts,
  WelcomeHeader,
  SalesChart,
  VisitsChart,
} from '@/components/features/dashboard';
import type { DashboardAlert } from '@/components/features/dashboard';

// Hooks
import {
  useDashboardStats,
  useRecentOrders,
  useTopProducts,
  useProducerProfile,
} from '@/components/features/dashboard/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { getMyReadiness } from '@/lib/api/onboarding';
import type { ProducerReadinessReport } from '@/lib/api/onboarding';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function OnboardingProgressBanner({ progress }: { progress: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-origen-pradera/15 flex-shrink-0">
              <Leaf className="h-5 w-5 text-hoja-tinta" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Completa tu panel de venta</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Activa pagos, revisa tu perfil y deja la tienda lista para recibir pedidos.</p>
              <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-origen-pradera/10">
                <div
                  className="h-full rounded-full bg-origen-pradera transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
            <Button asChild variant="primary" size="sm">
              <Link href="/onboarding">
                Continuar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducerDashboard() {
  const [chartPeriod, setChartPeriod] = useState<'7d' | '6m' | '1y'>('6m');
  const { user } = useAuth();
  const isFirstLoad = useRef(true);
  const [readiness, setReadiness] = useState<ProducerReadinessReport | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(true);

  // Hooks para datos
  const {
    stats: realStats,
    isLoading: statsLoading,
    pendingOrders,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const { orders: realOrders, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useRecentOrders(3);
  const { products: realProducts, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useTopProducts(3);
  const { producer } = useProducerProfile();

  // Obtener estado de readiness (incluyendo estado de pago)
  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const report = await getMyReadiness();
        setReadiness(report);
      } catch (error) {
        console.error('Error fetching readiness:', error);
        // No lanzar error — las alertas de Stripe simplemente no se mostrarán
      } finally {
        setReadinessLoading(false);
      }
    };

    void fetchReadiness();
  }, []);

  const showPageLoader = useDelayedLoading(isFirstLoad.current && statsLoading);

  // Marcar primera carga como completada cuando los datos lleguen
  useEffect(() => {
    if (!statsLoading && realStats) {
      isFirstLoad.current = false;
    }
  }, [statsLoading, realStats]);

  // BUG FIX: usar el nombre real del usuario autenticado en lugar del hardcodeado 'María'
  const userName = user?.firstName ?? 'Productor';

  const profileCompleteness = producer?.profileCompletenessPercent ?? 0;

  const alerts = useMemo<DashboardAlert[]>(() => {
    const dashboardAlerts: DashboardAlert[] = [];

    // El banner de onboarding (más abajo, siempre visible mientras
    // !user.onboardingCompleted) ya cubre este mensaje con más detalle
    // (progreso + CTA) -- este alert solo aporta valor una vez el
    // onboarding está completo pero el perfil aún se puede mejorar.
    if (user?.onboardingCompleted && producer && profileCompleteness < 100) {
      dashboardAlerts.push({
        id: 'profile-incomplete',
        type: 'accent',
        title: 'Aún puedes mejorar tu perfil',
        description: `Completa tu perfil de negocio para mejorar confianza y conversión. Estado actual: ${profileCompleteness}%.`,
        dismissible: true,
        action: {
          label: 'Completar perfil',
          href: '/dashboard/profile/business',
        },
      });
    }

    // ── Alertas de Stripe (Estado de cuenta de pago) ──────────────────────────────
    if (readiness?.payment) {
      const { status } = readiness.payment;

      // RESTRICTED: Bloqueo activo — no puede cobrar
      if (status === 'RESTRICTED') {
        dashboardAlerts.push({
          id: 'payment-restricted',
          type: 'error',
          title: 'Tus cobros están pausados',
          description: 'Stripe ha restringido tu cuenta y no puedes recibir pagos hasta resolverlo. Tus productos pueden dejar de ser visibles mientras tanto.',
          dismissible: false,
          action: {
            label: 'Resolver ahora',
            href: '/dashboard/account/payments',
          },
        });
      }

      // ACTION_REQUIRED: Cuenta operativa pero con verificacion pendiente
      if (status === 'ACTION_REQUIRED') {
        dashboardAlerts.push({
          id: 'payment-action-required',
          type: 'warning',
          title: 'Tu cuenta de Stripe necesita atención',
          description: 'Stripe pide información adicional para mantener tus cobros activos. Resuelvelo antes de que se restrinja tu cuenta.',
          dismissible: true,
          action: {
            label: 'Revisar cobros',
            href: '/dashboard/account/payments',
          },
        });
      }
    }

    if (pendingOrders > 0) {
      dashboardAlerts.push({
        id: 'pending-orders',
        type: 'success',
        title: 'Hay pedidos que requieren atención',
        description: `Tienes ${pendingOrders} pedido(s) pendiente(s) de revisar o procesar.`,
        dismissible: false,
      });
    }

    return dashboardAlerts;
  }, [pendingOrders, producer, profileCompleteness, readiness, user?.onboardingCompleted]);

  if (showPageLoader) {
    return <PageLoader message="Cargando dashboard..." className="animate-fade-in" />;
  }

  // Mostrar PageError si hay errores críticos
  if (statsError || ordersError || productsError) {
    return (
      <PageError
        title="Error al cargar el dashboard"
        message={statsError || ordersError || productsError || 'Algo salió mal'}
        onRetry={() => {
          void Promise.all([refetchStats(), refetchOrders(), refetchProducts()]);
        }}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4 lg:py-6">
          <WelcomeHeader userName={userName} showViewStoreButton={false} />
        </div>
      </div>

      {/* Banner de onboarding pendiente */}
      {!user?.onboardingCompleted && <OnboardingProgressBanner progress={profileCompleteness} />}

      {/* Contenido principal */}
      <DashboardShell>
        {alerts.length > 0 && <AlertList alerts={alerts} />}

        <StatsGrid
          stats={realStats}
          isLoading={statsLoading}
          collapsible={false}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rendimiento comercial</h3>
            <ToggleGroup
              type="single"
              value={chartPeriod}
              onValueChange={(v) => v && setChartPeriod(v as '7d' | '6m' | '1y')}
            >
              <ToggleGroupItem value="7d">7D</ToggleGroupItem>
              <ToggleGroupItem value="6m">6M</ToggleGroupItem>
              <ToggleGroupItem value="1y">1A</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {statsLoading && !realStats ? (
              <div className="h-64 animate-pulse rounded-2xl bg-origen-pastel/20" />
            ) : (
              <SalesChart period={chartPeriod} />
            )}
            {statsLoading && !realStats ? (
              <div className="h-64 animate-pulse rounded-2xl bg-origen-pastel/20" />
            ) : (
              <VisitsChart period={chartPeriod} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          <OrdersSummary orders={realOrders} isLoading={ordersLoading} className="lg:col-span-2" />
          <TopProducts products={realProducts} isLoading={productsLoading} />
        </div>
      </DashboardShell>

      <DashboardFooter />
    </div>
  );
}
