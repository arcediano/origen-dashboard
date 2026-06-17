/**
 * @file notification.ts
 * @description Tipos canonicos para el sistema de notificaciones.
 * US-DASH-2202 — contrato funcional aprobado en Sprint 22.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

/** Tipo legacy — mantenido por compatibilidad; preferir NotificationCategory */
export type NotificationType = 'product' | 'order' | 'certification' | 'system';

export type NotificationCategory =
  | 'ORDER'
  | 'PRODUCT'
  | 'REVIEW'
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'MARKETING';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationActionType =
  | 'OPEN_URL'
  | 'OPEN_ORDER'
  | 'OPEN_PRODUCT'
  | 'OPEN_REVIEW'
  | 'NONE';

export type NotificationEventType =
  | 'NEW_ORDER'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'NEW_REVIEW'
  | 'REVIEW_REPLY'
  | 'PRODUCT_LOW_STOCK'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'ACCOUNT_VERIFIED'
  | 'ACCOUNT_SUSPENDED'
  | 'PASSWORD_CHANGED'
  | 'PRODUCER_REQUEST_RECEIVED'
  | 'PRODUCER_REQUEST_APPROVED'
  | 'PRODUCER_REQUEST_REJECTED'
  | 'ONBOARDING_COMPLETED'
  | 'PROFILE_UNDER_REVIEW'
  | 'PROFILE_ACTIVATED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_EXPIRING_SOON'
  | 'ONBOARDING_REMINDER'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_ALERT'
  | 'PROMOTION_CREATED'
  | 'WELCOME'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_ASSIGNED'
  | 'DISPUTE_MESSAGE'
  | 'DISPUTE_STATUS_CHANGED'
  | 'DISPUTE_RESOLVED'
  | string;

// ─── ACTION ───────────────────────────────────────────────────────────────────

export interface NotificationAction {
  type: NotificationActionType;
  label?: string;
  /** Ruta interna del dashboard (e.g. /dashboard/orders/123) */
  url?: string;
  resourceId?: string;
}

// ─── ENTIDAD PRINCIPAL ────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  /** @deprecated Usar eventType — tipo legacy mantenido por compatibilidad */
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  /** @deprecated Usar action.url — mantenido por compatibilidad */
  actionUrl?: string;
  metadata?: Record<string, unknown>;

  // ─── Campos canonicos (Sprint 22+) ───────────────────────────────────────
  category: NotificationCategory;
  priority?: NotificationPriority;
  eventType: NotificationEventType;
  action?: NotificationAction;
  readAt?: Date;
}

// ─── PREFERENCIAS ─────────────────────────────────────────────────────────────

export type NotificationFrequency = 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';

export interface NotificationPreference {
  userId: number;
  eventType: NotificationEventType;
  inApp: boolean;
  email: boolean;
  push: boolean;
  frequency: NotificationFrequency;
  mutedUntil?: Date;
  updatedAt: Date;
}

// ─── PAGINACION ───────────────────────────────────────────────────────────────

// ─── AUXILIARES ───────────────────────────────────────────────────────────────

export interface NotificationGroup {
  type: NotificationType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  stats: NotificationStats;
  hasMore: boolean;
}

// ─── MAPPERS DE PRIORIDAD ─────────────────────────────────────────────────────

/** Prioridades P1 (bloqueos críticos de negocio) */
export const PRIORITY_P1_EVENTS: NotificationEventType[] = [
  'SYSTEM_ALERT',
  'ORDER_CANCELLED',
];

/** Prioridades P2 (operativas — requieren acción próxima) */
export const PRIORITY_P2_EVENTS: NotificationEventType[] = [
  'NEW_ORDER',
  'ORDER_STATUS_CHANGED',
  'PRODUCT_LOW_STOCK',
];
