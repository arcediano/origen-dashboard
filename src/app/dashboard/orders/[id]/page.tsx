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
import { ShoppingBag, ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-white to-origen-crema"
    >
      {/* Elementos decorativos */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Cabecera */}
      <PageHeader
        title={`Pedido ${order.orderNumber}`}
        description={`${format(order.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
        badgeIcon={ShoppingBag}
        badgeText={status.label}
        tooltip="Detalle del pedido"
        tooltipDetailed="Información completa del pedido, productos y seguimiento."
        showBackButton
        onBack={() => router.back()}
      />

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Productos */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-origen-pradera" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-origen-bosque">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} x {item.unitPrice.toFixed(2)}€
                            {item.discount && <span className="text-green-600 ml-2">-{item.discount}%</span>}
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-bold text-origen-pradera">{item.totalPrice.toFixed(2)}€</p>
                    </div>
                  ))}
                </div>

                {/* Resumen de precios */}
                <div className="mt-4 p-4 bg-origen-crema/30 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{order.subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Gastos de envío</span>
                    <span className="font-medium">{order.shipping.cost.toFixed(2)}€</span>
                  </div>
                  {order.tax && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">IVA</span>
                      <span className="font-medium">{order.tax.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 mt-2 border-t border-gray-200">
                    <span className="text-origen-bosque">Total</span>
                    <span className="text-origen-pradera">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Línea de tiempo */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-origen-pradera" />
                  Línea de tiempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="relative">
                        <div className={cn(
                          'w-2.5 h-2.5 rounded-full mt-1.5',
                          index === 0 ? 'bg-origen-pradera' : 'bg-gray-300'
                        )} />
                        {index < order.timeline.length - 1 && (
                          <div className="absolute top-4 left-1 w-0.5 h-10 bg-gray-200 -translate-x-[3px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium text-origen-bosque">{event.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(event.createdAt, 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha (1/3) */}
          <div className="space-y-6">
            
            {/* Información del cliente */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-origen-pradera" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-origen-bosque">{order.customerName}</p>
                <p className="text-xs text-gray-600 mt-1">{order.customerEmail}</p>
                {order.customerPhone && (
                  <p className="text-xs text-gray-600 mt-1">Tel: {order.customerPhone}</p>
                )}
              </CardContent>
            </Card>

            {/* Estado del pedido */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <status.icon className={cn('w-4 h-4', status.color)} />
                  Estado actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant={status.variant} size="lg" icon={<status.icon className="w-3.5 h-3.5" />}>
                    {status.label}
                  </Badge>
                </div>

                {/* Acciones para cambiar estado (solo si no está entregado/cancelado) */}
                {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Actualizar estado:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('processing')} disabled={updating}>
                          Marcar como procesando
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('shipped')} disabled={updating}>
                          Marcar como enviado
                        </Button>
                      )}
                      {order.status === 'shipped' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('delivered')} disabled={updating}>
                          Marcar como entregado
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información de pago */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-origen-pradera" />
                  Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Método</span>
                    <span className="text-xs font-medium capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Estado</span>
                    <Badge variant={order.payment.status === 'paid' ? 'success' : 'warning'} size="xs">
                      {order.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </div>
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Fecha de pago</span>
                      <span className="text-xs">
                        {format(order.payment.paidAt, 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de envío */}
            <Card variant="elevated">
              <CardHeader spacing="sm">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-origen-pradera" />
                  Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Método</p>
                    <p className="text-sm font-medium">{order.shipping.method}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="text-xs">{order.shipping.address.fullName}</p>
                    <p className="text-xs">{order.shipping.address.addressLine1}</p>
                    {order.shipping.address.addressLine2 && (
                      <p className="text-xs">{order.shipping.address.addressLine2}</p>
                    )}
                    <p className="text-xs">
                      {order.shipping.address.city}, {order.shipping.address.postalCode}
                    </p>
                    <p className="text-xs">{order.shipping.address.country}</p>
                  </div>

                  {order.shipping.trackingNumber && (
                    <div>
                      <p className="text-xs text-gray-500">Seguimiento</p>
                      <p className="text-xs">{order.shipping.trackingNumber}</p>
                      {order.shipping.trackingUrl && (
                        <a 
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-origen-pradera hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Ver seguimiento
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}