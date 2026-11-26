/**
 * Condiciones económicas vigentes para el productor, SIEMPRE leídas de lo que
 * el administrador tiene configurado (nunca cifras fijas en el código):
 *  - Comisión de Origen del propio productor (GET /producers/me → commissionRate).
 *  - Penalización por pedido pequeño: importe mínimo de productos y cuantía
 *    (GET /orders/public/policy → smallBasketThreshold / smallBasketFee).
 */
import { gatewayClient } from './client';

export interface CommissionTerms {
  /** Comisión como fracción (0.12 = 12 %). null si no se pudo leer. */
  commissionRate: number | null;
  /** Importe de productos por debajo del cual se aplica la penalización (€). 0 = desactivada. */
  smallBasketThreshold: number;
  /** Penalización (€) a cargo del productor. 0 = desactivada. */
  smallBasketFee: number;
}

type Wrapped<T> = { data?: T } & Partial<T>;

function unwrap<T>(raw: unknown): Partial<T> {
  const r = (raw ?? {}) as Wrapped<T>;
  return (r.data ?? r) as Partial<T>;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

export async function fetchCommissionTerms(): Promise<CommissionTerms> {
  const [me, policy] = await Promise.all([
    gatewayClient.get<unknown>('/producers/me').catch(() => null),
    gatewayClient.get<unknown>('/orders/public/policy', { fetchOptions: { cache: 'no-store' } }).catch(() => null),
  ]);
  const rate = unwrap<{ commissionRate: number }>(me).commissionRate;
  const p = unwrap<{ smallBasketThreshold: number; smallBasketFee: number }>(policy);
  return {
    commissionRate: typeof rate === 'number' && rate >= 0 ? rate : null,
    smallBasketThreshold: num(p.smallBasketThreshold),
    smallBasketFee: num(p.smallBasketFee),
  };
}
