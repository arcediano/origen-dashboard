'use client';

/**
 * @component DebtAlert
 * @description Aviso de saldo negativo de la página de Cobros. Explica de dónde viene cada deuda confirmada (qué la
 * originó, de qué pedido y, si es una disputa, que se resolvió a favor del comprador) y cómo se cobra: se
 * descuenta de los próximos pagos del productor —de cualquier pedido, no necesariamente del que la originó— hasta
 * quedar a cero, sin cargo en el banco. Si no hay desglose (deuda anterior al libro), mantiene el aviso genérico.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { fetchSellerDebts, type SellerDebtEntry } from '@/lib/api/orders';

const euros = (n: number) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Qué la originó, con el pedido. */
export function debtCause(e: Pick<SellerDebtEntry, 'kind' | 'orderNumber'>): string {
  const order = e.orderNumber ? `del pedido ${e.orderNumber}` : 'de un pedido';
  switch (e.kind) {
    case 'STRIPE_FEE':
      return `La tasa de Stripe de una disputa ${order}: se resolvió a favor del comprador por un fallo en el procesamiento del pedido y el equipo de Origen decidió que esa tasa corre a tu cargo.`;
    case 'REVERSAL_FAILED':
      return `Una devolución ${order} que no se pudo compensar en el saldo de tu cuenta de Stripe.`;
    case 'CHARGEBACK_LOST':
      return `Un contracargo perdido ${order}: el banco del comprador le devolvió el dinero.`;
    default:
      return 'Una deuda anterior con Origen.';
  }
}

export function DebtAlert({ debtAmountCents }: { debtAmountCents: number }) {
  const [entries, setEntries] = useState<SellerDebtEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSellerDebts().then((r) => {
      if (!cancelled && !r.error) setEntries(r.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = (entries ?? []).filter((e) => e.status === 'OPEN' && e.remaining > 0);

  return (
    <Alert variant="error" className="mb-4 sm:mb-6" data-testid="debt-alert">
      <AlertDescription>
        <p>
          Tienes un saldo negativo de <strong>{euros(debtAmountCents / 100)}</strong> pendiente con Origen.
        </p>
        {open.length > 0 && (
          <ul className="mt-2 space-y-2" data-testid="debt-alert-items">
            {open.map((e) => (
              <li key={e.id} className="rounded-lg bg-white/60 px-3 py-2 text-sm">
                <p>
                  <strong>{euros(e.remaining)}</strong> · {debtCause(e)}
                </p>
                {e.orderId && e.orderNumber && (
                  <p className="mt-1">
                    <Link href={`/dashboard/orders/${e.orderId}`} className="font-semibold underline">
                      Ver el pedido {e.orderNumber} y su disputa
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm">
          <strong>Cómo se cobra:</strong> se descuenta automáticamente de tus próximas transferencias —de cualquier
          pedido, no solo del que la originó— hasta quedar a cero. No se te hace ningún cargo en el banco y no tienes
          que hacer nada.
        </p>
      </AlertDescription>
    </Alert>
  );
}
