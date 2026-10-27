/**
 * Tipos de la máquina de pasos fija "Origen Assist" (rediseño v2,
 * 2026-10-26, petición del humano con spec detallado): sustituye al chat
 * libre de la ronda anterior. `POST /ai-assist/conversation` y
 * `POST /ai-assist/conversation/:id/message` devuelven el siguiente paso
 * (`kind: 'step'`), el borrador ya creado (`kind: 'draft_ready'`) o, desde
 * el control de coste del 2026-10-27, un cierre por límite de uso o por
 * fallo técnico (`kind: 'closed'`) -- ver RN-2 en el informe funcional.
 */
import type { LabelImagePayload } from './resize-label-image';

export interface ConversationMessageInput {
  text?: string;
  images?: LabelImagePayload[];
  /** Chip pulsado por el productor (p. ej. "Local", "Ninguno", "No tengo foto", "usda:0:..."). */
  choice?: string;
}

export type ConversationCloseReason = 'limit_turns' | 'limit_cost' | 'limit_time' | 'assistant_error';

export type ConversationTurnResponse =
  | {
      kind: 'step';
      conversationId: string;
      text: string;
      stepIndex: number;
      totalSteps: number;
      imageDropzoneLabel?: string;
      chips?: string[];
      done: false;
    }
  | {
      kind: 'draft_ready';
      conversationId: string;
      text: string;
      productId: string;
      charged: true;
      done: true;
    }
  | {
      kind: 'closed';
      conversationId: string;
      text: string;
      reason: ConversationCloseReason;
      /** `true` si al cerrar ya había foto+nombre (se creó un DRAFT y se cobró el crédito), `false` si no. */
      charged: boolean;
      /** Presente solo cuando `charged` es `true`. */
      productId?: string;
      done: true;
    };
