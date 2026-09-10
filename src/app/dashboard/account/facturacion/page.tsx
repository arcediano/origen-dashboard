'use client';

/**
 * @page FacturacionPage
 * @description Facturas de comisión mensual que Origen emite al productor.
 *
 * Antes vivía como pestaña "Comisión" de /dashboard/facturas — separada aquí
 * dentro de Mi cuenta (decisión del humano, 2026-09-09): las facturas de
 * comisión son un documento de la relación del productor con Origen, no de
 * un pedido concreto, así que encajan mejor junto a Seguridad/Cobros que
 * junto a las facturas de venta (que sí viven en Pedidos).
 */

import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';

import { Pagination, PageError, EmptyState, Card, appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD, toast } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { CommissionInvoicesTable } from '../../facturas/components/CommissionInvoicesTable';
import { CommissionInvoiceCard, CommissionInvoiceCardSkeleton } from '../../facturas/components/CommissionInvoiceCard';
import { fetchSellerCommissionInvoices, type CommissionInvoiceItem } from '@/lib/api/orders';

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<CommissionInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchSellerCommissionInvoices({
        page: currentPage,
        limit: 10,
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setInvoices(response.data.items);
        setTotalPages(Math.ceil(response.data.total / response.data.limit));
        setTotal(response.data.total);
      }
    } catch (err) {
      setError('Error al cargar las facturas de comisión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDownload = async (id: string) => {
    try {
      const downloadUrl = `/api/v1/orders/seller/commission-invoices/${id}/download`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error descargando factura de comisión:', err);
      toast({ title: 'Error al descargar la factura', description: 'Inténtalo de nuevo en unos segundos.', variant: 'error' });
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Facturación"
        description={`${total} facturas de comisión en total`}
        badgeIcon={Receipt}
        badgeText="Facturación"
        tooltip="Facturación"
        tooltipDetailed="El documento fiscal mensual que Origen te emite por la comisión de tus ventas del mes. Las facturas de cada pedido de tus clientes están en Pedidos → Ver facturas de venta."
      />

      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8 space-y-6`}>
        {isLoading && invoices.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CommissionInvoiceCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <PageError title="Error al cargar" message={error} onRetry={loadInvoices} />
        ) : invoices.length === 0 ? (
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
            <div className="space-y-3 block lg:hidden" aria-busy={isLoading || undefined}>
              {invoices.map((invoice) => (
                <CommissionInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onDownload={handleDownload}
                />
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden lg:block">
              <CommissionInvoicesTable
                invoices={invoices}
                onDownload={handleDownload}
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
      </div>
    </div>
  );
}
