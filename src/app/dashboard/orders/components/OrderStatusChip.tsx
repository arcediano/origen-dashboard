/**
 * @component OrderStatusChip
 * @description Badge de estado de pedido con tokens Origen v3.0.
 *              Reutilizable en OrderCard y en la tabla desktop.
 */

'use client';

import React from 'react';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/order';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; chip: string }
> = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  processing: {
    label: 'Procesando',
    icon: Package,
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  shipped: {
    label: 'Enviado',
    icon: Truck,
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  delivered: {
    label: 'Entregado',
    icon: CheckCircle2,
    chip: 'bg-origen-pastel text-origen-bosque border-origen-pradera/30',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    chip: 'bg-feedback-danger-subtle text-red-700 border-red-200',
  },
  refunded: {
    label: 'Reembolsado',
    icon: RefreshCw,
    chip: 'bg-surface text-text-subtle border-border-subtle',
  },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export interface OrderStatusChipProps {
  status:    OrderStatus;
  size?:     'sm' | 'md';
  className?: string;
}

export function OrderStatusChip({
  status,
  size = 'sm',
  className,
}: OrderStatusChipProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        cfg.chip,
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {cfg.label}
    </span>
  );
}
