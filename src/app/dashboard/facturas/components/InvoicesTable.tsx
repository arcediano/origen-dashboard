'use client';

/**
 * @component InvoicesTable
 * @description Tabla de facturas del productor con columnas ordenables
 */

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, type Column, Badge, Button } from '@arcediano/ux-library';
import { Download, FileText } from 'lucide-react';
import { INVOICE_STATUS_CONFIG } from '@/lib/invoices/status-config';
import type { InvoiceListItem } from '@/lib/api/orders';

interface InvoicesTableProps {
  invoices: InvoiceListItem[];
  onDownload?: (orderId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export function InvoicesTable({
  invoices,
  onDownload,
  className,
  isLoading = false
}: InvoicesTableProps) {

  const columns: Column<InvoiceListItem>[] = [
    {
      key: 'invoiceNumber',
      header: 'Nº factura',
      accessor: (item) => (
        <p className="text-sm font-medium text-origen-bosque">{item.invoiceNumber}</p>
      ),
      sortable: true,
      sortValue: (item) => item.invoiceNumber,
    },
    {
      key: 'orderNumber',
      header: 'Pedido',
      accessor: (item) => (
        <Link
          href={`/dashboard/orders/${item.orderId}`}
          className="text-sm text-origen-pradera hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {item.orderNumber}
        </Link>
      ),
      hideOnMobile: true,
    },
    {
      key: 'issuedAt',
      header: 'Fecha de emisión',
      accessor: (item) => (
        <p className="text-sm text-text-subtle">{item.issuedAt ? format(new Date(item.issuedAt), 'dd MMM yyyy', { locale: es }) : '—'}</p>
      ),
      sortable: true,
      sortValue: (item) => item.issuedAt ?? '',
      hideOnMobile: true,
    },
    {
      key: 'total',
      header: 'Importe',
      accessor: (item) => (
        <p className="text-sm font-bold text-origen-pradera">{item.total.toFixed(2)}€</p>
      ),
      sortable: true,
      sortValue: (item) => item.total,
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (item) => {
        const cfg = INVOICE_STATUS_CONFIG[item.status];
        return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
      },
      sortable: true,
      sortValue: (item) => item.status,
    },
    {
      key: 'download',
      header: '',
      accessor: (item) => (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!item.hasPdf}
          onClick={(e) => { e.stopPropagation(); onDownload?.(item.orderId); }}
          aria-label={`Descargar factura ${item.invoiceNumber}`}
        >
          <Download className="w-4 h-4" />
        </Button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <Table
      data={invoices}
      columns={columns}
      keyExtractor={(item) => item.orderId}
      sortable
      initialSortColumn="issuedAt"
      initialSortDirection="desc"
      loading={isLoading}
      onRowClick={(item) => {
        // Navegar al detalle del pedido al hacer click en la fila
        window.location.href = `/dashboard/orders/${item.orderId}`;
      }}
      rowClassName="cursor-pointer hover:bg-origen-crema/30 transition-colors"
      emptyIcon={<FileText className="h-8 w-8 text-origen-pino" />}
      emptyMessage="No hay facturas para mostrar"
      emptyDescription="Las facturas de tus ventas aparecerán aquí en cuanto se emitan."
    />
  );
}
