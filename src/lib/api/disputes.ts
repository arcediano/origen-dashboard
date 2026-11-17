/**
 * @file disputes.ts
 * @description Disputas vistas por el productor. El backend ya devuelve solo los
 * mensajes dirigidos a él (o a todas las partes); el front muestra lo recibido.
 *
 *   GET  /disputes/mine              — disputas del productor
 *   GET  /disputes/:id               — detalle (incluye mensajes)
 *   GET  /disputes/:id/messages      — hilo de mensajes
 *   POST /disputes/:id/messages      — responder ({ content })
 */

import { gatewayClient } from './client';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'AWAITING_BUYER'
  | 'AWAITING_PRODUCER'
  | 'RESOLVED'
  | 'CLOSED';
export type DisputeReason =
  | 'PRODUCT_NOT_RECEIVED'
  | 'PRODUCT_DAMAGED'
  | 'WRONG_PRODUCT'
  | 'QUALITY_ISSUE'
  | 'OTHER';
export type DisputeVerdict = 'BUYER_WINS' | 'PRODUCER_WINS' | 'SPLIT' | 'CANCELLED';
export type DisputeSenderType = 'BUYER' | 'PRODUCER' | 'ADMIN';

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderType: DisputeSenderType;
  senderId: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  verdict: DisputeVerdict | null;
  verdictNote: string | null;
  refundAmount: number | string | null;
  createdAt: string;
  updatedAt: string;
  messages?: DisputeMessage[];
}

/** El gateway reenvía la respuesta tal cual; algunas rutas la envuelven en `{ data }`. */
function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw && !Array.isArray(raw)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export async function fetchMyDisputes(): Promise<Dispute[]> {
  const raw = await gatewayClient.get<unknown>('/disputes/mine', {
    fetchOptions: { cache: 'no-store' },
  });
  const list = unwrap<Dispute[]>(raw);
  return Array.isArray(list) ? list : [];
}

/** La disputa más reciente de un pedido, con su hilo; null si no hay. */
export async function fetchDisputeForOrder(orderId: string): Promise<Dispute | null> {
  const mine = await fetchMyDisputes();
  const found = mine
    .filter((d) => d.orderId === orderId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (!found) return null;
  const raw = await gatewayClient.get<unknown>(`/disputes/${found.id}`, {
    fetchOptions: { cache: 'no-store' },
  });
  return unwrap<Dispute>(raw);
}

export async function fetchDisputeMessages(id: string): Promise<DisputeMessage[]> {
  const raw = await gatewayClient.get<unknown>(`/disputes/${id}/messages`, {
    fetchOptions: { cache: 'no-store' },
  });
  const list = unwrap<DisputeMessage[]>(raw);
  return Array.isArray(list) ? list : [];
}

export async function sendDisputeMessage(id: string, content: string): Promise<DisputeMessage> {
  const raw = await gatewayClient.post<unknown>(`/disputes/${id}/messages`, { content });
  return unwrap<DisputeMessage>(raw);
}
