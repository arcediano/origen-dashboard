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
  | 'ORDER_CANCELLED'
  | 'NEW_REVIEW'
  | 'PRODUCT_LOW_STOCK'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'ACCOUNT_VERIFIED'
  | 'CERTIFICATION_PENDING'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_ALERT'
  | 'PROMOTION_CREATED'
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
  /** Tipo legacy — derivado de category para compatibilidad con componentes existentes */
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  /** @deprecated Usar action.url — mantenido por compatibilidad */
  actionUrl?: string;
  metadata?: Record<string, unknown>;

  // ─── Campos canonicos (Sprint 22+) ───────────────────────────────────────
  category?: NotificationCategory;
  priority?: NotificationPriority;
  eventType?: NotificationEventType;
  action?: NotificationAction;
  archived?: boolean;
  archivedAt?: Date;
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

export interface NotificationPageInfo {
  nextCursor?: string;
  hasNextPage: boolean;
  totalUnread: number;
}

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
  nextCursor?: string;
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
