/**
 * @page OrderDetailPage
 * @description Página de detalle de pedido
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Phone, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/atoms/button';
import { Badge } from '@/components/ui/atoms/badge';
import { PageLoader } from '@/components/shared';
import { PageError } from '@/components/shared';
import { PageHeader } from '@/app/dashboard/components/PageHeader';

// Hooks y API
import { fetchOrderById, updateOrderStatus } from '@/lib/api/orders';
import type { Order } from '@/types/order';

const statusConfig: Record<Order['status'], { 
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'leaf'; 
  label: string; 
  icon: React.ElementType; 
  color: string 
}> = {
  pending: { 
    variant: 'warning',     // Ámbar
    label: 'Pendiente', 
    icon: Clock, 
    color: 'text-amber-600' 
  },
  processing: { 
    variant: 'info',        // Azul
    label: 'Procesando', 
    icon: Package, 
    color: 'text-blue-600' 
  },
  shipped: { 
    variant: 'info',        // También info (o podríamos crear una variante 'purple' si fuera necesario)
    label: 'Enviado', 
    icon: Truck, 
    color: 'text-purple-600' 
  },
  delivered: { 
    variant: 'success',     // Verde
    label: 'Entregado', 
    icon: CheckCircle, 
    color: 'text-green-600' 
  },
  cancelled: { 
    variant: 'danger',      // Rojo
    label: 'Cancelado', 
    icon: XCircle, 
    color: 'text-red-600' 
  },
  refunded: { 
    variant: 'danger',      // Rojo
    label: 'Reembolsado', 
    icon: XCircle, 
    color: 'text-red-600' 
  }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

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

  const status = statusConfig[order.status];
  const canUpdate = !['delivered', 'cancelled', 'refunded'].includes(order.status);

  // Acción principal según estado
  const nextAction: { label: string; next: Order['status'] } | null =
    order.status === 'pending'    ? { label: 'Marcar como procesando', next: 'processing' } :
    order.status === 'processing' ? { label: 'Marcar como enviado',     next: 'shipped'    } :
    order.status === 'shipped'    ? { label: 'Marcar como entregado',   next: 'delivered'  } :
    null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-4 lg:pb-8"
      >
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

        {/* Contenido */}
        <div className="px-4 sm:px-6 lg:px-8 mt-2 lg:mt-6">
          <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8">

            {/* ══ BLOQUE DERECHO ══ En móvil aparece primero (order-first) */}
            <div className="lg:col-span-1 lg:order-2 flex flex-col gap-4 mb-4 lg:mb-0">

              {/* ── Estado + acción (móvil: hero card prominente) ── */}
              <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                {/* Banda de color por estado */}
                <div className={cn(
                  'px-4 py-3 flex items-center justify-between',
                  order.status === 'delivered' && 'bg-green-50',
                  order.status === 'shipped'   && 'bg-purple-50',
                  order.status === 'processing'&& 'bg-blue-50',
                  order.status === 'pending'   && 'bg-amber-50',
                  ['cancelled','refunded'].includes(order.status) && 'bg-red-50',
                )}>
                  <div className="flex items-center gap-2">
                    <status.icon className={cn('w-4 h-4', status.color)} />
                    <span className={cn('text-sm font-semibold', status.color)}>{status.label}</span>
                  </div>
                  <Badge variant={status.variant} size="xs">{status.label}</Badge>
                </div>

                {/* Acción inline — visible solo si hay siguiente estado */}
                {canUpdate && nextAction && (
                  <div className="px-4 py-3 border-t border-border-subtle lg:hidden">
                    <p className="text-xs text-text-subtle mb-2">Acción rápida</p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleUpdateStatus(nextAction.next)}
                      disabled={updating}
                    >
                      {updating ? 'Actualizando...' : nextAction.label}
                    </Button>
                  </div>
                )}

                {/* Acción en desktop */}
                {canUpdate && nextAction && (
                  <div className="hidden lg:block px-4 py-3 border-t border-border-subtle">
                    <p className="text-xs text-text-subtle mb-2">Actualizar estado</p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleUpdateStatus(nextAction.next)}
                      disabled={updating}
                    >
                      {updating ? 'Actualizando...' : nextAction.label}
                    </Button>
                  </div>
                )}
              </div>

              {/* ── Cliente, Pago y Envío: lista compacta ── */}
              <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden divide-y divide-border-subtle">

                {/* Cliente */}
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-2">Cliente</p>
                  <p className="text-sm font-semibold text-origen-bosque">{order.customerName}</p>
                  <div className="mt-1.5 space-y-1">
                    <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-1.5 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {order.customerEmail}
                    </a>
                    {order.customerPhone && (
                      <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 text-xs text-text-subtle hover:text-origen-pradera transition-colors">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {order.customerPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Pago */}
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-2">Pago</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-text-subtle" />
                      <span className="text-sm capitalize">{order.payment.method}</span>
                    </div>
                    <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
                      {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </div>
                  {order.payment.paidAt && (
                    <p className="text-xs text-text-subtle mt-1">
                      {format(order.payment.paidAt, 'dd MMM yyyy', { locale: es })}
                    </p>
                  )}
                </div>

                {/* Envío */}
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-2">Envío</p>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-subtle mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">{order.shipping.address.fullName}</p>
                      <p className="text-xs text-text-subtle">{order.shipping.address.addressLine1}</p>
                      {order.shipping.address.addressLine2 && (
                        <p className="text-xs text-text-subtle">{order.shipping.address.addressLine2}</p>
                      )}
                      <p className="text-xs text-text-subtle">
                        {order.shipping.address.city}, {order.shipping.address.postalCode}
                      </p>
                    </div>
                  </div>
                  {order.shipping.trackingNumber && (
                    <div className="mt-2 pt-2 border-t border-border-subtle">
                      <p className="text-xs text-text-subtle">Nº seguimiento: <span className="font-mono text-origen-bosque">{order.shipping.trackingNumber}</span></p>
                      {order.shipping.trackingUrl && (
                        <a
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-origen-pradera hover:underline mt-1"
                        >
                          Ver seguimiento <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ══ BLOQUE IZQUIERDO ══ En móvil aparece segundo */}
            <div className="lg:col-span-2 lg:order-1 flex flex-col gap-4">

              {/* ── Productos ── */}
              <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                  <Package className="w-4 h-4 text-origen-pradera" />
                  <span className="text-sm font-semibold text-origen-bosque">Productos</span>
                  <span className="ml-auto text-xs text-text-subtle">{order.items.length} artículo{order.items.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-border-subtle">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Imagen */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-origen-crema/60 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-text-disabled" />
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
                      <p className="text-sm font-bold text-origen-pradera flex-shrink-0">{item.totalPrice.toFixed(2)}€</p>
                    </div>
                  ))}
                </div>

                {/* Resumen de precios */}
                <div className="px-4 py-3 bg-origen-crema/30 border-t border-border-subtle space-y-1.5">
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
                    <span className="text-origen-pradera">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* ── Línea de tiempo (colapsable en móvil) ── */}
              <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                <button
                  onClick={() => setTimelineOpen(v => !v)}
                  className="w-full flex items-center gap-2 px-4 py-3 border-b border-border-subtle lg:cursor-default"
                >
                  <Clock className="w-4 h-4 text-origen-pradera" />
                  <span className="text-sm font-semibold text-origen-bosque flex-1 text-left">Línea de tiempo</span>
                  <span className="lg:hidden">
                    {timelineOpen
                      ? <ChevronUp className="w-4 h-4 text-text-subtle" />
                      : <ChevronDown className="w-4 h-4 text-text-subtle" />
                    }
                  </span>
                </button>

                <div className={cn(
                  'lg:block',
                  timelineOpen ? 'block' : 'hidden',
                )}>
                  <div className="px-4 py-3 space-y-0">
                    {order.timeline.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
                            index === 0 ? 'bg-origen-pradera' : 'bg-border'
                          )} />
                          {index < order.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-border mt-0.5" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm font-medium text-origen-bosque leading-tight">{event.description}</p>
                          <p className="text-xs text-text-subtle mt-0.5">
                            {format(event.createdAt, 'dd MMM yyyy · HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Sticky CTA móvil — solo si hay acción disponible ── */}
      {canUpdate && nextAction && (
        <div className="lg:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 right-4 z-30">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleUpdateStatus(nextAction.next)}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold bg-origen-bosque text-white shadow-lg active:bg-origen-pino disabled:opacity-60 transition-colors"
          >
            <Truck className="w-4 h-4" />
            {updating ? 'Actualizando...' : nextAction.label}
          </motion.button>
        </div>
      )}
    </>
  );
}