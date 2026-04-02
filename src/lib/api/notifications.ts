/**
 * @file notifications.ts
 * @description API del Notification Center â€” llamadas reales al gateway.
 * Sprint 10: reemplaza el mock en-memoria por fetch real.
 *
 * Mantiene compatibilidad con la interfaz `Notification` de @/types/notification
 * para no romper NotificationBell ni NotificationItem.
 */

import { gatewayClient } from './client';
import type { Notification, NotificationStats, NotificationsResponse } from '@/types/notification';
import type { ApiResponse } from './products';

// â”€â”€â”€ Tipos internos (forma real del backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BackendNotification {
  id: string;
  eventType: string;
  category?: string;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
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

// â”€â”€â”€ Mappers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapCategory(eventType: string, category?: string): Notification['type'] {
  const cat = category?.toUpperCase() ?? '';
  if (cat === 'ORDER' || eventType.startsWith('ORDER') || eventType === 'NEW_ORDER') return 'order';
  if (
    cat === 'REVIEW' ||
    eventType.startsWith('REVIEW') ||
    eventType === 'NEW_REVIEW'
  ) {
    return 'product';
  }
  if (cat === 'PRODUCT' || eventType.startsWith('PRODUCT')) return 'product';
  if (
    cat === 'MARKETING' ||
    eventType === 'PROMOTION_CREATED' ||
    eventType === 'CAMPAIGN'
  ) {
    return 'product';
  }
  return 'system';
}

function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    type: mapCategory(n.eventType, n.category),
    title: n.title,
    description: n.body,
    timestamp: new Date(n.createdAt),
    read: n.isRead,
    actionUrl: n.actionUrl,
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

    const notifications = (res.data ?? []).map(mapBackendNotification);
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
    const notifications = (res.data ?? []).map(mapBackendNotification);
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

