/**
 * @page OrderDetailPage
 * @description Página de detalle de pedido — experiencia app nativa
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Phone, Mail, ExternalLink, Info, FileText, ChevronDown, RotateCcw } from 'lucide-react';

// Componentes UI
import {
  Avatar,
  Button, Badge,
  ActionBar,
  ProductImage,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Textarea,
  CheckboxWithLabel,
  QuantitySelector,
  MobilePullRefresh,
  PageLoader,
  PageError,
  appShellPaddingClass,
  NAV_HEIGHT_MOBILE_DASHBOARD,
  toast,
} from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { HideBottomTabBar } from '@/components/shared/mobile/HideBottomTabBar';

// Hooks y API
import { fetchOrderById, fetchSellerOrderInvoice, updateOrderStatus } from '@/lib/api/orders';
import type { Order } from '@/types/order';

/**
 * Espejo de STATUSES_REQUIRING_PAYMENT en el backend
 * (origen-master-microservices/src/modules/orders/orders/orders.service.ts:45-49).
 * Debe mantenerse sincronizado a mano si el backend cambia esta lista — no
 * hay un paquete compartido de constantes entre repos. Usado para no
 * mostrar el botón de avance de estado cuando el backend lo va a rechazar
 * siempre por falta de pago confirmado (bugs-detalle-pedido-productor,
 * 2026-08-22).
 */
const STATUSES_REQUIRING_PAYMENT: Order['status'][] = ['processing', 'shipped', 'delivered'];

const statusConfig: Record<Order['status'], {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'leaf';
  label: string;
  icon: React.ElementType;
  color: string;
  bandBg: string;
  heroBorder: string;
}> = {
  pending: {
    variant: 'warning',
    label: 'Pendiente',
    icon: Clock,
    color: 'text-origen-bosque',
    bandBg: 'bg-origen-mandarina/10',
    heroBorder: 'border-origen-mandarina/30',
  },
  processing: {
    variant: 'info',
    label: 'Procesando',
    icon: Package,
    color: 'text-origen-pino',
    bandBg: 'bg-origen-pastel',
    heroBorder: 'border-origen-pradera/30',
  },
  shipped: {
    variant: 'info',
    label: 'Enviado',
    icon: Truck,
    color: 'text-origen-hoja',
    bandBg: 'bg-origen-pastel',
    heroBorder: 'border-origen-hoja/30',
  },
  delivered: {
    variant: 'success',
    label: 'Entregado',
    icon: CheckCircle,
    color: 'text-origen-bosque',
    bandBg: 'bg-origen-pastel',
    heroBorder: 'border-origen-bosque/20',
  },
  cancelled: {
    variant: 'danger',
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-feedback-danger-text',
    bandBg: 'bg-feedback-danger-subtle',
    heroBorder: 'border-feedback-danger/30',
  },
  returned: {
    variant: 'warning',
    label: 'Devolución solicitada',
    icon: RotateCcw,
    color: 'text-origen-mandarina',
    bandBg: 'bg-origen-mandarina/10',
    heroBorder: 'border-origen-mandarina/30',
  },
  refunded: {
    variant: 'danger',
    label: 'Reembolsado',
    icon: XCircle,
    color: 'text-feedback-danger-text',
    bandBg: 'bg-feedback-danger-subtle',
    heroBorder: 'border-feedback-danger/30',
  }
};

/**
 * Radio "app nativa" (28px) usado en todas las cards de esta pantalla —
 * mayor que el `rounded-2xl` (16px) estándar de `Card`/`AccordionCard` de
 * la librería, decisión deliberada de esta pantalla (ver docblock del
 * archivo). Centralizado aquí para no repetir el valor arbitrario
 * `rounded-[28px]` suelto en el archivo (B1, auditoria-diseno-2026-08-22.md).
 */
const NATIVE_CARD_RADIUS = 'rounded-[28px]';

// Animaciones de entrada
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28, delay: i * 0.08 },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

/** Formato de moneda es-ES (coma decimal, espacio antes del símbolo), consistente con dashboard/products/[id]/page.tsx. */
function formatCurrency(value?: number | null): string {
  return value == null ? '—' : `${value.toFixed(2).replace('.', ',')} €`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-subtle shrink-0">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function SectionAccordion({
  title, icon: Icon, defaultOpen = false, children, index = 0,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  index?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(NATIVE_CARD_RADIUS, 'border border-border bg-surface-alt shadow-subtle overflow-hidden')}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-alt/50 transition-colors"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-origen-pastel flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-hoja-tinta" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-text-subtle transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-border-subtle">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showCancelSheet, setShowCancelSheet]   = useState(false);
  const [showReturnSheet, setShowReturnSheet]   = useState(false);
  const [returnReason, setReturnReason] = useState('');
  // orderItemId -> cantidad a devolver (0/ausente = no seleccionado). El
  // backend exige al menos un ítem con cantidad > 0 cuando status === 'returned'.
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  const isFirstLoad = useRef(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchOrderById(orderId);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setOrder(response.data);
      }
    } catch (err) {
      setError('Error al cargar el pedido');
    } finally {
      setIsLoading(false);
      isFirstLoad.current = false;
    }
  };

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await updateOrderStatus(order.id, newStatus);
      if (response.data) {
        setOrder(response.data);
        setShowStatusSheet(false);
        setShowCancelSheet(false);
      } else if (response.error) {
        // El backend rechaza el avance de estado (p.ej. pago aún no confirmado,
        // ver gate de pago en changeStatusBySeller). Antes este error se
        // tragaba silenciosamente; ahora se muestra al vendedor.
        toast({ title: 'No se pudo actualizar el pedido', description: response.error, variant: 'error' });
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
      toast({ title: 'No se pudo actualizar el pedido', description: 'Error al actualizar el pedido', variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const returnItemsPayload = Object.entries(returnQuantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

  const handleRequestReturn = async () => {
    if (!order || !returnReason.trim() || returnItemsPayload.length === 0) return;

    setUpdating(true);
    try {
      const response = await updateOrderStatus(order.id, 'returned', returnReason.trim(), returnItemsPayload);
      if (response.data) {
        setOrder(response.data);
        setShowReturnSheet(false);
        setReturnReason('');
        setReturnQuantities({});
        toast({
          title: 'Devolución solicitada',
          description: 'El equipo de Origen la revisará en breve.',
          variant: 'success',
        });
      } else if (response.error) {
        toast({ title: 'No se pudo solicitar la devolución', description: response.error, variant: 'error' });
      }
    } catch (err) {
      console.error('Error solicitando devolución:', err);
      toast({ title: 'No se pudo solicitar la devolución', description: 'Error al solicitar la devolución', variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setDownloadingInvoice(true);
    setInvoiceError(null);

    try {
      const response = await fetchSellerOrderInvoice(order.id);
      if (response.error || !response.data) {
        setInvoiceError(response.error ?? 'No se pudo obtener la factura');
        return;
      }

      if (!response.data.downloadUrl) {
        setInvoiceError('La factura aún no tiene PDF disponible');
        return;
      }

      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setInvoiceError('Error al descargar la factura');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (isFirstLoad.current && isLoading) {
    return <PageLoader message="Cargando pedido..." className="animate-fade-in" />;
  }

  if (error || !order) {
    return (
      <PageError
        title="Error al cargar"
        message={error || 'Pedido no encontrado'}
        onRetry={loadOrder}
      />
    );
  }

  const status    = statusConfig[order.status];
  const canCancel  = ['pending', 'processing', 'shipped'].includes(order.status);
  // Flujo híbrido de devoluciones (2026-08-29): el productor solo puede
  // SOLICITAR la devolución desde "delivered" — aprobarla/rechazarla (y
  // ejecutar el reembolso real) es exclusivo del admin.
  const canRequestReturn = order.status === 'delivered';

  // Acción principal según estado
  const nextAction: { label: string; next: Order['status']; icon: React.ElementType } | null =
    order.status === 'pending'    ? { label: 'Marcar como procesando', next: 'processing', icon: Package } :
    order.status === 'processing' ? { label: 'Marcar como enviado',    next: 'shipped',    icon: Truck   } :
    order.status === 'shipped'    ? { label: 'Marcar como entregado',  next: 'delivered',  icon: CheckCircle } :
    null;

  // "delivered" ya NO es terminal: sigue mostrando la card de "Gestión del
  // pedido" (con la acción de solicitar devolución) en vez del mensaje fijo
  // de pedido completado.
  const isTerminal = ['cancelled', 'refunded', 'returned'].includes(order.status);
  const isMultiSeller = order.isMultiSeller === true;
  const isPaymentUnconfirmed =
    !!nextAction &&
    STATUSES_REQUIRING_PAYMENT.includes(nextAction.next) &&
    !order.payment.paidAt;

  /**
   * M2 (auditoria-diseno-2026-08-22.md): en móvil, el `ActionBar` fijo
   * inferior ya cubre exactamente esta misma acción bajo la misma
   * condición (ver render de `ActionBar` más abajo) — mostrar también los
   * botones dentro de la card "Gestión del pedido" duplica el CTA en
   * pantalla. Solo se oculta la card en móvil cuando su contenido sería
   * 100% redundante con el ActionBar; en el resto de casos (multi-vendedor,
   * pago sin confirmar) la card aporta información que el ActionBar no
   * muestra y se mantiene visible en todos los tamaños.
   */
  const managementActionsDuplicateActionBar = !isMultiSeller && !!nextAction && !isPaymentUnconfirmed;

  const handleRefresh = async () => { await loadOrder(); };

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
      <>
        {/* Cabecera */}
        <PageHeader
          title={`Pedido ${order.orderNumber}`}
          description={format(order.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}
          badgeIcon={ShoppingBag}
          badgeText={status.label}
          tooltip="Detalle del pedido"
          tooltipDetailed="Información completa del pedido, productos y seguimiento."
          showBackButton
          onBack={() => router.back()}
          actions={
            order.invoice?.hasPdf ? (
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={handleDownloadInvoice}
                  loading={downloadingInvoice}
                  disabled={downloadingInvoice}
                >
                  Descargar factura
                </Button>
              </div>
            ) : undefined
          }
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={cn(
            'container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pb-10',
            nextAction ? appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 36) : 'pb-6'
          )}
        >
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">

            {/* ══ SIDEBAR ══ Izquierda en desktop, primero en móvil */}
            <div className="lg:col-span-5 flex flex-col gap-4 mb-4 lg:mb-0">

              {/* ── Hero card del pedido — siempre visible (mobile + desktop) ── */}
              <motion.div custom={0} variants={cardVariants}>
                <div className={cn(NATIVE_CARD_RADIUS, 'border border-origen-pradera/25 bg-surface-alt p-4 sm:p-5 shadow-sm')}>
                  {/* Icono de estado + badge — el número de pedido y su fecha
                      exacta ya viven en PageHeader (title/description); no se
                      repiten aquí (M1, viola R26 si se duplican). Se muestra
                      en su lugar la fecha relativa, dato que PageHeader no
                      ofrece. */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-origen-pastel flex items-center justify-center shrink-0">
                      <status.icon className={cn('w-5 h-5', status.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="mb-1.5">
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <p className="text-xs text-text-subtle">
                        {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                  {/* Total + método de pago */}
                  <div className="flex items-end justify-between pt-3 border-t border-border-subtle">
                    <div>
                      <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider leading-none mb-1">Total</p>
                      <p className={cn('text-2xl font-extrabold tabular-nums leading-none', status.color)}>
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                      <span className="text-xs text-text-subtle capitalize">{order.payment.method}</span>
                      <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
                        {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Gestión del pedido ──
                  M2: oculta en móvil cuando su contenido sería 100%
                  redundante con el ActionBar fijo inferior (ver comentario
                  de managementActionsDuplicateActionBar). En los demás
                  casos (multi-vendedor, pago sin confirmar) se mantiene
                  visible en todos los tamaños: no hay ActionBar equivalente
                  con esa información. */}
              {!isTerminal ? (
                <motion.div
                  custom={1}
                  variants={cardVariants}
                  className={cn(managementActionsDuplicateActionBar && 'hidden lg:block')}
                >
                  <div className={cn(NATIVE_CARD_RADIUS, 'border border-border bg-surface-alt shadow-subtle p-4 sm:p-5 space-y-2')}>
                    <SectionLabel>Gestión del pedido</SectionLabel>
                    {isMultiSeller ? (
                      <div className="flex items-start gap-2 rounded-xl bg-origen-nube border border-dashed border-origen-bosque/20 px-3 py-2.5">
                        <Info className="w-4 h-4 text-origen-pino shrink-0 mt-0.5" aria-hidden />
                        <p className="text-xs text-text-subtle leading-relaxed">
                          Este pedido incluye productos de varios productores. La gestión del estado, incluida la cancelación, se coordina de forma centralizada y no está disponible desde el panel de un productor individual.
                        </p>
                      </div>
                    ) : (
                      <>
                        {nextAction && (
                          isPaymentUnconfirmed ? (
                            <div className="flex items-start gap-2 rounded-xl bg-origen-nube border border-dashed border-origen-bosque/20 px-3 py-2.5">
                              <Info className="w-4 h-4 text-origen-pino shrink-0 mt-0.5" aria-hidden />
                              <p className="text-xs text-text-subtle leading-relaxed">
                                El pago de este pedido aún no se ha confirmado. Podrás avanzar su estado en cuanto se confirme el cobro.
                              </p>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="md"
                              leftIcon={<nextAction.icon className="w-4 h-4" />}
                              onClick={() => handleUpdateStatus(nextAction.next)}
                              loading={updating}
                              loadingText="Actualizando..."
                              className="w-full justify-start"
                            >
                              {nextAction.label}
                            </Button>
                          )
                        )}
                        {canCancel && (
                          <Button
                            variant="destructive"
                            size="md"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            onClick={() => setShowCancelSheet(true)}
                            disabled={updating}
                            className="w-full justify-start"
                          >
                            Cancelar pedido
                          </Button>
                        )}
                        {canRequestReturn && (
                          <Button
                            variant="outline"
                            size="md"
                            leftIcon={<RotateCcw className="w-4 h-4" />}
                            onClick={() => setShowReturnSheet(true)}
                            disabled={updating}
                            className="w-full justify-start"
                          >
                            Solicitar devolución
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div custom={1} variants={cardVariants}>
                  <div className={cn(NATIVE_CARD_RADIUS, 'border border-border bg-surface-alt shadow-subtle p-4')}>
                    <p className="text-xs text-text-subtle flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      {order.status === 'returned' ? 'Devolución solicitada — el equipo de Origen la está revisando.' :
                       order.status === 'cancelled' ? 'Este pedido fue cancelado.' :
                       'Este pedido fue reembolsado.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── Cliente ── (acordeón)
                  M4: cerrado por defecto (antes defaultOpen) — reduce el
                  scroll antes de llegar a "Artículos del pedido" en móvil y
                  unifica el comportamiento con "Pago y factura"/"Historial",
                  que ya empezaban cerrados. */}
              <SectionAccordion title="Cliente" icon={Mail} index={2}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    size="sm"
                    fallback={
                      <span className="font-bold text-origen-bosque">
                        {order.customerName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    }
                  />
                  <p className="text-sm font-semibold text-foreground leading-tight">{order.customerName}</p>
                </div>
                <div className="space-y-1.5">
                  {order.customerEmail && (
                    <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-hoja-tinta" />
                      {order.customerEmail}
                    </a>
                  )}
                  {order.customerPhone && (
                    <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-hoja-tinta" />
                      {order.customerPhone}
                    </a>
                  )}
                  {!order.customerEmail && !order.customerPhone && (
                    <p className="text-xs text-text-disabled">Sin datos de contacto adicionales.</p>
                  )}
                </div>
              </SectionAccordion>

              {/* ── Pago y factura ── (acordeón) */}
              <SectionAccordion title="Pago y factura" icon={CreditCard} index={3}>
                <div>
                  <InfoRow label="Método" value={<span className="capitalize">{order.payment.method}</span>} />
                  <InfoRow label="Estado" value={
                    <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
                      {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  } />
                  {order.payment.paidAt && (
                    <InfoRow label="Fecha de pago" value={format(order.payment.paidAt, 'dd MMM yyyy', { locale: es })} />
                  )}
                </div>

                {/* Tres estados de factura */}
                {order.invoice ? (
                  <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-hoja-tinta shrink-0" />
                        <span className="text-xs text-text-subtle truncate">Factura {order.invoice.invoiceNumber}</span>
                      </div>
                      <Badge variant={order.invoice.status === 'issued' ? 'success' : 'warning'} size="xs">
                        {order.invoice.status === 'issued' ? 'Emitida' : 'Borrador'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={handleDownloadInvoice}
                      loading={downloadingInvoice}
                      disabled={!order.invoice.hasPdf || downloadingInvoice}
                    >
                      {order.invoice.hasPdf ? 'Descargar factura' : 'Factura sin PDF'}
                    </Button>
                    {invoiceError && (
                      <p className="text-xs text-feedback-danger">{invoiceError}</p>
                    )}
                  </div>
                ) : (() => {
                  // isMultiSeller viene calculado desde el servidor sobre el pedido
                  // completo (order.items aquí ya está filtrado a solo los productos
                  // de este vendedor, así que nunca se podría derivar correctamente
                  // en el cliente contando nada dentro de ese array).
                  const isMultiSeller = order.isMultiSeller === true;

                  return isMultiSeller ? (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <div className="flex items-start gap-2 rounded-xl bg-origen-nube border border-dashed border-origen-bosque/20 px-3 py-2.5">
                        <Info className="w-4 h-4 text-origen-pino shrink-0 mt-0.5" aria-hidden />
                        <p className="text-xs text-text-subtle leading-relaxed">
                          Este pedido incluye productos de varios productores. La factura consolidada la gestiona el comprador.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <p className="text-xs text-text-subtle">Factura aún no disponible.</p>
                    </div>
                  );
                })()}
              </SectionAccordion>

              {/* ── Envío ── (acordeón) — M4: cerrado por defecto, ver nota en "Cliente" */}
              <SectionAccordion title="Dirección de envío" icon={MapPin} index={4}>
                {/* Layout de dos columnas en pantallas anchas (nombre / dirección completa),
                    consistente con el patrón InfoRow del resto de secciones del acordeón —
                    antes era un bloque icon+texto autodimensionado que dejaba gran parte del
                    ancho de la tarjeta vacío en desktop. Colapsa a una columna en móvil. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 mb-1 [&>div]:border-0">
                  <InfoRow label="Nombre" value={order.shipping.address.fullName} />
                  <InfoRow
                    label="Dirección"
                    value={
                      <span className="block text-right">
                        <span className="block">{order.shipping.address.addressLine1}</span>
                        {order.shipping.address.addressLine2 && (
                          <span className="block">{order.shipping.address.addressLine2}</span>
                        )}
                        <span className="block">
                          {order.shipping.address.postalCode} {order.shipping.address.city}
                          {order.shipping.address.state && `, ${order.shipping.address.state}`}
                          {order.shipping.address.country && `, ${order.shipping.address.country}`}
                        </span>
                      </span>
                    }
                  />
                </div>
                {(order.shipping.address.phone || order.shipping.address.email) && (
                  <div className="pt-3 border-t border-border-subtle space-y-1.5">
                    {order.shipping.address.phone && (
                      <InfoRow
                        label="Teléfono"
                        value={<a href={`tel:${order.shipping.address.phone}`} className="text-hoja-tinta hover:underline">{order.shipping.address.phone}</a>}
                      />
                    )}
                    {order.shipping.address.email && (
                      <InfoRow
                        label="Email"
                        value={<a href={`mailto:${order.shipping.address.email}`} className="text-hoja-tinta hover:underline">{order.shipping.address.email}</a>}
                      />
                    )}
                  </div>
                )}
                {order.shipping.trackingNumber && (
                  <div className="pt-3 border-t border-border-subtle space-y-1.5">
                    <InfoRow
                      label="Nº seguimiento"
                      value={<span className="font-mono">{order.shipping.trackingNumber}</span>}
                    />
                    {order.shipping.trackingUrl && (
                      <a
                        href={order.shipping.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-hoja-tinta hover:underline"
                      >
                        Seguir envío <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </SectionAccordion>
            </div>

            {/* ══ CONTENIDO PRINCIPAL ══ Derecha en desktop, segundo en móvil */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              {/* ── Artículos del pedido ── */}
              <motion.div custom={1} variants={cardVariants} className={cn(NATIVE_CARD_RADIUS, 'border border-border bg-surface-alt shadow-subtle overflow-hidden')}>
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-2">
                  <Package className="w-4 h-4 text-hoja-tinta" />
                  <span className="text-sm font-semibold text-foreground">Artículos del pedido</span>
                  <span className="ml-auto text-xs text-text-subtle">{order.items.length} artículo{order.items.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-border-subtle">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-14 h-14 rounded-2xl bg-origen-crema/60 flex-shrink-0 border border-border-subtle overflow-hidden">
                        <ProductImage
                          src={item.productImage}
                          alt={item.productName}
                          fallback={<Package className="w-6 h-6 text-text-disabled" />}
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">{item.productName}</p>
                        <p className="text-xs text-text-subtle mt-0.5">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                          {item.discount && <span className="text-hoja-tinta ml-1.5">−{item.discount}%</span>}
                        </p>
                        {/* commissionRate == null (no !== undefined) porque el backend distingue
                            "sin snapshot capturado" (null, pedido legado o sin Stripe Connect) de
                            "comisión 0% real" (0, snapshot capturado con tarifa aún no configurada) —
                            solo el primer caso omite la línea; ambigüedad reportada en
                            bugs-detalle-pedido-comprador, 2026-08-28. */}
                        {item.commissionRate != null && (
                          <p className="text-xs text-text-subtle mt-1">
                            Comisión de Origen: {item.commissionRate}%
                            {item.commissionAmount != null && ` (${formatCurrency(item.commissionAmount)})`}
                          </p>
                        )}
                      </div>
                      {/* Precio */}
                      <p className="text-sm font-bold text-foreground flex-shrink-0 tabular-nums">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>

                {/* Resumen de precios */}
                <div className="px-5 py-4 bg-origen-nube border-t border-border-subtle space-y-1.5">
                  <div className="flex justify-between text-xs text-text-subtle">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.couponCode && (
                    <div className="flex justify-between text-xs text-text-subtle">
                      <span>Cupón</span>
                      <span className="font-medium text-hoja-tinta">{order.couponCode}</span>
                    </div>
                  )}
                  {order.discount && (
                    <div className="flex justify-between text-xs text-text-subtle">
                      <span>Descuento</span>
                      <span className="font-medium text-hoja-tinta">−{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-text-subtle">
                    <span>Gastos de envío</span>
                    <span className="font-medium text-foreground">{formatCurrency(order.shipping.cost)}</span>
                  </div>
                  {order.tax && (
                    <div className="flex justify-between text-xs text-text-subtle">
                      <span>IVA</span>
                      <span className="font-medium text-foreground">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border-subtle">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground tabular-nums">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </motion.div>

              {/* ── Historial del pedido ── */}
              <SectionAccordion title="Historial del pedido" icon={Clock} index={2}>
                {order.timeline.length > 0 ? (
                  (() => {
                    // order.timeline llega ordenado descendente (más reciente primero,
                    // ver lib/api/orders.ts:246-248); se reordena aquí a ascendente
                    // (más antiguo arriba) para preservar el sentido de lectura de la
                    // versión anterior de esta sección, sin mutar order.timeline.
                    const timelineAsc = [...order.timeline].sort(
                      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                    );
                    return (
                      <div className="space-y-4">
                        {timelineAsc.map((event, idx) => {
                          const isLast = idx === timelineAsc.length - 1;
                          return (
                            <div key={event.id} className="flex items-start gap-3">
                              <div className="relative flex flex-col items-center flex-shrink-0">
                                <div
                                  className={cn(
                                    'w-3 h-3 rounded-full mt-0.5 flex-shrink-0',
                                    isLast ? 'bg-origen-bosque ring-4 ring-origen-bosque/15' : 'bg-origen-pradera/40'
                                  )}
                                />
                                {!isLast && <div className="w-0.5 h-8 bg-border-subtle mt-1" />}
                              </div>
                              <div className="flex-1 pb-2">
                                <p className="text-sm font-medium text-origen-bosque leading-tight">
                                  {event.description}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-text-subtle">
                                    {format(event.createdAt, 'dd MMM · HH:mm', { locale: es })}
                                  </p>
                                  <span className="text-text-disabled text-xs">·</span>
                                  <p className="text-xs text-text-subtle">
                                    {formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-text-subtle italic">
                    Aún no hay eventos registrados para este pedido.
                  </p>
                )}
              </SectionAccordion>

            </div>
          </div>
        </motion.div>

        {/* ── ActionBar móvil ── */}
        {nextAction && !isMultiSeller && !isPaymentUnconfirmed && (
          <>
            {/* Oculta el BottomTabBar mientras hay acciones de estado disponibles */}
            <HideBottomTabBar />
            <ActionBar
              primaryAction={{
                id: 'advance-status',
                label: nextAction.label,
                leftIcon: <nextAction.icon className="w-4 h-4" />,
                onClick: () => setShowStatusSheet(true),
                disabled: updating,
              }}
              secondaryActions={canCancel ? [{
                id: 'cancel-order',
                label: 'Cancelar pedido',
                leftIcon: <XCircle className="w-4 h-4" />,
                onClick: () => setShowCancelSheet(true),
                disabled: updating,
                variant: 'destructive' as const,
              }] : []}
            />
          </>
        )}

        {/* ── Sheet de confirmación de estado (móvil) ── */}
        <Sheet open={showStatusSheet} onOpenChange={setShowStatusSheet}>
          <SheetContent side="bottom" className="rounded-t-[28px] px-5 pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-left text-origen-bosque">Actualizar estado</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className={cn('rounded-2xl p-4 flex items-center gap-3 border', status.bandBg, status.heroBorder)}>
                <status.icon className={cn('w-5 h-5 shrink-0', status.color)} />
                <div>
                  <p className="text-xs text-text-subtle">Estado actual</p>
                  <p className={cn('text-sm font-bold', status.color)}>{status.label}</p>
                </div>
              </div>
              {nextAction && (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<nextAction.icon className="w-4 h-4" />}
                  onClick={() => handleUpdateStatus(nextAction.next)}
                  loading={updating}
                  loadingText="Actualizando..."
                  className="w-full"
                >
                  {nextAction.label}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Sheet de confirmación de cancelación ── */}
        <Sheet open={showCancelSheet} onOpenChange={setShowCancelSheet}>
          <SheetContent side="bottom" className="rounded-t-[28px] px-5 pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-left text-feedback-danger">Cancelar pedido</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <p className="text-sm text-text-subtle leading-relaxed">
                ¿Seguro que quieres cancelar el pedido{' '}
                <span className="font-semibold text-foreground">{order.orderNumber}</span>?{' '}
                Esta acción no se puede deshacer.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowCancelSheet(false)}
                className="w-full"
              >
                Mantener pedido
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => handleUpdateStatus('cancelled')}
                loading={updating}
                loadingText="Cancelando..."
                className="w-full text-feedback-danger hover:bg-feedback-danger-subtle"
              >
                Sí, cancelar pedido
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Sheet de solicitud de devolución ──
            Selección de ítems/cantidades (decisión del humano, 2026-08-29):
            el backend exige al menos un ítem con cantidad > 0 en `items`
            cuando status === 'returned' — ver SellerChangeStatusDto en
            origen-master-microservices. Sin esto la solicitud se rechaza
            con 400 (bug real reportado: el botón "no enviaba la solicitud"). */}
        <Sheet
          open={showReturnSheet}
          onOpenChange={(open) => {
            setShowReturnSheet(open);
            if (!open) {
              setReturnReason('');
              setReturnQuantities({});
            }
          }}
        >
          <SheetContent side="bottom" className="rounded-t-[28px] px-5 pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-left text-origen-bosque">Solicitar devolución</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <p className="text-sm text-text-subtle leading-relaxed">
                Selecciona qué productos del pedido{' '}
                <span className="font-semibold text-foreground">{order.orderNumber}</span>{' '}
                quiere devolver el cliente y cuéntanos el motivo. El equipo de Origen
                revisará la solicitud y, si la aprueba, se reembolsará al cliente
                automáticamente.
              </p>
              <div className="space-y-2">
                {order.items.map((item) => {
                  const checked = (returnQuantities[item.id] ?? 0) > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 bg-white border border-border-subtle rounded-[10px]"
                    >
                      <CheckboxWithLabel
                        label={item.productName}
                        description={`${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'} en el pedido`}
                        checked={checked}
                        disabled={updating}
                        onCheckedChange={(next) => {
                          setReturnQuantities((prev) => {
                            const updated = { ...prev };
                            if (next === true) {
                              updated[item.id] = item.quantity;
                            } else {
                              delete updated[item.id];
                            }
                            return updated;
                          });
                        }}
                      />
                      {checked && (
                        <QuantitySelector
                          value={returnQuantities[item.id] ?? 1}
                          onChange={(value) =>
                            setReturnQuantities((prev) => ({ ...prev, [item.id]: value }))
                          }
                          min={1}
                          max={item.quantity}
                          disabled={updating}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <Textarea
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Ej: el cliente dice que el producto llegó dañado"
                rows={3}
                disabled={updating}
              />
              <Button
                variant="primary"
                size="lg"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleRequestReturn}
                loading={updating}
                loadingText="Enviando solicitud..."
                disabled={updating || !returnReason.trim() || returnItemsPayload.length === 0}
                className="w-full"
              >
                Enviar solicitud
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReturnSheet(false)}
                disabled={updating}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    </MobilePullRefresh>
  );
}

