/**
 * @file OrderDisputeSection.tsx
 * @description Sección "Disputa" del detalle de pedido del productor: estado,
 * motivo, descripción del comprador, resolución y el hilo de mensajes con
 * formulario de respuesta. Una sola card (sin cards anidadas). Solo se pinta
 * si el pedido tiene disputa. Ancla `#disputa` para llegar desde la notificación.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Scale } from 'lucide-react';
import { Badge, Button, Textarea, toast } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import {
  fetchDisputeForOrder,
  fetchDisputeMessages,
  sendDisputeMessage,
  type Dispute,
  type DisputeMessage,
} from '@/lib/api/disputes';
import {
  DISPUTE_REASON_LABEL,
  DISPUTE_SENDER_LABEL,
  DISPUTE_STATUS_LABEL,
  DISPUTE_VERDICT_LABEL,
  isDisputeClosed,
} from '@/lib/dispute-labels';

const MAX_LENGTH = 2000;

const formatEuro = (value: number | string) =>
  Number(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export function OrderDisputeSection({ orderId }: { orderId: string }) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDisputeForOrder(orderId)
      .then((d) => {
        if (cancelled || !d) return;
        setDispute(d);
        setMessages(d.messages ?? []);
      })
      .catch(() => undefined); // sin disputa o sin acceso: la sección no se muestra
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Si se llega con #disputa (o desde la notificación), la sección queda a la vista.
  useEffect(() => {
    if (dispute && window.location.hash === '#disputa') {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [dispute]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!dispute || !content || sending) return;
    setSending(true);
    try {
      await sendDisputeMessage(dispute.id, content);
      setDraft('');
      setMessages(await fetchDisputeMessages(dispute.id));
    } catch {
      toast({ title: 'No se pudo enviar el mensaje', description: 'Inténtalo de nuevo en unos segundos.', variant: 'error' });
    } finally {
      setSending(false);
    }
  }, [dispute, draft, sending]);

  if (!dispute) return null;
  const closed = isDisputeClosed(dispute.status);
  const needsReply = dispute.status === 'AWAITING_PRODUCER';

  return (
    <section
      id="disputa"
      ref={ref}
      data-testid="order-dispute"
      className="mb-4 scroll-mt-24 rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm sm:p-5 lg:mb-6"
    >
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-origen-pastel">
          <Scale className="h-5 w-5 text-origen-hoja" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-origen-bosque">Disputa</h2>
          <p className="text-xs text-text-subtle">
            {DISPUTE_REASON_LABEL[dispute.reason] ?? 'Otro motivo'} · abierta el{' '}
            {format(new Date(dispute.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Badge variant={closed ? 'success' : needsReply ? 'warning' : 'info'} size="sm">
          {DISPUTE_STATUS_LABEL[dispute.status] ?? 'En curso'}
        </Badge>
      </div>

      <div className="mb-4 border-t border-border-subtle pt-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
          Lo que cuenta el comprador
        </p>
        <p className="whitespace-pre-wrap text-sm text-origen-bosque">{dispute.description}</p>
      </div>

      {closed && dispute.verdict && (
        <div className="mb-4 border-t border-border-subtle pt-4" data-testid="dispute-verdict">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
            Resolución
          </p>
          <p className="text-sm font-medium text-origen-bosque">
            {DISPUTE_VERDICT_LABEL[dispute.verdict]}
            {dispute.refundAmount != null && Number(dispute.refundAmount) > 0
              ? ` · ${formatEuro(dispute.refundAmount)}`
              : ''}
          </p>
          {dispute.verdictNote && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-subtle">{dispute.verdictNote}</p>
          )}
        </div>
      )}

      <div className="border-t border-border-subtle pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
          Conversación
        </p>
        {messages.length === 0 ? (
          <p className="text-sm text-text-subtle">Todavía no hay mensajes.</p>
        ) : (
          <ul className="space-y-3" data-testid="dispute-thread">
            {messages.map((m) => {
              const mine = m.senderType === 'PRODUCER';
              return (
                <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[75%]',
                      mine ? 'bg-origen-pastel text-origen-bosque' : 'bg-surface text-origen-bosque ring-1 ring-border-subtle',
                    )}
                  >
                    <p className="mb-0.5 text-xs font-semibold">
                      {DISPUTE_SENDER_LABEL[m.senderType]}
                      <span className="ml-2 font-normal text-text-subtle">
                        {format(new Date(m.createdAt), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </p>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    {m.attachments?.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {m.attachments.map((url, i) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-origen-hoja underline"
                            >
                              Adjunto {i + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {closed ? (
          <p className="mt-4 text-xs text-text-subtle">
            La disputa está {dispute.status === 'RESOLVED' ? 'resuelta' : 'cerrada'}: ya no se pueden
            enviar más mensajes.
          </p>
        ) : (
          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Escribe tu respuesta…"
              rows={3}
              maxLength={MAX_LENGTH}
              aria-label="Respuesta a la disputa"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-subtle tabular-nums">
                {draft.length}/{MAX_LENGTH}
              </span>
              <Button type="submit" size="sm" loading={sending} disabled={sending || !draft.trim()}>
                Enviar respuesta
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
