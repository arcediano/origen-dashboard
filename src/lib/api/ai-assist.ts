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

/** Lectura con visión: hasta ~90 s en el gateway. */
const LABEL_READING_TIMEOUT_MS = 90_000;
/** Redacción de textos: hasta ~60 s en el gateway. */
const TEXT_IMPROVEMENT_TIMEOUT_MS = 60_000;

export type AiAssistErrorCode =
  | 'AI_DISABLED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_MONTHLY_CAP_REACHED'
  | 'AI_MODEL_NOT_PRICED'
  | 'AI_PRODUCER_QUOTA_EXCEEDED'
  | 'AI_CALL_FAILED'
  | 'AI_LABEL_UNREADABLE'
  | 'AI_TEXT_UNUSABLE';

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
