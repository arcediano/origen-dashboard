/**
 * @page OrderDetailPage
 * @description Página de detalle de pedido — experiencia app nativa
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Phone, Mail, ExternalLink, Info, FileText, ChevronDown } from 'lucide-react';

// Componentes UI
import {
  Button, Badge,
  ActionBar,
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@arcediano/ux-library';
import { PageLoader } from '@/components/shared';
import { PageError } from '@/components/shared';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { MobilePullRefresh } from '@/components/features/dashboard/components/mobile';
import { HideBottomTabBar } from '@/components/shared/mobile/HideBottomTabBar';

// Hooks y API
import { fetchOrderById, fetchSellerOrderInvoice, updateOrderStatus } from '@/lib/api/orders';
import type { Order } from '@/types/order';

const statusConfig: Record<Order['status'], {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'leaf';
  label: string;
  icon: React.ElementType;
  color: string;
  bandBg: string;
  heroBg: string;
  heroBorder: string;
}> = {
  pending: {
    variant: 'warning',
    label: 'Pendiente',
    icon: Clock,
    color: 'text-origen-bosque',
    bandBg: 'bg-origen-mandarina/10',
    heroBg: 'bg-gradient-to-br from-origen-mandarina/20 to-origen-mandarina/8',
    heroBorder: 'border-origen-mandarina/30',
  },
  processing: {
    variant: 'info',
    label: 'Procesando',
    icon: Package,
    color: 'text-origen-pino',
    bandBg: 'bg-origen-pastel',
    heroBg: 'bg-gradient-to-br from-origen-pastel to-origen-crema/60',
    heroBorder: 'border-origen-pradera/30',
  },
  shipped: {
    variant: 'info',
    label: 'Enviado',
    icon: Truck,
    color: 'text-origen-hoja',
    bandBg: 'bg-origen-pastel',
    heroBg: 'bg-gradient-to-br from-origen-pastel to-origen-crema/60',
    heroBorder: 'border-origen-hoja/30',
  },
  delivered: {
    variant: 'success',
    label: 'Entregado',
    icon: CheckCircle,
    color: 'text-origen-bosque',
    bandBg: 'bg-origen-pastel',
    heroBg: 'bg-gradient-to-br from-origen-bosque/10 to-origen-pastel/80',
    heroBorder: 'border-origen-bosque/20',
  },
  cancelled: {
    variant: 'danger',
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-700',
    bandBg: 'bg-feedback-danger-subtle',
    heroBg: 'bg-gradient-to-br from-feedback-danger-subtle to-red-50/60',
    heroBorder: 'border-red-200',
  },
  refunded: {
    variant: 'danger',
    label: 'Reembolsado',
    icon: XCircle,
    color: 'text-red-700',
    bandBg: 'bg-feedback-danger-subtle',
    heroBg: 'bg-gradient-to-br from-feedback-danger-subtle to-red-50/60',
    heroBorder: 'border-red-200',
  }
};

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
      <span className="text-xs font-semibold text-origen-bosque text-right">{value}</span>
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
      className="rounded-[28px] border border-border bg-surface-alt shadow-subtle overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-alt/50 transition-colors"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-origen-pradera/15 to-origen-hoja/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-origen-pradera" />
        </div>
        <span className="flex-1 text-sm font-semibold text-origen-bosque">{title}</span>
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
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
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

  if (isLoading) {
    return <PageLoader message="Cargando pedido..." />;
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
  const canUpdate = !['delivered', 'cancelled', 'refunded'].includes(order.status);
  const canCancel  = ['pending', 'processing', 'shipped'].includes(order.status);

  // Acción principal según estado
  const nextAction: { label: string; next: Order['status']; icon: React.ElementType } | null =
    order.status === 'pending'    ? { label: 'Marcar como procesando', next: 'processing', icon: Package } :
    order.status === 'processing' ? { label: 'Marcar como enviado',    next: 'shipped',    icon: Truck   } :
    order.status === 'shipped'    ? { label: 'Marcar como entregado',  next: 'delivered',  icon: CheckCircle } :
    null;

  const isTerminal = !canUpdate;
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
            nextAction ? 'pb-[calc(124px+env(safe-area-inset-bottom,0px))]' : 'pb-6'
          )}
        >
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">

            {/* ══ SIDEBAR ══ Izquierda en desktop, primero en móvil */}
            <div className="lg:col-span-5 flex flex-col gap-4 mb-4 lg:mb-0">

              {/* ── Hero card del pedido — siempre visible (mobile + desktop) ── */}
              <motion.div custom={0} variants={cardVariants}>
                <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 sm:p-5 shadow-sm">
                  {/* Icono de estado + número + badge */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-origen-pradera/15 to-origen-hoja/15 flex items-center justify-center shrink-0">
                      <status.icon className={cn('w-5 h-5', status.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="mb-1.5">
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <p className="text-xs text-text-subtle uppercase tracking-widest font-semibold mb-0.5">Pedido</p>
                      <h1 className="text-base font-bold text-origen-bosque leading-snug">{order.orderNumber}</h1>
                      <p className="text-xs text-text-subtle mt-0.5">
                        {format(order.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  {/* Total + método de pago */}
                  <div className="flex items-end justify-between pt-3 border-t border-border-subtle">
                    <div>
                      <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider leading-none mb-1">Total</p>
                      <p className={cn('text-2xl font-extrabold tabular-nums leading-none', status.color)}>
                        {order.total.toFixed(2)}€
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

              {/* ── Gestión del pedido ── */}
              {!isTerminal ? (
                <motion.div custom={1} variants={cardVariants}>
                  <div className="rounded-[28px] border border-border bg-surface-alt shadow-subtle p-4 sm:p-5 space-y-2">
                    <SectionLabel>Gestión del pedido</SectionLabel>
                    {nextAction && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<nextAction.icon className="w-4 h-4" />}
                        onClick={() => handleUpdateStatus(nextAction.next)}
                        loading={updating}
                        loadingText="Actualizando..."
                        className="w-full justify-start"
                      >
                        {nextAction.label}
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<XCircle className="w-4 h-4 text-feedback-danger" />}
                        onClick={() => setShowCancelSheet(true)}
                        disabled={updating}
                        className="w-full justify-start text-feedback-danger hover:bg-feedback-danger-subtle"
                      >
                        Cancelar pedido
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div custom={1} variants={cardVariants}>
                  <div className="rounded-[28px] border border-border bg-surface-alt shadow-subtle p-4">
                    <p className="text-xs text-text-subtle flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      {order.status === 'delivered' ? 'Pedido completado correctamente.' :
                       order.status === 'cancelled' ? 'Este pedido fue cancelado.' :
                       'Este pedido fue reembolsado.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── Cliente ── (acordeón) */}
              <SectionAccordion title="Cliente" icon={Mail} defaultOpen index={2}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-origen-pastel flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-origen-bosque">
                      {order.customerName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-origen-bosque leading-tight">{order.customerName}</p>
                </div>
                <div className="space-y-1.5">
                  <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-origen-pradera" />
                    {order.customerEmail}
                  </a>
                  {order.customerPhone && (
                    <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-origen-pradera" />
                      {order.customerPhone}
                    </a>
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
                {order.invoice && (
                  <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-origen-pradera shrink-0" />
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
                )}
              </SectionAccordion>

              {/* ── Envío ── (acordeón) */}
              <SectionAccordion title="Dirección de envío" icon={MapPin} defaultOpen index={4}>
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-origen-pradera mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">{order.shipping.address.fullName}</p>
                    <p className="text-xs text-text-subtle mt-0.5">{order.shipping.address.addressLine1}</p>
                    {order.shipping.address.addressLine2 && (
                      <p className="text-xs text-text-subtle">{order.shipping.address.addressLine2}</p>
                    )}
                    <p className="text-xs text-text-subtle">
                      {order.shipping.address.city}, {order.shipping.address.postalCode}
                    </p>
                  </div>
                </div>
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
                        className="inline-flex items-center gap-1 text-xs font-medium text-origen-pradera hover:underline"
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
              <motion.div custom={1} variants={cardVariants} className="rounded-[28px] border border-border bg-surface-alt shadow-subtle overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-2">
                  <Package className="w-4 h-4 text-origen-pradera" />
                  <span className="text-sm font-semibold text-origen-bosque">Artículos del pedido</span>
                  <span className="ml-auto text-xs text-text-subtle">{order.items.length} artículo{order.items.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-border-subtle">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-14 h-14 rounded-2xl bg-origen-crema/60 flex items-center justify-center flex-shrink-0 border border-border-subtle">
                        <Package className="w-6 h-6 text-text-disabled" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-origen-bosque leading-tight truncate">{item.productName}</p>
                        <p className="text-xs text-text-subtle mt-0.5">
                          {item.quantity} × {item.unitPrice.toFixed(2)}€
                          {item.discount && <span className="text-origen-hoja ml-1.5">−{item.discount}%</span>}
                        </p>
                      </div>
                      {/* Precio */}
                      <p className="text-sm font-bold text-origen-bosque flex-shrink-0 tabular-nums">{item.totalPrice.toFixed(2)}€</p>
                    </div>
                  ))}
                </div>

                {/* Resumen de precios */}
                <div className="px-5 py-4 bg-origen-crema/30 border-t border-border-subtle space-y-1.5">
                  <div className="flex justify-between text-xs text-text-subtle">
                    <span>Subtotal</span>
                    <span className="font-medium text-origen-bosque">{order.subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-subtle">
                    <span>Gastos de envío</span>
                    <span className="font-medium text-origen-bosque">{order.shipping.cost.toFixed(2)}€</span>
                  </div>
                  {order.tax && (
                    <div className="flex justify-between text-xs text-text-subtle">
                      <span>IVA</span>
                      <span className="font-medium text-origen-bosque">{order.tax.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border-subtle">
                    <span className="text-origen-bosque">Total</span>
                    <span className="text-origen-bosque tabular-nums">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </motion.div>

              {/* ── Historial del pedido ── (acordeón) */}
              <SectionAccordion title="Historial del pedido" icon={Clock} index={2}>
                <div>
                  {order.timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-3">
                      {/* Dot + connector */}
                      <div className="relative flex flex-col items-center flex-shrink-0">
                        <div className={cn(
                          'w-3 h-3 rounded-full mt-0.5 flex-shrink-0',
                          index === 0
                            ? 'bg-origen-bosque ring-4 ring-origen-bosque/15'
                            : 'bg-origen-pradera/40',
                        )} />
                        {index < order.timeline.length - 1 && (
                          <div className="w-0.5 h-8 bg-border-subtle mt-1" />
                        )}
                      </div>
                      {/* Contenido */}
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-medium text-origen-bosque leading-tight">{event.description}</p>
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
                  ))}
                </div>
              </SectionAccordion>

            </div>
          </div>
        </motion.div>

        {/* ── ActionBar móvil ── */}
        {nextAction && (
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
                disabled: updating,                variant: 'ghost' as const,                className: 'text-feedback-danger',
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
              <div className={cn('rounded-2xl p-4 flex items-center gap-3 border', status.heroBg, status.heroBorder)}>
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
                <span className="font-semibold text-origen-bosque">{order.orderNumber}</span>?{' '}
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
                className="w-full text-feedback-danger hover:bg-red-50"
              >
                Sí, cancelar pedido
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    </MobilePullRefresh>
  );
}

