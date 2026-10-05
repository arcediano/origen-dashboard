'use client';

/**
 * @component AiCreditPurchasesSection
 * @description Compras de créditos del asistente de IA del productor, registradas
 * en Facturación. De momento no generan factura: se emitirá cuando Origen tenga
 * registrados sus datos de facturación reales. No se muestra nada si no hay compras.
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@arcediano/ux-library';
import { listAiCreditPurchases, type AiCreditPurchaseItem } from '@/lib/api/ai-assist';

const formatAmount = (cents: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return iso;
  }
};

export function AiCreditPurchasesSection() {
  const [purchases, setPurchases] = useState<AiCreditPurchaseItem[]>([]);

  useEffect(() => {
    let mounted = true;
    listAiCreditPurchases()
      .then((items) => {
        if (mounted) setPurchases(items);
      })
      // Sección complementaria: un fallo puntual no debe romper la página de facturación.
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  if (purchases.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="ai-credit-purchases-title" data-testid="ai-credit-purchases">
      <div>
        <h2 id="ai-credit-purchases-title" className="text-base font-bold text-origen-bosque">
          Compras de créditos del asistente de IA
        </h2>
        <p className="text-xs text-text-subtle">
          Pagos con tarjeta para crear productos con el asistente. La factura de estas compras se emitirá próximamente.
        </p>
      </div>
      <div className="space-y-3">
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="rounded-xl sm:rounded-2xl border border-border bg-surface-alt shadow-origen px-4 py-4 flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-origen-pastel flex items-center justify-center shrink-0 shadow-subtle">
              <Sparkles className="w-5 h-5 text-origen-pino" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-origen-bosque truncate">
                {purchase.credits} {purchase.credits === 1 ? 'crédito' : 'créditos'}
              </p>
              <p className="text-[11px] text-text-disabled mt-1">{formatDate(purchase.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-base font-bold text-origen-bosque tabular-nums">
                {formatAmount(purchase.amountCents, purchase.currency)}
              </span>
              <Badge variant="success" size="xs">Pagado</Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
