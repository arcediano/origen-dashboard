/**
 * @page ProducerDashboard
 * @description Dashboard principal - Refactorizado con componentes modulares
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X, Leaf } from 'lucide-react';
import { DashboardFooter } from '@/app/dashboard/components/footer/DashboardFooter';
import {
  DashboardShell,
  WelcomeHeader,
  ProducerCard,
  StatsGrid,
  OrdersSummary,
  TopProducts,
  DashboardTabs,
} from '@/components/features/dashboard';

// Hooks
import { useDashboardStats, useRecentOrders, useTopProducts } from '@/components/features/dashboard/hooks';
import { useAuth } from '@/contexts/AuthContext';

// Datos mock
import { MOCK_PRODUCER } from '@/components/features/dashboard/data';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function OnboardingProgressBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-0">
      <div className="flex items-center justify-between gap-3 bg-origen-crema/60 border border-origen-pradera/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-origen-pradera" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-origen-bosque leading-tight">Completa tu perfil</p>
            <p className="text-[11px] sm:text-xs text-text-subtle mt-0.5 hidden xs:block">Configura tu tienda y activa los pagos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1 text-xs font-medium text-white bg-origen-bosque hover:bg-origen-pino px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Continuar </span>configuración
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-text-subtle hover:text-texto-subtle transition-colors rounded-lg hover:bg-surface"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProducerDashboard() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Hooks para datos
  const { stats: realStats, isLoading: statsLoading } = useDashboardStats();
  const { orders: realOrders, isLoading: ordersLoading } = useRecentOrders(3);
  const { products: realProducts, isLoading: productsLoading } = useTopProducts(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // BUG FIX: usar el nombre real del usuario autenticado en lugar del hardcodeado 'María'
  const userName = user?.firstName ?? 'Productor';

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Header integrado en el gradiente */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
          <WelcomeHeader userName={userName} />
        </div>
      </div>

      {/* Banner de onboarding pendiente */}
      {!user?.onboardingCompleted && <OnboardingProgressBanner />}

      {/* Contenido principal */}
      <DashboardShell>
        {/* Perfil del productor */}
        <ProducerCard producer={MOCK_PRODUCER} />

        {/* Estadísticas - Siempre visibles */}
        <StatsGrid 
          stats={realStats} 
          isLoading={statsLoading} 
          collapsible={false}
        />

        {/* Resumen principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <OrdersSummary orders={realOrders} isLoading={ordersLoading} className="lg:col-span-2" />
          <TopProducts products={realProducts} isLoading={productsLoading} />
        </div>

        {/* Tabs de navegación */}
        <DashboardTabs />
      </DashboardShell>

      <DashboardFooter className="hidden lg:block" />
    </div>
  );
}
