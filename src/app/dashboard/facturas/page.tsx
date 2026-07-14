'use client';

/**
 * @page FacturasPage
 * @description Página de listado de facturas de venta del productor
 *
 * Sigue el mismo patrón de orders/page.tsx:
 * - PageHeader con información contextual
 * - Vista móvil: MobileCardList con InvoiceCard
 * - Vista desktop: Tabla con InvoicesTable
 * - Paginación
 * - Estados de error, carga y vacío
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FileText } from 'lucide-react';

// Componentes UI
import { Card, Pagination, MobilePullRefresh, PageLoader, PageError, MobileCardList, EmptyState } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { InvoicesTable } from './components/InvoicesTable';
import { InvoiceCard, InvoiceCardSkeleton } from './components/InvoiceCard';

// API
import { fetchSellerInvoices, type InvoiceListItem } from '@/lib/api/orders';

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

export default function FacturasPage() {
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
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadInvoices(true);
      return;
    }
    loadInvoices(false);
  }, [currentPage]);

  const loadInvoices = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);

    try {
      const response = await fetchSellerInvoices({
        page: currentPage,
        limit: 10,
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setInvoices(response.data.invoices);
        setTotalPages(Math.ceil(response.data.total / response.data.limit));
        setTotalInvoices(response.data.total);
      }
    } catch (err) {
      setError('Error al cargar las facturas');
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const handleDownload = async (orderId: string) => {
    try {
      // Construir la URL de descarga directa
      const downloadUrl = `/api/v1/orders/seller/${orderId}/invoice/download`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error descargando factura:', err);
      alert('Error al descargar la factura');
    }
  };

  const handleRefresh = async () => { await loadInvoices(); };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isFirstLoad.current && isLoading) {
    return <PageLoader message="Cargando facturas..." className="animate-fade-in" />;
  }

  if (error && !isFirstLoad.current) {
    return (
      <PageError
        title="Error al cargar"
        message={error}
        onRetry={loadInvoices}
      />
    );
  }

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
      <>
        {/* Cabecera */}
        <PageHeader
          title="Facturas de venta"
          description={`${totalInvoices} facturas en total`}
          badgeIcon={FileText}
          badgeText="Facturación"
          tooltip="Facturas de venta"
          tooltipDetailed="Aquí verás la factura de cada pedido de un solo vendedor. Los pedidos con productos de varios productores no generan factura individual."
        />

        {/* Contenido principal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8"
        >
          {/* Lista móvil / Tabla desktop */}
          <motion.div variants={itemVariants}>
            {invoices.length === 0 ? (
              <Card>
                <EmptyState
                  size="sm"
                  icon={<FileText className="w-6 h-6" />}
                  title="Sin facturas"
                  description="Aún no tienes facturas emitidas."
                />
              </Card>
            ) : (
              <>
                {/* Móvil: lista de tarjetas */}
                <MobileCardList
                  className="block lg:hidden"
                  isLoading={isTableLoading}
                  renderSkeleton={() => <InvoiceCardSkeleton />}
                >
                  {invoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.orderId}
                      invoice={invoice}
                      onPress={handleViewOrder}
                      onDownload={handleDownload}
                    />
                  ))}
                </MobileCardList>

                {/* Desktop: tabla */}
                <div className="hidden lg:block">
                  <InvoicesTable
                    invoices={invoices}
                    onDownload={handleDownload}
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
