/**
 * Unit/integration tests for notifications API mapping and contract hardening.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { TEST_API_BASE } from '../../mocks/api-base';
import {
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  fetchNotificationPreferences,
  updateNotificationPreference,
} from '@/lib/api/notifications';

const BASE = TEST_API_BASE;

describe('notifications api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps backend notifications into canonical frontend shape', async () => {
    const result = await fetchNotifications({ page: 1, limit: 10 });

    expect(result.status).toBe(200);
    expect(result.data?.notifications.length).toBeGreaterThan(0);

    const first = result.data!.notifications[0];
    expect(first.id).toBeTypeOf('string');
    expect(first.eventType).toBeTypeOf('string');
    expect(first.timestamp).toBeInstanceOf(Date);
    expect(typeof first.read).toBe('boolean');
  });

  it('drops invalid payload items and keeps valid notifications', async () => {
    server.use(
      http.get(`${BASE}/notifications`, () => {
        return HttpResponse.json({
          data: [
            {
              id: 'valid-1',
              eventType: 'NEW_ORDER',
              category: 'ORDER',
              title: 'Valida',
              body: 'Payload valida',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              // Invalid item: missing required fields and bad createdAt
              id: 777,
              eventType: null,
              title: 'Invalida',
              body: 'Invalida',
              isRead: 'no',
              createdAt: 'not-a-date',
            },
          ],
          meta: { page: 1, limit: 50, total: 2, totalPages: 1, unread: 1 },
        });
      }),
    );

    const result = await fetchNotifications();
    expect(result.status).toBe(200);
    expect(result.data?.notifications).toHaveLength(1);
    expect(result.data?.notifications[0].id).toBe('valid-1');
  });

  it('loads unread notifications and returns status 200', async () => {
    const result = await fetchUnreadNotifications();

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('marks one notification as read', async () => {
    const result = await markNotificationAsRead('notif-1');
    expect(result.status).toBe(200);
  });

  it('marks all notifications as read', async () => {
    const result = await markAllNotificationsAsRead();
    expect(result.status).toBe(200);
    expect(result.data?.count).toBeGreaterThanOrEqual(0);
  });
});

describe('notification preferences api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads preferences and maps canonical shape', async () => {
    const result = await fetchNotificationPreferences();

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);

    const first = result.data![0];
    expect(first.userId).toBe(42);
    expect(typeof first.eventType).toBe('string');
    expect(typeof first.email).toBe('boolean');
    expect(typeof first.push).toBe('boolean');
    expect(typeof first.inApp).toBe('boolean');
    expect(first.updatedAt).toBeInstanceOf(Date);
  });

  it('normalises unknown frequency values to INSTANT', async () => {
    server.use(
      http.get(`${TEST_API_BASE}/notifications/preferences`, () => {
        return HttpResponse.json({
          userId: 1,
          preferences: [
            {
              eventType: 'NEW_ORDER',
              inApp: true,
              email: true,
              push: false,
              frequency: 'UNKNOWN_FREQ',
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      }),
    );

    const result = await fetchNotificationPreferences();
    expect(result.status).toBe(200);
    expect(result.data![0].frequency).toBe('INSTANT');
  });

  it('returns error when preferences endpoint fails', async () => {
    server.use(
      http.get(`${TEST_API_BASE}/notifications/preferences`, () => {
        return HttpResponse.json({ message: 'error' }, { status: 500 });
      }),
    );

    const result = await fetchNotificationPreferences();
    expect(result.status).toBe(500);
    expect(result.error).toBeDefined();
  });

  it('updates a preference channel and returns mapped result', async () => {
    const result = await updateNotificationPreference('NEW_ORDER', { email: false });

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data!.eventType).toBe('NEW_ORDER');
    expect(result.data!.email).toBe(false);
    expect(result.data!.updatedAt).toBeInstanceOf(Date);
  });

  it('returns error when update endpoint returns 404', async () => {
    const result = await updateNotificationPreference('NONEXISTENT_EVENT', { email: true });

    expect(result.status).toBe(500);
    expect(result.error).toBeDefined();
  });

  it('WEEKLY_DIGEST frequency is preserved', async () => {
    const result = await fetchNotificationPreferences();
    expect(result.status).toBe(200);

    const promo = result.data!.find((p) => p.eventType === 'PROMOTION_CREATED');
    expect(promo?.frequency).toBe('WEEKLY_DIGEST');
  });
});
