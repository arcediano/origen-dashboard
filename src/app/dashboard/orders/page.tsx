/**
 * @page OrdersPage
 * @description Página principal de gestión de pedidos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

// Componentes UI
import { PageLoader } from '@/components/shared';
import { PageError } from '@/components/shared';
import { Card } from '@/components/ui/atoms/card';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { OrderStats } from './components/OrderStats';
import { OrderFilters } from './components/OrderFilters';
import { OrdersTable } from './components/OrdersTable';
import { OrderCard } from './components/OrderCard';
import { Pagination } from '@/components/ui/atoms/pagination';

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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300, 
      damping: 25
    }
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OrdersPage() {
  const router = useRouter();
  
  // Estados
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  useEffect(() => {
    loadOrders();
  }, [filters, currentPage]);

  const loadOrders = async () => {
    setIsLoading(true);
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
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/orders/${id}`);
  };

  const handleFilterChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading && !orders.length) {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8"
    >
      {/* Cabecera */}
      <PageHeader
        title="Gestión de pedidos"
        description={`${totalOrders} pedidos en total`}
        badgeIcon={ShoppingBag}
        badgeText="Seguimiento de pedidos"
        tooltip="Pedidos"
        tooltipDetailed="Gestiona todos los pedidos, su estado y seguimiento."
      />

      {/* Estadísticas */}
      {stats && (
        <motion.div variants={itemVariants}>
          <OrderStats stats={stats} />
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
          <Card className="py-8 sm:p-12 bg-surface-alt border border-border-subtle">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-origen-pastel flex items-center justify-center mb-3 sm:mb-4">
                <ShoppingBag className="w-7 h-7 text-origen-pino" />
              </div>
              <p className="text-sm font-semibold text-origen-bosque mb-1">Sin pedidos</p>
              <p className="text-xs text-text-subtle max-w-[240px]">
                Aún no tienes pedidos con los filtros seleccionados.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Móvil: lista de tarjetas */}
            <div className="block lg:hidden rounded-xl border border-border-subtle bg-surface overflow-hidden">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={handleViewDetails}
                />
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden lg:block">
              <OrdersTable
                orders={orders}
                onViewDetails={handleViewDetails}
                isLoading={isLoading}
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
  );
}