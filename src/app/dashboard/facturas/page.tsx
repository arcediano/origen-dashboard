'use client';

/**
 * @page FacturasPage
 * @description Página de listado de facturas de venta del productor
 *
 * Sigue el mismo patrón de orders/page.tsx:
 * - PageHeader con información contextual
 * - Vista móvil: lista de cards con InvoiceCard (space-y-3, mismo patrón que orders/page.tsx)
 * - Vista desktop: Tabla con InvoicesTable
 * - Paginación
 * - Estados de error, carga y vacío
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FileText, Receipt } from 'lucide-react';

// Componentes UI
import { Card, Pagination, MobilePullRefresh, PageLoader, PageError, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent, appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD, toast } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { InvoicesTable } from './components/InvoicesTable';
import { InvoiceCard, InvoiceCardSkeleton } from './components/InvoiceCard';
import { InvoiceFilters } from './components/InvoiceFilters';
import { CommissionInvoicesTable } from './components/CommissionInvoicesTable';
import { CommissionInvoiceCard, CommissionInvoiceCardSkeleton } from './components/CommissionInvoiceCard';

// API
import { fetchSellerInvoices, type InvoiceListItem, type InvoiceFilterParams, fetchSellerCommissionInvoices, type CommissionInvoiceItem } from '@/lib/api/orders';

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
  const [filters, setFilters] = useState<InvoiceFilterParams>({ status: 'issued' });

  // Facturas de comisión (pestaña "Comisión")
  const [activeTab, setActiveTab] = useState<'ventas' | 'comision'>('ventas');
  const [commissionInvoices, setCommissionInvoices] = useState<CommissionInvoiceItem[]>([]);
  const [isCommissionLoading, setIsCommissionLoading] = useState(false);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionTotalPages, setCommissionTotalPages] = useState(1);
  const [commissionTotal, setCommissionTotal] = useState(0);

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
  }, [currentPage, filters]);

  const loadInvoices = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);

    try {
      const response = await fetchSellerInvoices({
        ...filters,
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

  const loadCommissionInvoices = async () => {
    setIsCommissionLoading(true);
    setCommissionError(null);

    try {
      const response = await fetchSellerCommissionInvoices({
        page: commissionPage,
        limit: 10,
      });

      if (response.error) {
        setCommissionError(response.error);
      } else if (response.data) {
        setCommissionInvoices(response.data.items);
        setCommissionTotalPages(Math.ceil(response.data.total / response.data.limit));
        setCommissionTotal(response.data.total);
      }
    } catch (err) {
      setCommissionError('Error al cargar las facturas de comisión');
    } finally {
      setIsCommissionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'comision') return;
    loadCommissionInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, commissionPage]);

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
      toast({ title: 'Error al descargar la factura', description: 'Inténtalo de nuevo en unos segundos.', variant: 'error' });
    }
  };

  const handleFilterChange = (newFilters: InvoiceFilterParams) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1); // Reset a página 1 al cambiar filtros
  };

  const handleClearFilters = () => {
    setFilters({ status: 'issued' });
    setCurrentPage(1);
  };

  const handleDownloadCommission = async (id: string) => {
    try {
      const downloadUrl = `/api/v1/orders/seller/commission-invoices/${id}/download`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error descargando factura de comisión:', err);
      toast({ title: 'Error al descargar la factura', description: 'Inténtalo de nuevo en unos segundos.', variant: 'error' });
    }
  };

  const handleRefresh = async () => {
    if (activeTab === 'comision') {
      await loadCommissionInvoices();
    } else {
      await loadInvoices();
    }
  };

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
          title="Facturas"
          description={
            activeTab === 'comision'
              ? `${commissionTotal} facturas de comisión en total`
              : `${totalInvoices} facturas en total`
          }
          badgeIcon={FileText}
          badgeText="Facturación"
          tooltip="Facturas"
          tooltipDetailed="Facturas de venta: la factura de cada pedido de un solo vendedor (los pedidos con productos de varios productores no generan factura individual). Facturas de comisión: el documento fiscal mensual que Origen te emite por la comisión de tus ventas del mes."
        />

        {/* Contenido principal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8`}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ventas' | 'comision')}>
            <motion.div variants={itemVariants}>
              <TabsList>
                <TabsTrigger value="ventas" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Ventas
                </TabsTrigger>
                <TabsTrigger value="comision" className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Comisión
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="ventas" className="space-y-5 sm:space-y-6 lg:space-y-8">
              {/* Filtros */}
              <motion.div variants={itemVariants}>
                <InvoiceFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  totalInvoices={totalInvoices}
                />
              </motion.div>

              {/* Lista móvil / Tabla desktop */}
              <motion.div variants={itemVariants}>
                {invoices.length === 0 ? (
                  <Card>
                    <EmptyState
                      size="sm"
                      icon={<FileText className="w-6 h-6" />}
                      title={
                        filters.search || filters.dateFrom || filters.dateTo || (filters.status && filters.status !== 'issued')
                          ? "No hay facturas que coincidan"
                          : "Sin facturas"
                      }
                      description={
                        filters.search || filters.dateFrom || filters.dateTo || (filters.status && filters.status !== 'issued')
                          ? "Intenta con otros filtros o criterios de búsqueda."
                          : "Aún no tienes facturas emitidas."
                      }
                    />
                  </Card>
                ) : (
                  <>
                    {/* Móvil: lista de tarjetas */}
                    <div className="space-y-3 block lg:hidden" aria-busy={isTableLoading || undefined}>
                      {isTableLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <InvoiceCardSkeleton key={i} />
                          ))
                        : invoices.map((invoice) => (
                            <InvoiceCard
                              key={invoice.orderId}
                              invoice={invoice}
                              onPress={handleViewOrder}
                              onDownload={handleDownload}
                            />
                          ))}
                    </div>

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
            </TabsContent>

            <TabsContent value="comision" className="space-y-5 sm:space-y-6 lg:space-y-8">
              {isCommissionLoading && commissionInvoices.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CommissionInvoiceCardSkeleton key={i} />
                  ))}
                </div>
              ) : commissionError ? (
                <PageError title="Error al cargar" message={commissionError} onRetry={loadCommissionInvoices} />
              ) : commissionInvoices.length === 0 ? (
                <Card>
                  <EmptyState
                    size="sm"
                    icon={<Receipt className="w-6 h-6" />}
                    title="Sin facturas de comisión"
                    description="La factura mensual de comisión de Origen aparecerá aquí en cuanto se emita (se genera automáticamente el día 2 de cada mes)."
                  />
                </Card>
              ) : (
                <>
                  {/* Móvil: lista de tarjetas */}
                  <div className="space-y-3 block lg:hidden" aria-busy={isCommissionLoading || undefined}>
                    {commissionInvoices.map((invoice) => (
                      <CommissionInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onDownload={handleDownloadCommission}
                      />
                    ))}
                  </div>

                  {/* Desktop: tabla */}
                  <div className="hidden lg:block">
                    <CommissionInvoicesTable
                      invoices={commissionInvoices}
                      onDownload={handleDownloadCommission}
                      isLoading={isCommissionLoading}
                    />
                  </div>

                  {/* Paginación */}
                  {commissionTotalPages > 1 && (
                    <Pagination
                      currentPage={commissionPage}
                      totalPages={commissionTotalPages}
                      onPageChange={setCommissionPage}
                      className="mt-6"
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </>
    </MobilePullRefresh>
  );
}
