'use client';

/**
 * @component CommissionInvoicesTable
 * @description Tabla de facturas de comisión mensuales del productor
 *
 * Mismo patrón que InvoicesTable.tsx, adaptado a la factura de comisión
 * (agregada por periodo, sin pedido individual al que enlazar).
 */

import React from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, type Column, Badge, Button } from '@arcediano/ux-library';
import { Download, Receipt } from 'lucide-react';
import { INVOICE_STATUS_CONFIG } from '@/lib/invoices/status-config';
import type { CommissionInvoiceItem } from '@/lib/api/orders';

function formatPeriod(period: string): string {
  try {
    return format(parse(period, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es });
  } catch {
    return period;
  }
}

interface CommissionInvoicesTableProps {
  invoices: CommissionInvoiceItem[];
  onDownload?: (id: string) => void;
  className?: string;
  isLoading?: boolean;
}

export function CommissionInvoicesTable({
  invoices,
  onDownload,
  isLoading = false,
}: CommissionInvoicesTableProps) {
  const columns: Column<CommissionInvoiceItem>[] = [
    {
      key: 'period',
      header: 'Periodo',
      accessor: (item) => (
        <p className="text-sm font-medium text-origen-bosque capitalize">{formatPeriod(item.period)}</p>
      ),
      sortable: true,
      sortValue: (item) => item.period,
    },
    {
      key: 'invoiceNumber',
      header: 'Nº factura',
      accessor: (item) => (
        <p className="text-sm text-text-subtle">{item.invoiceNumber}</p>
      ),
      hideOnMobile: true,
    },
    {
      key: 'orderCount',
      header: 'Pedidos',
      accessor: (item) => (
        <p className="text-sm text-text-subtle">{item.orderCount}</p>
      ),
      hideOnMobile: true,
    },
    {
      key: 'total',
      header: 'Importe',
      accessor: (item) => (
        <p className="text-sm font-bold text-origen-bosque">{item.total.toFixed(2)}€</p>
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
          onClick={(e) => { e.stopPropagation(); onDownload?.(item.id); }}
          aria-label={`Descargar factura de comisión ${item.invoiceNumber}`}
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
      keyExtractor={(item) => item.id}
      sortable
      initialSortColumn="period"
      initialSortDirection="desc"
      loading={isLoading}
      emptyIcon={<Receipt className="h-8 w-8 text-origen-pino" />}
      emptyMessage="No hay facturas de comisión para mostrar"
      emptyDescription="La factura mensual de comisión de Origen aparecerá aquí en cuanto se emita."
    />
  );
}
