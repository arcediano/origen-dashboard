/**
 * @file notifications.ts
 * @description API del Notification Center â€” llamadas reales al gateway.
 * Sprint 10: reemplaza el mock en-memoria por fetch real.
 *
 * Mantiene compatibilidad con la interfaz `Notification` de @/types/notification
 * para no romper NotificationBell ni NotificationItem.
 */

import { gatewayClient } from './client';
import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationAction,
  NotificationActionType,
  NotificationStats,
  NotificationsResponse,
  NotificationPreference,
  NotificationFrequency,
} from '@/types/notification';
import type { ApiResponse } from './products';

// â”€â”€â”€ Tipos internos (forma real del backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BackendNotification {
  id: string;
  eventType: string;
  category?: string;
  priority?: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionType?: string;
  actionLabel?: string;
  actionResourceId?: string;
  isRead: boolean;
  readAt?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface BackendListResponse {
  data: BackendNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unread: number;
  };
}

const ALLOWED_ACTION_TYPES: NotificationActionType[] = [
  'OPEN_URL',
  'OPEN_ORDER',
  'OPEN_PRODUCT',
  'OPEN_REVIEW',
  'NONE',
];

function logNotificationApiEvent(level: 'info' | 'warn' | 'error', event: string, payload: Record<string, unknown>) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger('[notifications-api]', { event, ...payload });
}

function isValidBackendNotification(item: unknown): item is BackendNotification {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Partial<BackendNotification>;
  const hasRequiredStrings =
    typeof candidate.id === 'string' &&
    typeof candidate.eventType === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.body === 'string' &&
    typeof candidate.createdAt === 'string';

  if (!hasRequiredStrings || typeof candidate.isRead !== 'boolean') return false;

  const createdAt = candidate.createdAt;
  return typeof createdAt === 'string' && !Number.isNaN(new Date(createdAt).getTime());
}

function sanitizeBackendNotifications(data: unknown[], context: string): BackendNotification[] {
  const valid: BackendNotification[] = [];
  let dropped = 0;

  for (const item of data) {
    if (isValidBackendNotification(item)) {
      valid.push(item);
      continue;
    }
    dropped += 1;
  }

  if (dropped > 0) {
    logNotificationApiEvent('warn', 'invalid_payload_items_dropped', {
      context,
      dropped,
      received: data.length,
    });
  }

  return valid;
}

// â”€â”€â”€ Mappers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapPriority(raw?: string): NotificationPriority | undefined {
  const p = raw?.toUpperCase();
  if (p === 'LOW' || p === 'MEDIUM' || p === 'HIGH' || p === 'URGENT') return p;
  return undefined;
}

function mapCategory(eventType: string, category?: string): Notification['type'] {
  const cat = category?.toUpperCase() ?? '';
  if (cat === 'ORDER' || eventType.startsWith('ORDER') || eventType === 'NEW_ORDER') return 'order';
  if (cat === 'REVIEW' || eventType.startsWith('REVIEW') || eventType === 'NEW_REVIEW') return 'product';
  if (cat === 'PRODUCT' || eventType.startsWith('PRODUCT')) return 'product';
  if (cat === 'MARKETING' || eventType === 'PROMOTION_CREATED') return 'product';
  return 'system';
}

function mapCanonicalCategory(eventType: string, category?: string): NotificationCategory {
  const cat = category?.toUpperCase() ?? '';
  if (cat === 'ORDER' || eventType.startsWith('ORDER') || eventType === 'NEW_ORDER') return 'ORDER';
  if (cat === 'REVIEW' || eventType.startsWith('REVIEW') || eventType === 'NEW_REVIEW') return 'REVIEW';
  if (cat === 'PRODUCT' || eventType.startsWith('PRODUCT')) return 'PRODUCT';
  if (cat === 'MARKETING' || eventType === 'PROMOTION_CREATED') return 'MARKETING';
  if (cat === 'ACCOUNT' || eventType.startsWith('ACCOUNT') || eventType.startsWith('CERTIFICATION')) return 'ACCOUNT';
  return 'SYSTEM';
}

function mapAction(n: BackendNotification): NotificationAction | undefined {
  if (!n.actionUrl && !n.actionType) return undefined;
  const rawActionType = n.actionType?.toUpperCase();
  const type: NotificationActionType =
    rawActionType && ALLOWED_ACTION_TYPES.includes(rawActionType as NotificationActionType)
      ? (rawActionType as NotificationActionType)
      : 'OPEN_URL';
  return {
    type,
    label: n.actionLabel,
    url: n.actionUrl,
    resourceId: n.actionResourceId,
  };
}

function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    type: mapCategory(n.eventType, n.category),
    category: mapCanonicalCategory(n.eventType, n.category),
    priority: mapPriority(n.priority),
    eventType: n.eventType,
    title: n.title,
    description: n.body,
    timestamp: new Date(n.createdAt),
    read: n.isRead,
    readAt: n.readAt ? new Date(n.readAt) : undefined,
    archived: n.archived ?? false,
    archivedAt: n.archivedAt ? new Date(n.archivedAt) : undefined,
    actionUrl: n.actionUrl,
    action: mapAction(n),
    metadata: n.metadata,
  };
}

// â”€â”€â”€ API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Obtiene las notificaciones paginadas del usuario.
 */
export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}): Promise<ApiResponse<NotificationsResponse>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.read !== undefined) query.set('unreadOnly', params.read ? 'false' : 'true');
    const qs = query.toString();

    const res = await gatewayClient.get<BackendListResponse>(
      `/notifications${qs ? `?${qs}` : ''}`,
    );

    const backendItems = sanitizeBackendNotifications(res.data ?? [], 'fetchNotifications');
    const notifications = backendItems.map(mapBackendNotification);
    const meta = res.meta;
    const byType: Record<string, number> = {
      product: 0,
      order: 0,
      certification: 0,
      system: 0,
    };
    for (const n of notifications) {
      if (n.type in byType) {
        byType[n.type] = (byType[n.type] ?? 0) + 1;
      }
    }
    const stats: NotificationStats = {
      total: meta?.total ?? 0,
      unread: meta?.unread ?? 0,
      byType: byType as NotificationStats['byType'],
    };

    return {
      data: {
        notifications,
        stats,
        hasMore: meta ? meta.page * meta.limit < meta.total : false,
      },
      status: 200,
    };
  } catch (err) {
    console.error('[notifications] fetchNotifications', err);
    return { error: 'Error al cargar notificaciones', status: 500 };
  }
}

/**
 * Obtiene solo las notificaciones no leÃ­das (mÃ¡x. 50) para la campana.
 */
export async function fetchUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
  try {
    const res = await gatewayClient.get<BackendListResponse>(
      '/notifications?unreadOnly=true&limit=50',
    );
    const backendItems = sanitizeBackendNotifications(res.data ?? [], 'fetchUnreadNotifications');
    const notifications = backendItems.map(mapBackendNotification);
    logNotificationApiEvent('info', 'unread_notifications_loaded', {
      count: notifications.length,
    });
    return { data: notifications, status: 200 };
  } catch (err) {
    console.error('[notifications] fetchUnreadNotifications', err);
    return { error: 'Error al cargar notificaciones no leÃ­das', status: 500 };
  }
}

/**
 * Obtiene el contador de notificaciones no leÃ­das de forma eficiente.
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  try {
    const res = await gatewayClient.get<{ data: { count: number } }>(
      '/notifications/unread-count',
    );
    return { data: { count: res?.data?.count ?? 0 }, status: 200 };
  } catch (err) {
    console.error('[notifications] getUnreadCount', err);
    return { error: 'Error al obtener contador', status: 500 };
  }
}

/**
 * Marca una notificaciÃ³n como leÃ­da.
 */
export async function markNotificationAsRead(
  id: string,
): Promise<ApiResponse<Notification>> {
  try {
    const res = await gatewayClient.patch<{ success: boolean; data?: BackendNotification }>(
      `/notifications/${id}/read`,
      {},
    );
    const mapped = res?.data ? mapBackendNotification(res.data) : undefined;
    return { data: mapped, status: 200 };
  } catch (err) {
    console.error('[notifications] markNotificationAsRead', err);
    return { error: 'Error al marcar notificaciÃ³n', status: 500 };
  }
}

/**
 * Marca todas las notificaciones del usuario como leÃ­das.
 */
export async function markAllNotificationsAsRead(): Promise<
  ApiResponse<{ count: number }>
> {
  try {
    const res = await gatewayClient.patch<{ success: boolean; data?: { updated: number } }>(
      '/notifications/read-all',
      {},
    );
    return { data: { count: res?.data?.updated ?? 0 }, status: 200 };
  } catch (err) {
    console.error('[notifications] markAllNotificationsAsRead', err);
    return { error: 'Error al marcar todas las notificaciones', status: 500 };
  }
}

// ─── PREFERENCIAS ─────────────────────────────────────────────────────────────

export interface NotificationPreferencePayload {
  email?:     boolean;
  push?:      boolean;
  inApp?:     boolean;
  frequency?: NotificationFrequency;
}

interface BackendPreference {
  eventType:   string;
  inApp:       boolean;
  email:       boolean;
  push:        boolean;
  frequency:   string;
  mutedUntil?: string;
  updatedAt:   string;
}

function mapBackendPreference(raw: BackendPreference, userId: number): NotificationPreference {
  const freq = raw.frequency?.toUpperCase();
  const frequency: NotificationFrequency =
    freq === 'DAILY_DIGEST' || freq === 'WEEKLY_DIGEST' ? freq : 'INSTANT';
  return {
    userId,
    eventType: raw.eventType,
    inApp: raw.inApp ?? true,
    email: raw.email ?? false,
    push: raw.push ?? false,
    frequency,
    mutedUntil: raw.mutedUntil ? new Date(raw.mutedUntil) : undefined,
    updatedAt: new Date(raw.updatedAt),
  };
}

/**
 * Obtiene las preferencias de notificación del usuario autenticado.
 */
export async function fetchNotificationPreferences(): Promise<
  ApiResponse<NotificationPreference[]>
> {
  try {
    const res = await gatewayClient.get<{ userId: number; preferences: BackendPreference[] }>(
      '/notifications/preferences',
    );
    const userId = res?.userId ?? 0;
    const prefs = (res?.preferences ?? []).map((p) =>
      mapBackendPreference(p, userId),
    );
    logNotificationApiEvent('info', 'preferences_loaded', { count: prefs.length });
    return { data: prefs, status: 200 };
  } catch (err) {
    console.error('[notifications] fetchNotificationPreferences', err);
    return { error: 'Error al cargar preferencias de notificacion', status: 500 };
  }
}

/**
 * Actualiza los canales habilitados para un tipo de evento concreto.
 */
export async function updateNotificationPreference(
  eventType: string,
  payload: NotificationPreferencePayload,
): Promise<ApiResponse<NotificationPreference>> {
  try {
    const res = await gatewayClient.patch<{
      success: boolean;
      data?: BackendPreference & { userId: number };
    }>(`/notifications/preferences/${encodeURIComponent(eventType)}`, payload);

    if (!res?.data) {
      return { error: 'Respuesta inesperada del servidor', status: 500 };
    }

    const pref = mapBackendPreference(res.data, res.data.userId ?? 0);
    logNotificationApiEvent('info', 'preference_updated', { eventType });
    return { data: pref, status: 200 };
  } catch (err) {
    console.error('[notifications] updateNotificationPreference', err);
    return { error: 'Error al actualizar preferencia', status: 500 };
  }
}
