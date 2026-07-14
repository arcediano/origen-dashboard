'use client';

/**
 * @component InvoiceCard
 * @description Tarjeta de factura para vistas móviles
 *
 * Patrón idéntico a OrderCard.tsx pero sin SwipeableRow
 * (la única acción es Descargar, que debe ser visible siempre)
 */

import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button } from '@arcediano/ux-library';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { INVOICE_STATUS_CONFIG } from '@/lib/invoices/status-config';
import type { InvoiceListItem } from '@/lib/api/orders';

export function InvoiceCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-4 border-b border-border-subtle last:border-0 animate-pulse">
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

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onPress?: (orderId: string) => void;
  onDownload?: (orderId: string) => void;
}

export function InvoiceCard({ invoice, onPress, onDownload }: InvoiceCardProps) {
  const cfg = INVOICE_STATUS_CONFIG[invoice.status];

  return (
    <motion.button
      whileTap={{ scale: 0.985, backgroundColor: 'hsl(var(--crema))' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => onPress?.(invoice.orderId)}
      className="w-full text-left flex items-center gap-3.5 px-4 py-4 border-b border-border-subtle last:border-0 focus:outline-none active:bg-surface"
      aria-label={`Factura ${invoice.invoiceNumber}, pedido ${invoice.orderNumber}`}
    >
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel flex items-center justify-center flex-shrink-0 shadow-subtle">
        <FileText className="w-5 h-5 text-origen-pino" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-bold text-origen-bosque truncate">{invoice.invoiceNumber}</span>
          <Badge variant={cfg.variant} size="xs">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-text-subtle truncate">Pedido {invoice.orderNumber}</p>
        <p className="text-[11px] text-text-disabled mt-1">
          {format(new Date(invoice.issuedAt), 'dd MMM yyyy', { locale: es })}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-base font-bold text-origen-bosque tabular-nums">{invoice.total.toFixed(2)} €</span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!invoice.hasPdf}
          onClick={(e) => { e.stopPropagation(); onDownload?.(invoice.orderId); }}
          aria-label={`Descargar factura ${invoice.invoiceNumber}`}
          className="min-h-11 min-w-11"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </motion.button>
  );
}
