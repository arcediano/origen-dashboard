/**
 * Tipos de la compra de créditos del asistente de IA (petición del humano,
 * 2026-10-04): cuando el productor agota el cupo gratis, puede comprar
 * créditos con cobro real de tarjeta (Stripe PaymentIntent). 1 crédito =
 * 1,20 €; 10% de descuento desde 5 créditos, 20% desde 10 — el backend es
 * la única autoridad de precio, aquí solo se tipa su respuesta.
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

/** Tarjeta guardada del productor (solo datos no sensibles). */
export interface AiSavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/** Respuesta de `GET /ai-assist/credits/payment-methods`. */
export interface AiSavedCardsInfo {
  defaultId: string | null;
  methods: AiSavedCard[];
}

/** Respuesta de `POST /ai-assist/credits/checkout/saved`. */
export interface AiCreditsSavedCheckoutResult {
  purchaseId: string;
  status: 'succeeded' | 'requires_action' | 'processing';
  /** Solo con `requires_action` (3D Secure): para completar la autenticación en el navegador. */
  clientSecret: string | null;
  totalCents: number;
  credits: number;
  currency: string;
}

const CARD_BRANDS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

export function cardBrandLabel(brand: string): string {
  return CARD_BRANDS[brand] ?? 'Tarjeta';
}

/** «08/30» */
export function cardExpiry(card: Pick<AiSavedCard, 'expMonth' | 'expYear'>): string {
  return `${String(card.expMonth).padStart(2, '0')}/${String(card.expYear % 100).padStart(2, '0')}`;
}

/** ¿La tarjeta ha caducado (o caduca este mismo mes pasado)? Se avisa antes de intentar cobrar. */
export function isCardExpired(
  card: Pick<AiSavedCard, 'expMonth' | 'expYear'>,
  now: Date = new Date(),
): boolean {
  return card.expYear < now.getFullYear() ||
    (card.expYear === now.getFullYear() && card.expMonth < now.getMonth() + 1);
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
