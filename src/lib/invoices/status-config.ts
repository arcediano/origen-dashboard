/**
 * @file status-config.ts
 * @description Configuración de mapeo de estados de factura a variantes visuales.
 *
 * Centraliza el mapeo de `OrderInvoice.status` a:
 * - Variantes de `Badge` de @arcediano/ux-library
 * - Labels localizados en español
 *
 * Reutilizar en:
 * - InvoicesTable.tsx (origen-dashboard)
 * - InvoiceCard.tsx (origen-dashboard)
 * - Cualquier otra zona que muestre estado de factura
 */

export type InvoiceStatus = 'draft' | 'issued' | 'cancelled';

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  issued: { variant: 'success', label: 'Emitida' },
  draft: { variant: 'warning', label: 'Borrador' },
  cancelled: { variant: 'danger', label: 'Anulada' },
};
