/**
 * @page ProducerDashboard
 * @description Dashboard principal - Refactorizado con componentes modulares
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardFooter } from '@/app/dashboard/components/footer/DashboardFooter';

// Componentes del dashboard
import {
  DashboardShell,
  WelcomeHeader,
  ProducerCard,
  StatsGrid,
  QuickActionsGrid,
  AlertList,
  OrdersSummary,
  TopProducts,
  DashboardTabs,
} from '@/components/features/dashboard';

// Hooks
import { useDashboardStats, useRecentOrders, useTopProducts } from '@/components/features/dashboard/hooks';

// Datos mock
import { MOCK_PRODUCER, MOCK_ALERTS } from '@/components/features/dashboard/data';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProducerDashboard() {
  const [mounted, setMounted] = useState(false);

  // Hooks para datos
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { orders, isLoading: ordersLoading } = useRecentOrders(3);
  const { products, isLoading: productsLoading } = useTopProducts(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Nombre del usuario para el saludo (podría venir del contexto de auth)
  const userName = 'María';

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Header integrado en el gradiente */}
      <div className="bg-transparent">
        <div className="container mx-auto px-6 py-8">
          <WelcomeHeader userName={userName} />
        </div>
      </div>

      {/* Contenido principal */}
      <DashboardShell>
        {/* Perfil del productor */}
        <ProducerCard producer={MOCK_PRODUCER} />

        {/* Estadísticas - Siempre visible */}
        <StatsGrid stats={stats} isLoading={statsLoading} />

        {/* Acciones rápidas */}
        <QuickActionsGrid pendingOrders={3} />

        {/* Alertas */}
        <AlertList alerts={MOCK_ALERTS} />

        {/* Grid principal: Pedidos y productos - Siempre visibles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pedidos recientes (2/3) */}
          <OrdersSummary orders={orders} isLoading={ordersLoading} />

          {/* Productos top (1/3) */}
          <TopProducts products={products} isLoading={productsLoading} />
        </div>

        {/* Tabs de navegación */}
        <DashboardTabs />
      </DashboardShell>

      <DashboardFooter />
    </div>
  );
}
