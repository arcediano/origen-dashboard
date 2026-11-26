'use client';

/**
 * Aviso al productor de la penalización por pedido pequeño. Todas las cifras
 * (comisión, importe mínimo y penalización) vienen de lo configurado en
 * origen-admin; si el admin desactiva la penalización, el aviso desaparece.
 */
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCommissionTerms, type CommissionTerms } from '@/lib/api/commission-terms';

const eur = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);
const pct = (rate: number) =>
  `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(rate * 100)} %`;

export function SmallBasketNoticeView({ terms, className }: { terms: CommissionTerms; className?: string }) {
  if (terms.smallBasketThreshold <= 0 || terms.smallBasketFee <= 0) return null;
  return (
    <div
      role="note"
      data-testid="small-basket-notice"
      className={cn(
        'flex items-start gap-2 rounded-xl border border-amber-200 bg-feedback-warning-subtle px-3 py-2.5 text-sm leading-relaxed text-feedback-warning-text',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        Los pedidos cuyos productos sumen menos de{' '}
        <span className="font-semibold">{eur(terms.smallBasketThreshold)}</span> tienen una penalización de{' '}
        <span className="font-semibold">{eur(terms.smallBasketFee)}</span> a tu cargo
        {terms.commissionRate != null && (
          <>
            , además de la comisión de Origen del <span className="font-semibold">{pct(terms.commissionRate)}</span>
          </>
        )}
        . Tu cliente no paga nada extra.
      </p>
    </div>
  );
}

export function SmallBasketNotice({ className }: { className?: string }) {
  const [terms, setTerms] = useState<CommissionTerms | null>(null);
  useEffect(() => {
    let alive = true;
    fetchCommissionTerms().then((t) => alive && setTerms(t)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return terms ? <SmallBasketNoticeView terms={terms} className={className} /> : null;
}
