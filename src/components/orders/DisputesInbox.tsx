/**
 * @file DisputesInbox.tsx
 * @description Bandeja "Disputas" del productor: lista de sus disputas y, al
 * elegir una, la conversación completa (la misma sección que ve en el detalle
 * del pedido, con respuesta). En escritorio lista y conversación van lado a
 * lado; en móvil se pasa de la lista a la conversación y se vuelve.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ChevronRight, Scale } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { fetchMyDisputes, type Dispute } from '@/lib/api/disputes';
import { DISPUTE_REASON_LABEL, DISPUTE_STATUS_LABEL, isDisputeClosed } from '@/lib/dispute-labels';
import { OrderDisputeSection } from './OrderDisputeSection';

export function DisputesInbox({ initialId }: { initialId?: string | null }) {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);

  useEffect(() => {
    fetchMyDisputes()
      .then((list) => setDisputes([...list].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-sm text-feedback-danger">No se pudieron cargar tus disputas. Inténtalo de nuevo.</p>;
  if (!disputes) return <p className="text-sm text-text-subtle">Cargando disputas…</p>;
  if (disputes.length === 0) {
    return (
      <Card>
        <EmptyState
          size="sm"
          icon={<Scale className="h-6 w-6" />}
          title="No tienes disputas"
          description="Cuando un comprador abra una disputa sobre uno de tus pedidos, aparecerá aquí con toda la conversación."
        />
      </Card>
    );
  }

  const selected = disputes.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <ul className={cn('space-y-2', selected && 'hidden lg:block')} aria-label="Disputas">
        {disputes.map((d) => {
          const needsReply = d.status === 'AWAITING_PRODUCER';
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedId(d.id)}
                aria-current={d.id === selectedId ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                  d.id === selectedId
                    ? 'border-origen-pradera bg-origen-pastel/60'
                    : 'border-border-subtle bg-surface-alt hover:bg-origen-pastel/30',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-origen-bosque">
                    {DISPUTE_REASON_LABEL[d.reason] ?? 'Otro motivo'}
                  </p>
                  <p className="mt-0.5 text-xs text-text-subtle">
                    Abierta el {format(new Date(d.createdAt), "d 'de' MMM yyyy", { locale: es })}
                  </p>
                  <Badge variant={isDisputeClosed(d.status) ? 'success' : needsReply ? 'warning' : 'info'} size="sm" className="mt-1.5">
                    {DISPUTE_STATUS_LABEL[d.status] ?? 'En curso'}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <div className={cn('min-w-0', !selected && 'hidden lg:block')}>
        {selected ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSelectedId(null)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Disputas
              </Button>
              <Link href={`/dashboard/orders/${selected.orderId}`} className="text-sm font-medium text-origen-hoja underline">
                Ver el pedido
              </Link>
            </div>
            <OrderDisputeSection key={selected.id} orderId={selected.orderId} />
          </div>
        ) : (
          <p className="hidden rounded-2xl border border-border-subtle bg-surface-alt p-5 text-sm text-text-subtle lg:block">
            Elige una disputa para ver toda la conversación.
          </p>
        )}
      </div>
    </div>
  );
}
