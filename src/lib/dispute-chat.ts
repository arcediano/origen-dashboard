/**
 * Quién escribe cada mensaje de una disputa, para etiquetarlo y colorearlo en el chat.
 *
 * `senderType` viene del rol del token con el que se escribió, y una cuenta con varios roles
 * (comprador y productor) dejaba mensajes del comprador firmados como «productor». Por eso,
 * si la disputa conoce al comprador y al productor y son cuentas distintas, el remitente se
 * deduce de su ID; `senderType` solo desempata (admin, o la misma cuenta en ambos papeles).
 */

export type ChatRole = 'BUYER' | 'PRODUCER' | 'ADMIN';

export function resolveChatRole(
  message: { senderType: string; senderId: string },
  dispute: { buyerUserId?: string | null; producerId?: string | null },
): ChatRole {
  if (message.senderType === 'ADMIN') return 'ADMIN';
  const { buyerUserId, producerId } = dispute;
  if (buyerUserId && producerId && buyerUserId !== producerId) {
    if (message.senderId === buyerUserId) return 'BUYER';
    if (message.senderId === producerId) return 'PRODUCER';
  }
  return message.senderType === 'PRODUCER' ? 'PRODUCER' : 'BUYER';
}

export const CHAT_ROLE_LABEL: Record<ChatRole, string> = {
  BUYER: 'Comprador',
  PRODUCER: 'Productor',
  ADMIN: 'Equipo de Origen',
};

/** Colores por rol: barra lateral, fondo suave, avatar y etiqueta. */
export const CHAT_ROLE_STYLE: Record<ChatRole, { bar: string; bg: string; avatar: string; chip: string }> = {
  BUYER: {
    bar: 'border-l-blue-500',
    bg: 'bg-blue-50/60',
    avatar: 'bg-blue-600 text-white',
    chip: 'bg-blue-100 text-blue-900',
  },
  PRODUCER: {
    bar: 'border-l-origen-pradera',
    bg: 'bg-origen-pastel/40',
    avatar: 'bg-origen-hoja text-white',
    chip: 'bg-origen-pastel text-origen-bosque',
  },
  ADMIN: {
    bar: 'border-l-violet-500',
    bg: 'bg-violet-50/60',
    avatar: 'bg-violet-600 text-white',
    chip: 'bg-violet-100 text-violet-900',
  },
};
