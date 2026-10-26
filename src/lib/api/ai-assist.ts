/**
 * Cliente del asistente de IA (F1: lectura de etiqueta · F2: mejora de textos).
 * Rutas: GET /ai-assist/quota · POST /ai-assist/label-reading · POST /ai-assist/text-improvement
 * (gateway → products-service).
 * La API key de Anthropic vive solo en el backend.
 */

import { gatewayClient, GatewayError } from './client';
import type {
  AiAssistQuota,
  LabelReadingResponse,
} from '@/lib/ai-assist/label-proposal';
import type { TextDraft, TextImprovementResponse } from '@/lib/ai-assist/text-proposal';
import type { LabelImagePayload } from '@/lib/ai-assist/resize-label-image';
import type {
  AiCreditPurchaseStatusResult,
  AiCreditsCheckoutResult,
  AiCreditsPricingInfo,
} from '@/lib/ai-assist/ai-credits';
import type {
  ConversationMessageInput,
  ConversationTurnResponse,
} from '@/lib/ai-assist/conversation';

/** Lectura con visión: hasta ~90 s en el gateway. */
const LABEL_READING_TIMEOUT_MS = 90_000;
/** Redacción de textos: hasta ~60 s en el gateway. */
const TEXT_IMPROVEMENT_TIMEOUT_MS = 60_000;
/** Chat conversacional "Origen Assist": cada turno puede hacer varias llamadas a Opus en el bucle del backend. */
const CONVERSATION_TIMEOUT_MS = 125_000;

export type AiAssistErrorCode =
  | 'AI_DISABLED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_MONTHLY_CAP_REACHED'
  | 'AI_MODEL_NOT_PRICED'
  | 'AI_PRODUCER_QUOTA_EXCEEDED'
  | 'AI_CALL_FAILED'
  | 'AI_LABEL_UNREADABLE'
  | 'AI_TEXT_UNUSABLE'
  | 'AI_DRAFT_UNUSABLE'
  | 'AI_DRAFT_NO_CATEGORIES';

/** Error de la API con el código estable del backend (mensaje ya en español). */
export class AiAssistError extends Error {
  constructor(
    message: string,
    public readonly code: AiAssistErrorCode | null,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AiAssistError';
  }
}

/** El gateway responde `{ statusCode, message, code? }`; `code` es el código estable del backend. */
function toAiAssistError(error: unknown): AiAssistError {
  if (error instanceof GatewayError) {
    const data = error.data as { code?: AiAssistErrorCode } | undefined;
    return new AiAssistError(error.message, data?.code ?? null, error.status);
  }
  return new AiAssistError(
    error instanceof Error ? error.message : 'No se ha podido usar el asistente de IA.',
    null,
    0,
  );
}

export async function getAiAssistQuota(): Promise<AiAssistQuota> {
  try {
    return await gatewayClient.get<AiAssistQuota>('/ai-assist/quota');
  } catch (error) {
    throw toAiAssistError(error);
  }
}

export async function readLabel(
  assistKey: string,
  images: LabelImagePayload[],
): Promise<LabelReadingResponse> {
  try {
    return await gatewayClient.post<LabelReadingResponse>(
      '/ai-assist/label-reading',
      { assistKey, images },
      { timeoutMs: LABEL_READING_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

export async function improveText(
  assistKey: string,
  draft: TextDraft,
): Promise<TextImprovementResponse> {
  try {
    return await gatewayClient.post<TextImprovementResponse>(
      '/ai-assist/text-improvement',
      { assistKey, ...draft },
      { timeoutMs: TEXT_IMPROVEMENT_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/**
 * Chat conversacional "Origen Assist" (rediseño 2026-10-26): sustituye al
 * wizard de `draftProduct()` en el flujo del dashboard, turno a turno.
 */
export async function startConversation(
  input: ConversationMessageInput,
): Promise<ConversationTurnResponse> {
  try {
    return await gatewayClient.post<ConversationTurnResponse>(
      '/ai-assist/conversation',
      input,
      { timeoutMs: CONVERSATION_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

export async function postConversationMessage(
  conversationId: string,
  input: ConversationMessageInput,
): Promise<ConversationTurnResponse> {
  try {
    return await gatewayClient.post<ConversationTurnResponse>(
      `/ai-assist/conversation/${conversationId}/message`,
      input,
      { timeoutMs: CONVERSATION_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

export interface ConversationRecord {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  productId: string | null;
  /** Paso actual de la máquina de pasos fija (ver `lib/ai-assist/conversation.ts`), para reanudar tras recargar. */
  currentStep: string;
}

export async function getConversation(conversationId: string): Promise<ConversationRecord> {
  try {
    return await gatewayClient.get<ConversationRecord>(`/ai-assist/conversation/${conversationId}`);
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/** Precios de los paquetes de créditos y cuántos tiene ya comprados el productor. */
export async function getAiCreditsPricing(): Promise<AiCreditsPricingInfo> {
  try {
    return await gatewayClient.get<AiCreditsPricingInfo>('/ai-assist/credits');
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/** Crea el PaymentIntent de la compra; el frontend confirma el pago con Stripe.js (`clientSecret`). */
export async function checkoutAiCredits(credits: number): Promise<AiCreditsCheckoutResult> {
  try {
    return await gatewayClient.post<AiCreditsCheckoutResult>('/ai-assist/credits/checkout', {
      credits,
    });
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/** Para comprobar si el webhook ya confirmó la compra tras `stripe.confirmPayment`. */
export async function getAiCreditPurchaseStatus(
  purchaseId: string,
): Promise<AiCreditPurchaseStatusResult> {
  try {
    return await gatewayClient.get<AiCreditPurchaseStatusResult>(
      `/ai-assist/credits/purchases/${purchaseId}`,
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/** Una compra confirmada de créditos del asistente de IA (sección Facturación). */
export interface AiCreditPurchaseItem {
  id: string;
  credits: number;
  amountCents: number;
  currency: string;
  createdAt: string;
}

/** Historial de compras de créditos confirmadas del productor, más recientes primero. */
export async function listAiCreditPurchases(): Promise<AiCreditPurchaseItem[]> {
  try {
    return await gatewayClient.get<AiCreditPurchaseItem[]>('/ai-assist/credits/purchases');
  } catch (error) {
    throw toAiAssistError(error);
  }
}
