/**
 * @file DisputeDetail.tsx
 * @description Detalle de una disputa del productor: estado, motivo, descripción del comprador,
 * resolución y el hilo de mensajes con formulario de respuesta. Es el ÚNICO sitio donde vive la
 * conversación (el detalle del pedido solo enlaza aquí). Se pinta sin tarjeta sobre la superficie
 * blanca de la página de Disputas; las notificaciones de disputa llegan a esta pantalla.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Scale } from 'lucide-react';
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

const SECTION_LABEL = 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-origen-hoja';

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

  return (
    <section data-testid="order-dispute" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-origen-pastel">
          <Scale className="h-5 w-5 text-origen-hoja" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-origen-bosque">Disputa</h2>
          <p className="text-sm text-origen-pino">
            {DISPUTE_REASON_LABEL[dispute.reason] ?? 'Otro motivo'} · abierta el{' '}
            {format(new Date(dispute.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Badge variant={closed ? 'success' : needsReply ? 'warning' : 'info'} size="sm">
          {DISPUTE_STATUS_LABEL[dispute.status] ?? 'En curso'}
        </Badge>
      </div>

      <div className="mb-5 border-t border-border-subtle pt-5">
        <p className={SECTION_LABEL}>Lo que cuenta el comprador</p>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-origen-bosque">{dispute.description}</p>
      </div>

      {closed && dispute.verdict && (
        <div className="mb-5 border-t border-border-subtle pt-5" data-testid="dispute-verdict">
          <p className={SECTION_LABEL}>Resolución</p>
          <p className="text-base font-semibold text-origen-bosque">
            {DISPUTE_VERDICT_LABEL[dispute.verdict]}
            {dispute.refundAmount != null && Number(dispute.refundAmount) > 0
              ? ` · ${formatEuro(dispute.refundAmount)}`
              : ''}
          </p>
          {dispute.verdictNote && (
            <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-origen-pino">{dispute.verdictNote}</p>
          )}
        </div>
      )}

      <div className="border-t border-border-subtle pt-5">
        <p className={cn(SECTION_LABEL, 'mb-3')}>Conversación</p>
        {messages.length === 0 ? (
          <p className="text-base text-origen-pino">Todavía no hay mensajes.</p>
        ) : (
          <ul className="space-y-2.5" data-testid="dispute-thread">
            {messages.map((m) => {
              const role = resolveChatRole(m, dispute);
              const style = CHAT_ROLE_STYLE[role];
              return (
                <li
                  key={m.id}
                  data-role={role}
                  className={cn('flex gap-3 rounded-xl border-l-4 px-4 py-3', style.bar, style.bg)}
                >
                  <span
                    aria-hidden="true"
                    className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', style.avatar)}
                  >
                    {CHAT_ROLE_LABEL[role].charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', style.chip)}>
                        {CHAT_ROLE_LABEL[role]}
                      </span>
                      {role === 'PRODUCER' && <span className="text-sm font-semibold text-origen-bosque">Tú</span>}
                      <span className="text-sm text-origen-pino">
                        {format(new Date(m.createdAt), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-base leading-relaxed text-origen-bosque">{m.content}</p>
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
        )}

        {closed ? (
          <p className="mt-5 text-sm text-origen-pino">
            La disputa está {dispute.status === 'RESOLVED' ? 'resuelta' : 'cerrada'}: ya no se pueden
            enviar más mensajes.
          </p>
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
