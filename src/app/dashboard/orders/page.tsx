/**
 * @page OrdersPage
 * @description Página principal de gestión de pedidos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

// Componentes UI
import { Card, Pagination, MobilePullRefresh, PageLoader, PageError, MobileCardList, EmptyState } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { OrderStats } from './components/OrderStats';
import { OrderFilters } from './components/OrderFilters';
import { OrdersTable } from './components/OrdersTable';
import { OrderCard, OrderCardSkeleton } from './components/OrderCard';

// Hooks y API
import { fetchOrders } from '@/lib/api/orders';
import type { Order, OrderFilters as OrderFiltersType } from '@/types/order';

// ============================================================================
// ANIMACIONES
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OrdersPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0.01 }
        : { type: 'spring', stiffness: 300, damping: 25 },
    },
  };

  // Estados
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadOrders(true);
      return;
    }
    loadOrders(false);
  }, [filters, currentPage]);

  const loadOrders = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);

    try {
      const response = await fetchOrders({
        page: currentPage,
        limit: 10,
        filters
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setOrders(response.data.orders);
        setStats(response.data.stats);
        setTotalPages(response.data.totalPages);
        setTotalOrders(response.data.total);
      }
    } catch (err) {
      setError('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/orders/${id}`);
  };

  const handleFilterChange = (newFilters: OrderFiltersType) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isFirstLoad.current && isLoading) {
    return <PageLoader message="Cargando pedidos..." />;
  }

  if (error) {
    return (
      <PageError
        title="Error al cargar"
        message={error}
        onRetry={loadOrders}
      />
    );
  }

  const handleRefresh = async () => { await loadOrders(); };

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
    <>
      {/* Cabecera */}
      <PageHeader
        title="Gestión de pedidos"
        description={`${totalOrders} pedidos en total`}
        badgeIcon={ShoppingBag}
        badgeText="Seguimiento de pedidos"
        tooltip="Pedidos"
        tooltipDetailed="Gestiona todos los pedidos, su estado y seguimiento."
      />

      {/* Contenido principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8"
      >
        {/* Estadísticas */}
        {stats && (
          <motion.div variants={itemVariants}>
            <OrderStats stats={stats} isLoading={isTableLoading} />
          </motion.div>
        )}

        {/* Filtros */}
        <motion.div variants={itemVariants}>
          <OrderFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalOrders={totalOrders}
          />
        </motion.div>

        {/* Lista móvil / Tabla desktop */}
        <motion.div variants={itemVariants}>
          {orders.length === 0 ? (
            <Card>
              <EmptyState
                size="sm"
                icon={<ShoppingBag className="w-6 h-6" />}
                title="Sin pedidos"
                description="Aún no tienes pedidos con los filtros seleccionados."
              />
            </Card>
          ) : (
            <>
              {/* Móvil: lista de tarjetas */}
              <MobileCardList
                className="block lg:hidden"
                isLoading={isTableLoading}
                renderSkeleton={() => <OrderCardSkeleton />}
              >
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={handleViewDetails}
                  />
                ))}
              </MobileCardList>

              {/* Desktop: tabla */}
              <div className="hidden lg:block">
                <OrdersTable
                  orders={orders}
                  onViewDetails={handleViewDetails}
                  isLoading={isTableLoading}
                />
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="mt-6"
                />
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </>
    </MobilePullRefresh>
  );
}

