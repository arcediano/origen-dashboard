/**
 * Tipos de la máquina de pasos fija "Origen Assist" (rediseño v2,
 * 2026-10-26, petición del humano con spec detallado): sustituye al chat
 * libre de la ronda anterior. `POST /ai-assist/conversation` y
 * `POST /ai-assist/conversation/:id/message` devuelven siempre o bien el
 * siguiente paso (`kind: 'step'`) o bien el borrador ya creado
 * (`kind: 'draft_ready'`).
 */
import type { LabelImagePayload } from './resize-label-image';

export interface ConversationMessageInput {
  text?: string;
  images?: LabelImagePayload[];
  /** Chip pulsado por el productor (p. ej. "Local", "Ninguno", "No tengo foto", "usda:0:..."). */
  choice?: string;
}

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
      done: true;
    };
