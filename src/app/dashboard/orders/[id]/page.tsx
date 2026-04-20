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
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Phone, Mail, ExternalLink, Info } from 'lucide-react';

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

// Hooks y API
import { fetchOrderById, updateOrderStatus } from '@/lib/api/orders';
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
    color: 'text-amber-700',
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

// ============================================================================
// SUB-COMPONENTE: TARJETA DE ESTADO (desktop sidebar)
// ============================================================================

function OrderStatusCard({
  order,
  onUpdateStatus,
  isUpdating,
  onCancelRequest,
}: {
  order: Order;
  onUpdateStatus: (status: Order['status']) => Promise<void>;
  isUpdating: boolean;
  onCancelRequest: () => void;
}) {
  const status     = statusConfig[order.status];
  const isTerminal = ['delivered', 'cancelled', 'refunded'].includes(order.status);
  const canCancel  = ['pending', 'processing', 'shipped'].includes(order.status);

  const next: { label: string; next: Order['status']; icon: React.ElementType } | null =
    order.status === 'pending'    ? { label: 'Marcar como procesando', next: 'processing', icon: Package     } :
    order.status === 'processing' ? { label: 'Marcar como enviado',    next: 'shipped',    icon: Truck       } :
    order.status === 'shipped'    ? { label: 'Marcar como entregado',  next: 'delivered',  icon: CheckCircle } :
    null;

  return (
    <div className="rounded-[28px] border border-border-subtle bg-surface overflow-hidden">
      {/* Band de color semántico */}
      <div className={cn('px-5 py-3 flex items-center justify-between', status.bandBg)}>
        <div className="flex items-center gap-2">
          <status.icon className={cn('w-4 h-4', status.color)} />
          <span className={cn('text-sm font-semibold', status.color)}>{status.label}</span>
        </div>
        <span className="text-xs text-text-subtle tabular-nums">
          {format(order.createdAt, 'dd MMM yyyy', { locale: es })}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* Total */}
        <div className="flex items-end justify-between pt-0.5">
          <span className="text-xs text-text-subtle">Total del pedido</span>
          <span className={cn('text-2xl font-extrabold tabular-nums leading-none', status.color)}>
            {order.total.toFixed(2)}€
          </span>
        </div>

        {/* Pago inline */}
        <div className="flex items-center justify-between py-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-text-subtle shrink-0" />
            <span className="text-xs text-text-subtle capitalize">{order.payment.method}</span>
          </div>
          <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
            {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        </div>

        {/* Acciones disponibles */}
        {!isTerminal && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <SectionLabel>Actualizar estado</SectionLabel>
            {next && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<next.icon className="w-4 h-4" />}
                onClick={() => onUpdateStatus(next.next)}
                loading={isUpdating}
                loadingText="Actualizando..."
                className="w-full justify-start"
              >
                {next.label}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<XCircle className="w-4 h-4 text-feedback-danger" />}
                onClick={onCancelRequest}
                disabled={isUpdating}
                className="w-full justify-start text-feedback-danger hover:bg-red-50"
              >
                Cancelar pedido
              </Button>
            )}
          </div>
        )}

        {isTerminal && (
          <p className="text-[11px] text-text-subtle border-t border-border-subtle pt-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0" />
            {order.status === 'delivered' ? 'Pedido completado correctamente.' :
             order.status === 'cancelled' ? 'Este pedido fue cancelado.' :
             'Este pedido fue reembolsado.'}
          </p>
        )}
      </div>
    </div>
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
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={cn(
            'container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pb-10',
            nextAction ? 'pb-[calc(152px+env(safe-area-inset-bottom))]' : 'pb-6'
          )}
        >
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">

            {/* ══ SIDEBAR ══ En móvil aparece primero */}
            <div className="lg:col-span-5 lg:order-2 flex flex-col gap-4 mb-4 lg:mb-0">

              {/* ── Hero card de estado (móvil prominente) ── */}

              {/* Mobile hero — borde y fondo de color semántico */}
              <motion.div
                custom={0}
                variants={cardVariants}
                className={cn(
                  'lg:hidden rounded-[28px] border overflow-hidden',
                  status.heroBg, status.heroBorder,
                )}
              >
                <div className="px-5 py-5">
                  {/* Estado + fecha */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <status.icon className={cn('w-5 h-5', status.color)} />
                      <span className={cn('text-base font-bold', status.color)}>{status.label}</span>
                    </div>
                    <span className="text-xs text-text-subtle">
                      {format(order.createdAt, 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  {/* Número de pedido */}
                  <p className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-0.5">Pedido</p>
                  <p className="text-xl font-bold text-origen-bosque">{order.orderNumber}</p>
                  {/* Total destacado */}
                  <div className="mt-3 pt-3 border-t border-border-subtle flex items-end justify-between">
                    <span className="text-xs text-text-subtle">Total</span>
                    <span className={cn('text-3xl font-extrabold tabular-nums leading-none', status.color)}>
                      {order.total.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Desktop status card */}
              <motion.div custom={0} variants={cardVariants} className="hidden lg:block">
                <OrderStatusCard
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={updating}
                  onCancelRequest={() => setShowCancelSheet(true)}
                />
              </motion.div>

              {/* ── Cliente ── */}
              <motion.div custom={1} variants={cardVariants} className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5">
                <SectionLabel>Cliente</SectionLabel>
                {/* Avatar de iniciales */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-origen-pastel flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-origen-bosque">
                      {order.customerName.split(' ').map(n => n[0]).slice(0, 2).join('')}
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
              </motion.div>

              {/* ── Pago ── */}
              <motion.div custom={2} variants={cardVariants} className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5">
                <SectionLabel>Pago</SectionLabel>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-origen-pradera" />
                    <span className="text-sm capitalize">{order.payment.method}</span>
                  </div>
                  <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
                    {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
                {order.payment.paidAt && (
                  <p className="text-xs text-text-subtle mt-2">
                    {format(order.payment.paidAt, 'dd MMM yyyy', { locale: es })}
                  </p>
                )}
              </motion.div>

              {/* ── Envío ── */}
              <motion.div custom={3} variants={cardVariants} className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5">
                <SectionLabel>Dirección de envío</SectionLabel>
                <div className="flex items-start gap-2">
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
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-xs text-text-subtle mb-1">
                      Nº seguimiento: <span className="font-mono text-origen-bosque">{order.shipping.trackingNumber}</span>
                    </p>
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
              </motion.div>
            </div>

            {/* ══ CONTENIDO PRINCIPAL ══ En móvil aparece segundo */}
            <div className="lg:col-span-7 lg:order-1 flex flex-col gap-4">

              {/* ── Productos ── */}
              <motion.div custom={1} variants={cardVariants} className="rounded-[28px] border border-border-subtle bg-surface overflow-hidden">
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
                          {item.discount && <span className="text-green-600 ml-1.5">−{item.discount}%</span>}
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

              {/* ── Línea de tiempo — siempre visible en móvil ── */}
              <motion.div custom={2} variants={cardVariants} className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-origen-pradera" />
                  <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider">Historial del pedido</p>
                </div>

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
              </motion.div>

            </div>
          </div>
        </motion.div>

        {/* ── ActionBar móvil ── */}
        {nextAction && (
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
              className: 'text-feedback-danger',
            }] : []}
          />
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

