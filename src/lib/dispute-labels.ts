import type {
  DisputeReason,
  DisputeSenderType,
  DisputeStatus,
  DisputeVerdict,
} from '@/lib/api/disputes';

/** Textos legibles (nunca se muestran las keys del backend). */
export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: 'Nueva',
  UNDER_REVIEW: 'En revisión',
  AWAITING_BUYER: 'Esperando al comprador',
  AWAITING_PRODUCER: 'Esperando tu respuesta',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

export const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = {
  PRODUCT_NOT_RECEIVED: 'Producto no recibido',
  PRODUCT_DAMAGED: 'Producto dañado',
  WRONG_PRODUCT: 'Producto incorrecto',
  QUALITY_ISSUE: 'Problema de calidad',
  OTHER: 'Otro motivo',
};

export const DISPUTE_VERDICT_LABEL: Record<DisputeVerdict, string> = {
  BUYER_WINS: 'A favor del comprador (reembolso total)',
  PRODUCER_WINS: 'A favor del productor (sin reembolso)',
  SPLIT: 'Decisión compartida (reembolso parcial)',
  CANCELLED: 'Disputa cancelada',
};

export const DISPUTE_SENDER_LABEL: Record<DisputeSenderType, string> = {
  ADMIN: 'Equipo de Origen',
  BUYER: 'Comprador',
  PRODUCER: 'Tú',
};

export const isDisputeClosed = (status: DisputeStatus) =>
  status === 'RESOLVED' || status === 'CLOSED';
