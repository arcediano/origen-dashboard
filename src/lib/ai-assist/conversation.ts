/**
 * Tipos del chat conversacional "Origen Assist" (rediseño 2026-10-26):
 * `POST /ai-assist/conversation` y `POST /ai-assist/conversation/:id/message`.
 * Cuando el asistente entrega el borrador final (`kind: 'draft_ready'`), la
 * respuesta tiene exactamente la misma forma que `ProductDraftResponse` (más
 * `kind`/`conversationId`/`text`/`done`) -- así `draftToPatches()` y
 * `AiProductReview` se reutilizan sin cambios.
 */
import type { LabelImagePayload } from './resize-label-image';
import type { FollowUpField, ProductDraftResponse } from './product-draft';

export interface ConversationMessageInput {
  text?: string;
  images?: LabelImagePayload[];
  /** Respuesta a una pregunta de cierre pendiente (ver `ConversationQuestion`). */
  followUpAnswer?: string;
}

export interface ConversationQuestion {
  field: FollowUpField;
  question: string;
  type: 'text' | 'single_choice';
  options: string[] | null;
}

export type ConversationTurnResponse =
  | { kind: 'message'; conversationId: string; text: string; done: false }
  | {
      kind: 'question';
      conversationId: string;
      text: string;
      question: ConversationQuestion;
      done: false;
    }
  | ({
      kind: 'draft_ready';
      conversationId: string;
      text: string;
      productId: string;
      done: true;
    } & ProductDraftResponse);
