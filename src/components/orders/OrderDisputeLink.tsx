/**
 * @file OrderDisputeLink.tsx
 * @description Aviso en el detalle de un pedido cuando tiene una disputa: estado y enlace a su detalle. La
 * conversación NO vive aquí, solo en el detalle de la disputa (`/dashboard/disputas?id=`). No se pinta si el
 * pedido no tiene disputa.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Scale } from 'lucide-react';
import { Badge } from '@arcediano/ux-library';
import { fetchDisputeForOrder, type Dispute } from '@/lib/api/disputes';
import { DISPUTE_REASON_LABEL, DISPUTE_STATUS_LABEL, isDisputeClosed } from '@/lib/dispute-labels';

export function OrderDisputeLink({ orderId }: { orderId: string }) {
  const [dispute, setDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDisputeForOrder(orderId)
      .then((d) => {
        if (!cancelled && d) setDispute(d);
      })
      .catch(() => undefined); // sin disputa o sin acceso: no se muestra
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!dispute) return null;
  const closed = isDisputeClosed(dispute.status);
  const needsReply = dispute.status === 'AWAITING_PRODUCER';

  return (
    <Link
      href={`/dashboard/disputas?id=${encodeURIComponent(dispute.id)}`}
      data-testid="order-dispute-link"
      className="mb-4 flex items-center gap-3 rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm transition-colors hover:bg-origen-pastel/30 sm:p-5 lg:mb-6"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-origen-pastel">
        <Scale className="h-5 w-5 text-origen-hoja" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-origen-bosque">Este pedido tiene una disputa</span>
        <span className="block text-sm text-origen-pino">
          {DISPUTE_REASON_LABEL[dispute.reason] ?? 'Otro motivo'} · ver detalle y conversación
        </span>
        <Badge variant={closed ? 'success' : needsReply ? 'warning' : 'info'} size="sm" className="mt-2">
          {DISPUTE_STATUS_LABEL[dispute.status] ?? 'En curso'}
        </Badge>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-origen-pino" aria-hidden />
    </Link>
  );
}
