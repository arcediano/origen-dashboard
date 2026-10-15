/**
 * Mínimo real que exige Stripe para poder cobrar un PaymentIntent — el
 * backend ya lo exige (products.service.ts, price-validation.util.ts) en
 * basePrice/variantes/ofertas; aquí se usa para dar el mismo feedback al
 * productor en el propio formulario, antes de enviar (petición del humano,
 * 2026-10-15).
 */
export const MIN_PRODUCT_PRICE_EUROS = 0.5;
