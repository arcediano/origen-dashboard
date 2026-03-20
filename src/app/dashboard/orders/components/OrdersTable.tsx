/**
 * @component OrdersTable
 * @description Tabla de pedidos con ordenación y filas expandibles
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Table, type Column } from '@/components/ui/atoms/table';
import { Badge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { 
  Eye, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import type { Order } from '@/types/order';

interface OrdersTableProps {
  orders: Order[];
  onViewDetails?: (id: string) => void;
  onUpdateStatus?: (id: string, status: Order['status']) => void;
  className?: string;
  isLoading?: boolean;
}

const statusConfig: Record<Order['status'], { 
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'leaf'; 
  label: string; 
  icon: React.ElementType 
}> = {
  pending: { 
    variant: 'warning',  // Ámbar
    label: 'Pendiente', 
    icon: Clock 
  },
  processing: { 
    variant: 'info',     // Azul
    label: 'Procesando', 
    icon: Package 
  },
  shipped: { 
    variant: 'info',     // También info (o podríamos añadir 'purple' si fuera necesario)
    label: 'Enviado', 
    icon: Truck 
  },
  delivered: { 
    variant: 'success',  // Verde
    label: 'Entregado', 
    icon: CheckCircle 
  },
  cancelled: { 
    variant: 'danger',   // Rojo
    label: 'Cancelado', 
    icon: XCircle 
  },
  refunded: { 
    variant: 'danger',   // Rojo
    label: 'Reembolsado', 
    icon: XCircle 
  }
};

export function OrdersTable({
  orders,
  onViewDetails,
  onUpdateStatus,
  className,
  isLoading = false
}: OrdersTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const columns: Column<Order>[] = [
    {
      key: 'pedido',
      header: 'Pedido',
      accessor: (item) => (
        <div>
          <p className="text-sm font-medium text-origen-bosque">{item.orderNumber}</p>
          <p className="text-xs text-text-subtle">{format(item.createdAt, 'dd MMM yyyy', { locale: es })}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.orderNumber
    },
    {
      key: 'cliente',
      header: 'Cliente',
      accessor: (item) => (
        <div>
          <p className="text-sm font-medium text-origen-bosque">{item.customerName}</p>
          <p className="text-xs text-text-subtle">{item.customerEmail}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.customerName
    },
    {
      key: 'importe',
      header: 'Importe',
      accessor: (item) => (
        <div>
          <p className="text-sm font-bold text-origen-pradera">{item.total.toFixed(2)}€</p>
          <p className="text-xs text-text-subtle">{item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.total
    },
    {
      key: 'estado',
      header: 'Estado',
      accessor: (item) => {
        const config = statusConfig[item.status];
        return (
          <Badge variant={config.variant} icon={<config.icon className="w-3 h-3" />}>
            {config.label}
          </Badge>
        );
      },
      sortable: true,
      sortValue: (item) => item.status
    },
    {
      key: 'pago',
      header: 'Pago',
      accessor: (item) => {
        const statusColor = item.payment.status === 'paid' ? 'success' : 'warning';
        return (
          <Badge variant={statusColor} size="sm">
            {item.payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        );
      }
    },
    {
      key: 'acciones',
      header: '',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(item.id);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  const expandableDetails = (order: Order) => (
    <div className="space-y-4 p-2">
      {/* Línea de tiempo */}
      <div>
        <h4 className="text-sm font-medium text-origen-bosque mb-3">Línea de tiempo</h4>
        <div className="space-y-2">
          {order.timeline.map((event, index) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="relative">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5',
                  index === 0 ? 'bg-origen-pradera' : 'bg-border'
                )} />
                {index < order.timeline.length - 1 && (
                  <div className="absolute top-3 left-1 w-0.5 h-8 bg-border -translate-x-[3px]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-origen-bosque">{event.description}</p>
                <p className="text-xs text-text-subtle">
                  {format(event.createdAt, 'dd MMM yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div>
        <h4 className="text-sm font-medium text-origen-bosque mb-3">Productos</h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-origen-crema/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center">
                  <Package className="w-5 h-5 text-text-subtle" />
                </div>
                <div>
                  <p className="text-sm font-medium text-origen-bosque">{item.productName}</p>
                  <p className="text-xs text-text-subtle">{item.quantity} x {item.unitPrice.toFixed(2)}€</p>
                </div>
              </div>
              <p className="text-sm font-bold text-origen-pradera">{item.totalPrice.toFixed(2)}€</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dirección de envío */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-origen-bosque mb-2">Dirección de envío</h4>
          <p className="text-xs text-text-subtle">{order.shipping.address.fullName}</p>
          <p className="text-xs text-text-subtle">{order.shipping.address.addressLine1}</p>
          {order.shipping.address.addressLine2 && (
            <p className="text-xs text-text-subtle">{order.shipping.address.addressLine2}</p>
          )}
          <p className="text-xs text-text-subtle">
            {order.shipping.address.city}, {order.shipping.address.postalCode}
          </p>
          <p className="text-xs text-text-subtle">{order.shipping.address.country}</p>
          {order.shipping.address.phone && (
            <p className="text-xs text-text-subtle mt-1">Tel: {order.shipping.address.phone}</p>
          )}
        </div>

        {/* Seguimiento */}
        {order.shipping.trackingNumber && (
          <div>
            <h4 className="text-sm font-medium text-origen-bosque mb-2">Seguimiento</h4>
            <p className="text-xs text-text-subtle">Método: {order.shipping.method}</p>
            <p className="text-xs text-text-subtle">Transportista: {order.shipping.carrier}</p>
            <p className="text-xs text-text-subtle">Nº seguimiento: {order.shipping.trackingNumber}</p>
            {order.shipping.trackingUrl && (
              <a 
                href={order.shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-origen-pradera hover:underline inline-flex items-center gap-1 mt-1"
              >
                Ver seguimiento
                <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Resumen de pago */}
      <div className="mt-4 p-3 bg-origen-crema/30 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-text-subtle">Subtotal</span>
          <span className="font-medium">{order.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-text-subtle">Gastos de envío</span>
          <span className="font-medium">{order.shipping.cost.toFixed(2)}€</span>
        </div>
        {order.tax && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-subtle">IVA</span>
            <span className="font-medium">{order.tax.toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border">
          <span className="text-origen-bosque">Total</span>
          <span className="text-origen-pradera">{order.total.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );

  return (
    <Table
      data={orders}
      columns={columns}
      keyExtractor={(item) => item.id}
      sortable
      initialSortColumn="pedido"
      initialSortDirection="desc"
      loading={isLoading}
      expandable={{
        renderExpand: expandableDetails
      }}
      onRowClick={(item) => onViewDetails?.(item.id)}
      rowClassName="cursor-pointer hover:bg-origen-crema/30 transition-colors"
      className={className}
      emptyMessage="No hay pedidos para mostrar"
    />
  );
}