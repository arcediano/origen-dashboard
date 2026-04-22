/**
 * @component OrderCard
 * @description Tarjeta compacta de pedido para lista móvil (< lg).
 *              Layout: número + fecha arriba | estado chip top-right
 *                      cliente + items abajo | importe destacado bottom-right
 *
 * Tokens Origen v3.0. Animación whileTap spring.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  CreditCard,
  Banknote,
  Eye,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@arcediano/ux-library';
import type { Order, PaymentStatus } from '@/types/order';
import { OrderStatusChip } from './OrderStatusChip';
import { SwipeableRow } from '@/components/shared/mobile';

// ─── SKELETON ─────────────────────────────────────────────────────────────────

export function OrderCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-4 border-b border-border-subtle last:border-0 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel/60 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 bg-origen-pastel rounded-lg w-28" />
          <div className="h-4 bg-origen-pastel/60 rounded-full w-20" />
        </div>
        <div className="h-3.5 bg-origen-pastel rounded-lg w-2/5" />
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 bg-origen-pastel/60 rounded-lg w-10" />
          <div className="h-2.5 bg-origen-pastel/40 rounded-lg w-20" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="h-4 bg-origen-pastel rounded-lg w-16" />
        <div className="h-4 bg-origen-pastel/60 rounded-full w-14" />
      </div>
    </div>
  );
}

// ─── PAYMENT BADGE ────────────────────────────────────────────────────────────

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ElementType }> = {
  paid:     { label: 'Pagado',      variant: 'success', icon: CreditCard },
  pending:  { label: 'Pdte. pago',  variant: 'warning', icon: Banknote   },
  failed:   { label: 'Fallido',     variant: 'danger',  icon: Banknote   },
  refunded: { label: 'Reembolsado', variant: 'neutral', icon: Banknote   },
};

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_CONFIG[status] ?? PAYMENT_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} size="xs" icon={<Icon className="w-2.5 h-2.5" />}>
      {cfg.label}
    </Badge>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export interface OrderCardProps {
  order:          Order;
  onPress?:       (orderId: string) => void;
  onMarkShipped?: (orderId: string) => void;
  className?:     string;
}

/**
 * Tarjeta de pedido compacta para móvil.
 * Swipe izquierda → Ver detalle | Marcar enviado
 */
export function OrderCard({ order, onPress, onMarkShipped, className }: OrderCardProps) {
  const shortDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const canShip   = order.status === 'processing';

  const swipeActions = [
    {
      label:   'Ver',
      icon:    Eye,
      color:   'bosque' as const,
      onPress: () => onPress?.(order.id),
    },
    {
      label:    'Enviar',
      icon:     Truck,
      color:    'pino' as const,
      onPress:  () => onMarkShipped?.(order.id),
      disabled: !canShip || !onMarkShipped,
    },
  ];

  return (
    <SwipeableRow
      actions={swipeActions}
      className={cn('border-b border-border-subtle last:border-0', className)}
    >
      <motion.button
        whileTap={{ scale: 0.985, backgroundColor: 'hsl(var(--crema))' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => onPress?.(order.id)}
        className={cn(
          'w-full text-left flex items-center gap-3.5 px-4 py-4',
          'focus:outline-none active:bg-surface',
        )}
        aria-label={`Pedido ${order.orderNumber}`}
      >
      {/* Icono del pedido */}
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel flex items-center justify-center flex-shrink-0 shadow-subtle">
        <ShoppingBag className="w-5 h-5 text-origen-pino" />
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        {/* Fila 1: nº pedido + estado chip */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-bold text-origen-bosque truncate">
            {order.orderNumber}
          </span>
          <OrderStatusChip status={order.status} size="sm" />
        </div>

        {/* Fila 2: cliente (prominente) */}
        <p className="text-sm font-medium text-origen-bosque truncate">{order.customerName}</p>

        {/* Fila 3: items + fecha */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[11px] text-text-subtle">
            {itemCount} {itemCount === 1 ? 'art.' : 'arts.'}
          </span>
          <span className="text-border-subtle" aria-hidden>·</span>
          <span className="text-[11px] text-text-subtle">{shortDate}</span>
        </div>
      </div>

      {/* Importe + badge de pago */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-base font-bold text-origen-bosque tabular-nums">
          {order.total.toFixed(2)} €
        </span>
        <PaymentBadge status={order.payment.status} />
      </div>
    </motion.button>
    </SwipeableRow>
  );
}
