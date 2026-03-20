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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order, PaymentStatus } from '@/types/order';
import { OrderStatusChip } from './OrderStatusChip';

// ─── PAYMENT BADGE ────────────────────────────────────────────────────────────

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; cls: string }
> = {
  paid:     { label: 'Pagado',      cls: 'text-origen-bosque bg-origen-pastel'    },
  pending:  { label: 'Pdte. pago',  cls: 'text-amber-700 bg-amber-50'            },
  failed:   { label: 'Fallido',     cls: 'text-red-700 bg-red-50'                },
  refunded: { label: 'Reembolsado', cls: 'text-gray-600 bg-gray-100'             },
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
  order:    Order;
  onPress?: (orderId: string) => void;
  className?: string;
}

/**
 * Tarjeta de pedido compacta para móvil.
 * El padre añade `block lg:hidden` o pasa className="block lg:hidden".
 */
export function OrderCard({ order, onPress, className }: OrderCardProps) {
  // Formatear fecha corta
  const shortDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => onPress?.(order.id)}
      className={cn(
        'w-full text-left flex items-center gap-3 px-4 py-3.5',
        'border-b border-border-subtle last:border-0',
        'focus:outline-none',
        className,
      )}
      aria-label={`Pedido ${order.orderNumber}`}
    >
      {/* Icono del pedido */}
      <div className="w-10 h-10 rounded-xl bg-origen-pastel flex items-center justify-center flex-shrink-0">
        <ShoppingBag className="w-5 h-5 text-origen-pino" />
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        {/* Fila 1: nº pedido + estado */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-origen-bosque truncate">
            {order.orderNumber}
          </span>
          <OrderStatusChip status={order.status} size="sm" />
        </div>

        {/* Fila 2: cliente */}
        <p className="text-xs text-text-subtle truncate">{order.customerName}</p>

        {/* Fila 3: items + fecha + pago */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-text-subtle">
            {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
          </span>
          <span className="text-text-disabled">·</span>
          <span className="text-[10px] text-text-subtle">{shortDate}</span>
          <span className="text-text-disabled">·</span>
          <PaymentBadge status={order.payment.status} />
        </div>
      </div>

      {/* Importe + chevron */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold text-origen-bosque">
          {order.total.toFixed(2)} €
        </span>
        <ChevronRight className="w-4 h-4 text-text-subtle" />
      </div>
    </motion.button>
  );
}
