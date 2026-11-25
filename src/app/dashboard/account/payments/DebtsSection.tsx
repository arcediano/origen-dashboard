'use client';

/**
 * @component DebtsSection
 * @description Deudas y contracargos del productor con el pedido que los origina. Solo se muestra si
 * hay alguna. Deja claro que un contracargo perdido NO se descuenta automáticamente: Origen se pondrá
 * en contacto para acordar cómo regularizarlo.
 */

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, Badge, Card, CardContent, CardHeader, CardIconHeader, type BadgeProps } from '@arcediano/ux-library';
import { fetchSellerDebts, type SellerDebtEntry, type SellerDebtStatus } from '@/lib/api/orders';

const euros = (n: number) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const day = (iso: string) => {
  try {
    return format(new Date(iso), 'd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
};

const KIND_LABEL: Record<SellerDebtEntry['kind'], string> = {
  CHARGEBACK_LOST: 'Contracargo perdido',
  REVERSAL_FAILED: 'Reembolso sin saldo en tu cuenta',
  MANUAL: 'Deuda anterior',
};

const STATUS_META: Record<SellerDebtStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING_REVIEW: { label: 'Lo gestionaremos contigo', variant: 'warning' },
  OPEN: { label: 'Se descuenta de tus próximos cobros', variant: 'danger' },
  SETTLED: { label: 'Saldada', variant: 'success' },
  WAIVED: { label: 'Condonada', variant: 'neutral' },
};

export function DebtsSection() {
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

  if (!entries || entries.length === 0) return null;
  const hasPending = entries.some((e) => e.status === 'PENDING_REVIEW');
  const hasOpen = entries.some((e) => e.status === 'OPEN');

  return (
    <Card data-testid="debts-section">
      <CardHeader>
        <CardIconHeader
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Deudas y contracargos"
          description="Importes pendientes con Origen y el pedido del que vienen."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPending && (
          <Alert variant="warning">
            <AlertDescription>
              Cuando el banco del comprador gana un contracargo, el dinero se devuelve al comprador. Si ese pedido ya
              te lo habíamos pagado, el importe queda pendiente de regularizar. <strong>No se te descuenta nada
              automáticamente</strong>: nos pondremos en contacto contigo para acordar cómo resolverlo.
            </AlertDescription>
          </Alert>
        )}
        {hasOpen && (
          <Alert variant="info">
            <AlertDescription>
              Las deudas confirmadas se descuentan de tus próximos cobros hasta quedar saldadas; no se te hace ningún
              cargo en el banco.
            </AlertDescription>
          </Alert>
        )}
        <ul className="divide-y divide-border-subtle">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 py-3" data-testid="seller-debt">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-origen-bosque">
                  {KIND_LABEL[e.kind]}
                  {e.orderNumber ? ` · Pedido ${e.orderNumber}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">Registrada el {day(e.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-origen-bosque">
                  {euros(e.status === 'SETTLED' || e.status === 'WAIVED' ? e.amount : e.remaining)}
                </p>
                <Badge variant={STATUS_META[e.status].variant}>{STATUS_META[e.status].label}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
