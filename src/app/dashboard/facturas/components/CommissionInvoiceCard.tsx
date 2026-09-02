'use client';

/**
 * @component CommissionInvoiceCard
 * @description Tarjeta de factura de comisión mensual para vistas móviles
 *
 * Mismo patrón que InvoiceCard.tsx, adaptado a la factura de comisión
 * (agregada por periodo, sin pedido individual al que enlazar).
 */

import { Receipt, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button } from '@arcediano/ux-library';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { INVOICE_STATUS_CONFIG } from '@/lib/invoices/status-config';
import type { CommissionInvoiceItem } from '@/lib/api/orders';

function formatPeriod(period: string): string {
  try {
    return format(parse(period, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es });
  } catch {
    return period;
  }
}

export function CommissionInvoiceCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-4 rounded-xl sm:rounded-2xl border border-border bg-surface-alt shadow-origen animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel/60 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-origen-pastel rounded-lg w-28" />
        <div className="h-3.5 bg-origen-pastel rounded-lg w-2/5" />
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="h-4 bg-origen-pastel rounded-lg w-16" />
        <div className="h-4 bg-origen-pastel/60 rounded-full w-14" />
      </div>
    </div>
  );
}

interface CommissionInvoiceCardProps {
  invoice: CommissionInvoiceItem;
  onDownload?: (id: string) => void;
}

export function CommissionInvoiceCard({ invoice, onDownload }: CommissionInvoiceCardProps) {
  const cfg = INVOICE_STATUS_CONFIG[invoice.status];

  return (
    <div
      className={cn(
        'relative rounded-xl sm:rounded-2xl border border-border shadow-origen',
        'px-4 py-4 flex items-center gap-3.5',
      )}
    >
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel flex items-center justify-center flex-shrink-0 shadow-subtle">
        <Receipt className="w-5 h-5 text-origen-pino" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-bold text-origen-bosque truncate capitalize">
            {formatPeriod(invoice.period)}
          </span>
          <Badge variant={cfg.variant} size="xs">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-text-subtle truncate">{invoice.invoiceNumber}</p>
        <p className="text-[11px] text-text-disabled mt-1">
          {invoice.orderCount} {invoice.orderCount === 1 ? 'pedido' : 'pedidos'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-base font-bold text-origen-bosque tabular-nums">{invoice.total.toFixed(2)} €</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDownload?.(invoice.id)}
          aria-label={`Descargar factura de comisión ${invoice.invoiceNumber}`}
          className="min-h-11 min-w-11"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
