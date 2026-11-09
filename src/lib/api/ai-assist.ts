/**
 * Cliente del asistente de IA "Origen Assist" (formulario guiado de creación
 * de producto) + créditos de IA.
 * Rutas: GET /ai-assist/quota · POST /ai-assist/assisted-product (gateway →
 * products-service). La API key de Anthropic vive solo en el backend.
 */

import { gatewayClient, GatewayError } from './client';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import type {
  AiCreditPurchaseStatusResult,
  AiCreditsCheckoutResult,
  AiCreditsPricingInfo,
} from '@/lib/ai-assist/ai-credits';
import type {
  AssistedProductResponse,
  CreateAssistedProductInput,
} from '@/lib/ai-assist/assisted-product';
import type {
  ProfilePhotoCollection,
  ProfileReviewFields,
  ProfileReviewResult,
} from '@/lib/ai-assist/profile-review';

/** Formulario guiado "Origen Assist": lectura de hasta 3 etiquetas + redacción + FLUX opcional; el proxy de Next corta a los 130 s. */
const ASSISTED_PRODUCT_TIMEOUT_MS = 125_000;
/** La revisión de perfil puede incluir hasta 3 fotos procesadas con FLUX -- mismo presupuesto que el formulario guiado. */
const PROFILE_REVIEW_TIMEOUT_MS = 125_000;

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

/**
 * Formulario guiado "Origen Assist" (2026-11-05): un único envío con todas
 * las respuestas y fotos; el backend lee las etiquetas, redacta los textos y
 * crea el producto en borrador.
 */
export async function createAssistedProduct(
  input: CreateAssistedProductInput,
): Promise<AssistedProductResponse> {
  try {
    return await gatewayClient.post<AssistedProductResponse>(
      '/ai-assist/assisted-product',
      input,
      { timeoutMs: ASSISTED_PRODUCT_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAiAssistError(error);
  }
}

/** Una foto a revisar: la URL ya resuelta (CDN) de la primera foto activa de una galería. */
export interface ProfileReviewPhotoInput {
  collection: ProfilePhotoCollection;
  key: string;
  url: string;
}

/**
 * "Mejorar con IA" del perfil comercial ("Mi negocio", petición del humano,
 * 2026-11-08, ampliado a fotos 2026-11-09): revisa los textos actuales campo
 * a campo y, si se envían, hasta 3 fotos (una por galería) -- nunca
 * sobrescribe/sube nada, el productor acepta o descarta cada sugerencia.
 * Cobra 1 crédito en total de la misma bolsa que la creación de producto
 * asistida, cubra texto, fotos o ambos.
 */
export async function reviewProfile(
  fields: ProfileReviewFields,
  photos?: ProfileReviewPhotoInput[],
): Promise<ProfileReviewResult> {
  try {
    return await gatewayClient.post<ProfileReviewResult>(
      '/ai-assist/profile-review',
      { ...fields, ...(photos && photos.length > 0 ? { photos } : {}) },
      { timeoutMs: PROFILE_REVIEW_TIMEOUT_MS },
    );
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
