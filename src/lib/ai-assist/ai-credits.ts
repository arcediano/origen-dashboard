/**
 * Tipos de la compra de créditos del asistente de IA (petición del humano,
 * 2026-10-04): cuando el productor agota el cupo gratis, puede comprar
 * créditos con cobro real de tarjeta (Stripe PaymentIntent). 1 crédito =
 * 1,80 €; 15% de descuento desde 3 créditos, 30% desde 5 — el backend es la
 * única autoridad de precio, aquí solo se tipa su respuesta.
 */

export interface AiCreditPriceQuote {
  credits: number;
  unitPriceCents: number;
  discountPct: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}

/** Respuesta de `GET /ai-assist/credits`. */
export interface AiCreditsPricingInfo {
  purchasedCredits: number;
  presets: AiCreditPriceQuote[];
}

/** Respuesta de `POST /ai-assist/credits/checkout`. */
export interface AiCreditsCheckoutResult {
  purchaseId: string;
  clientSecret: string;
  totalCents: number;
  credits: number;
  currency: string;
}

export type AiCreditPurchaseStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

/** Respuesta de `GET /ai-assist/credits/purchases/:id`. */
export interface AiCreditPurchaseStatusResult {
  status: AiCreditPurchaseStatus;
  credits: number;
}

export function formatEurCents(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });
}
