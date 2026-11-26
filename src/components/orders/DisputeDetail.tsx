/**
 * @file DisputeDetail.tsx
 * @description Detalle de una disputa del productor, pensado para ir al grano:
 *  1. Cabecera mínima (motivo, fecha y estado).
 *  2. La RESOLUCIÓN, destacada en un panel de color, cuando la disputa está cerrada.
 *  3. La conversación: lo que cuenta el comprador es el primer mensaje del hilo (sin sección
 *     aparte) y el formulario de respuesta va debajo.
 * Es el ÚNICO sitio donde vive la conversación (el detalle del pedido solo enlaza aquí). Se pinta
 * sin tarjeta sobre la superficie blanca de la página de Disputas.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Download, Handshake, MinusCircle, XCircle } from 'lucide-react';
import { Badge, Button, Textarea, toast } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import {
  fetchDisputeMessages,
  sendDisputeMessage,
  type Dispute,
  type DisputeMessage,
} from '@/lib/api/disputes';
import {
  DISPUTE_REASON_LABEL,
  DISPUTE_STATUS_LABEL,
  DISPUTE_VERDICT_LABEL,
  isDisputeClosed,
} from '@/lib/dispute-labels';
import type { DisputeVerdict } from '@/lib/api/disputes';
import { CHAT_ROLE_LABEL, CHAT_ROLE_STYLE, resolveChatRole } from '@/lib/dispute-chat';

const MAX_LENGTH = 2000;

const formatEuro = (value: number | string) =>
  Number(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

/** Nombre legible del adjunto a partir de su URL (último tramo de la ruta); «Adjunto N» si no hay. */
function attachmentName(url: string, index: number): string {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop();
    const name = last ? decodeURIComponent(last) : '';
    return name || `Adjunto ${index + 1}`;
  } catch {
    return `Adjunto ${index + 1}`;
  }
}

/** Aspecto del panel de resolución según el veredicto (desde el punto de vista del productor). */
const VERDICT_STYLE: Record<DisputeVerdict, { panel: string; icon: string; Icon: typeof CheckCircle2 }> = {
  PRODUCER_WINS: { panel: 'border-feedback-success-border bg-feedback-success-subtle', icon: 'text-feedback-success-text', Icon: CheckCircle2 },
  BUYER_WINS: { panel: 'border-feedback-danger-border bg-feedback-danger-subtle', icon: 'text-feedback-danger-text', Icon: XCircle },
  SPLIT: { panel: 'border-feedback-warning-border bg-feedback-warning-subtle', icon: 'text-feedback-warning-text', Icon: Handshake },
  CANCELLED: { panel: 'border-border bg-surface', icon: 'text-origen-pino', Icon: MinusCircle },
};

export function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const [messages, setMessages] = useState<DisputeMessage[]>(dispute.messages ?? []);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // La lista de disputas puede no traer el hilo: se pide siempre el actualizado.
  useEffect(() => {
    let cancelled = false;
    fetchDisputeMessages(dispute.id)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch(() => undefined); // se mantiene lo que ya hubiera
    return () => {
      cancelled = true;
    };
  }, [dispute.id]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;
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
  }, [dispute.id, draft, sending]);

  const closed = isDisputeClosed(dispute.status);
  const needsReply = dispute.status === 'AWAITING_PRODUCER';
  const verdict = closed && dispute.verdict ? VERDICT_STYLE[dispute.verdict] : null;
  const refund = dispute.refundAmount != null && Number(dispute.refundAmount) > 0 ? Number(dispute.refundAmount) : null;

  return (
    <section data-testid="order-dispute" className="scroll-mt-24">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-origen-bosque">
            {DISPUTE_REASON_LABEL[dispute.reason] ?? 'Otro motivo'}
          </h2>
          <p className="text-sm text-origen-pino">
            Abierta el {format(new Date(dispute.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Badge variant={closed ? 'success' : needsReply ? 'warning' : 'info'} size="sm">
          {DISPUTE_STATUS_LABEL[dispute.status] ?? 'En curso'}
        </Badge>
      </header>

      {verdict && dispute.verdict && (
        <div
          data-testid="dispute-verdict"
          className={cn('mb-6 flex items-start gap-4 rounded-2xl border-2 p-4 sm:p-5', verdict.panel)}
        >
          <verdict.Icon className={cn('mt-0.5 h-8 w-8 shrink-0', verdict.icon)} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-origen-pino">Resolución</p>
            <p className="mt-0.5 text-lg font-bold leading-snug text-origen-bosque sm:text-xl">
              {DISPUTE_VERDICT_LABEL[dispute.verdict]}
            </p>
            {refund != null && (
              <p className="mt-2 text-2xl font-bold tabular-nums text-origen-bosque">
                {formatEuro(refund)}
                <span className="ml-2 text-sm font-medium text-origen-pino">reembolsados al comprador</span>
              </p>
            )}
            {dispute.verdictNote && (
              <p className="mt-3 whitespace-pre-wrap border-t border-black/10 pt-3 text-base leading-relaxed text-origen-bosque">
                {dispute.verdictNote}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-base font-semibold text-origen-bosque">Conversación</h3>
        <ul className="space-y-3" data-testid="dispute-thread">
          {/* Lo que cuenta el comprador es el primer mensaje del hilo. */}
          <li data-kind="opening" className="flex flex-col items-start">
            <p className="mb-1 text-xs text-origen-pino">Comprador · al abrir la disputa</p>
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-blue-50 px-4 py-3 sm:max-w-[80%]">
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-origen-bosque">{dispute.description}</p>
            </div>
          </li>
          {messages.map((m) => {
            const role = resolveChatRole(m, dispute);
            const mine = role === 'PRODUCER';
            const style = CHAT_ROLE_STYLE[role];
            return (
              <li key={m.id} data-role={role} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                <p className="mb-1 text-xs text-origen-pino">
                  <span className="font-semibold text-origen-bosque">{mine ? 'Tú' : CHAT_ROLE_LABEL[role]}</span>
                  {' · '}
                  {format(new Date(m.createdAt), 'd MMM, HH:mm', { locale: es })}
                </p>
                <div
                  className={cn(
                    'max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%]',
                    mine ? 'rounded-tr-sm' : 'rounded-tl-sm',
                    style.bg,
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-origen-bosque">{m.content}</p>
                  {m.attachments?.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Archivos adjuntos">
                      {m.attachments.map((url, i) => {
                        const name = attachmentName(url, i);
                        return (
                          <li key={url} className="min-w-0 max-w-full">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              title={`Descargar ${name}`}
                              className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-origen-bosque transition-colors hover:border-origen-pradera hover:bg-origen-pastel/40"
                            >
                              <Download className="h-4 w-4 shrink-0 text-origen-hoja" aria-hidden />
                              <span className="truncate">{name}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {closed ? (
          <p className="mt-5 text-sm text-origen-pino">Disputa cerrada: ya no se pueden enviar más mensajes.</p>
        ) : (
          <form
            className="mt-5 space-y-2"
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
              <span className="text-sm text-origen-pino tabular-nums">
                {draft.length}/{MAX_LENGTH}
              </span>
              <Button type="submit" size="md" loading={sending} disabled={sending || !draft.trim()}>
                Enviar respuesta
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
