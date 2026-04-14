/**
 * @page ProducerDashboard
 * @description Dashboard principal - Refactorizado con componentes modulares
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, X } from 'lucide-react';
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function OnboardingProgressBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3 sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <Leaf className="h-5 w-5 text-origen-pradera" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Completa tu panel de venta</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Activa pagos, revisa tu perfil y deja la tienda lista para recibir pedidos.</p>
              <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-origen-pradera/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-origen-pradera to-origen-hoja" />
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-start gap-2 sm:items-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 rounded-2xl bg-origen-bosque px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-origen-pino sm:px-4"
            >
              Continuar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-xl p-2 text-text-subtle transition-colors hover:bg-surface"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducerDashboard() {
  const [mounted, setMounted] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '6m' | '1y'>('6m');
  const { user } = useAuth();

  // Hooks para datos
  const {
    stats: realStats,
    isLoading: statsLoading,
    pendingOrders,
  } = useDashboardStats();
  const { orders: realOrders, isLoading: ordersLoading } = useRecentOrders(3);
  const { products: realProducts, isLoading: productsLoading } = useTopProducts(3);
  const { producer } = useProducerProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // BUG FIX: usar el nombre real del usuario autenticado en lugar del hardcodeado 'María'
  const userName = user?.firstName ?? 'Productor';

  const profileCompleteness = producer?.profileCompletenessPercent ?? 0;

  const alerts = useMemo<DashboardAlert[]>(() => {
    const dashboardAlerts: DashboardAlert[] = [];

    if (!user?.onboardingCompleted) {
      dashboardAlerts.push({
        id: 'onboarding-pending',
        type: 'warning',
        title: 'Tu tienda aún no está lista para vender',
        description: 'Completa el onboarding para activar cobros, catálogo y visibilidad pública.',
        dismissible: true,
      });
    }

    if (producer && profileCompleteness < 100) {
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
  }, [pendingOrders, producer, profileCompleteness, user?.onboardingCompleted]);

  if (!mounted) return null;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Header integrado en el gradiente */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4 lg:py-6">
          <WelcomeHeader userName={userName} showViewStoreButton={false} />
        </div>
      </div>

      {/* Banner de onboarding pendiente */}
      {!user?.onboardingCompleted && <OnboardingProgressBanner />}

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
            <div className="inline-flex rounded-xl border border-border-subtle bg-surface p-1">
              {([
                { value: '7d', label: '7D' },
                { value: '6m', label: '6M' },
                { value: '1y', label: '1A' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChartPeriod(option.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    chartPeriod === option.value
                      ? 'bg-origen-bosque text-white'
                      : 'text-text-subtle hover:text-origen-bosque'
                  }`}
                  aria-pressed={chartPeriod === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SalesChart period={chartPeriod} />
            <VisitsChart period={chartPeriod} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          <OrdersSummary orders={realOrders} isLoading={ordersLoading} className="lg:col-span-2" />
          <TopProducts products={realProducts} isLoading={productsLoading} />
        </div>
      </DashboardShell>

      <DashboardFooter className="hidden lg:block" />
    </div>
  );
}
