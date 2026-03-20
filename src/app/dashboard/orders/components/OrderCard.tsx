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
  ChevronRight,
  CreditCard,
  Banknote,
  Eye,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order, PaymentStatus } from '@/types/order';
import { OrderStatusChip } from './OrderStatusChip';
import { SwipeableRow } from '@/components/shared/mobile';

// ─── PAYMENT BADGE ────────────────────────────────────────────────────────────

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; cls: string }
> = {
  paid:     { label: 'Pagado',      cls: 'text-origen-bosque bg-origen-pastel'         },
  pending:  { label: 'Pdte. pago',  cls: 'text-origen-mandarina bg-origen-mandarina/10'},
  failed:   { label: 'Fallido',     cls: 'text-red-700 bg-red-50'                      },
  refunded: { label: 'Reembolsado', cls: 'text-text-subtle bg-surface'                 },
};

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_CONFIG[status] ?? PAYMENT_CONFIG.pending;
  const Icon = status === 'paid' ? CreditCard : Banknote;

  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium', cfg.cls)}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
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
      color:    'blue' as const,
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

        {/* Fila 3: items + fecha + pago */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[11px] text-text-subtle">
            {itemCount} {itemCount === 1 ? 'art.' : 'arts.'}
          </span>
          <span className="text-border-subtle">·</span>
          <span className="text-[11px] text-text-subtle">{shortDate}</span>
          <span className="text-border-subtle">·</span>
          <PaymentBadge status={order.payment.status} />
        </div>
      </div>

      {/* Importe (prominente) + chevron */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-base font-bold text-origen-bosque">
          {order.total.toFixed(2)} €
        </span>
        <ChevronRight className="w-4 h-4 text-text-subtle/40" aria-hidden />
      </div>
    </motion.button>
    </SwipeableRow>
  );
}
