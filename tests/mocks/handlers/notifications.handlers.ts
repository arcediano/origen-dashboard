import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3001/api/v1';

export const mockBackendNotifications = [
  {
    id: 'notif-1',
    eventType: 'NEW_ORDER',
    category: 'ORDER',
    title: 'Nuevo pedido recibido',
    body: 'Has recibido un nuevo pedido #1234',
    actionUrl: '/dashboard/pedidos/1234',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: {},
  },
  {
    id: 'notif-2',
    eventType: 'PRODUCT_APPROVED',
    category: 'PRODUCT',
    title: 'Producto aprobado',
    body: 'Tu producto "Queso Manchego" ha sido aprobado',
    actionUrl: '/dashboard/productos/456',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    metadata: {},
  },
];

export const notificationsHandlers = [
  // GET notifications — includes unreadOnly filtering
  http.get(`${BASE}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly');
    const items =
      unreadOnly === 'true'
        ? mockBackendNotifications.filter((n) => !n.isRead)
        : mockBackendNotifications;

    return HttpResponse.json({
      data: items,
      meta: {
        page: 1,
        limit: 50,
        total: items.length,
        totalPages: 1,
        unread: items.filter((n) => !n.isRead).length,
      },
    });
  }),

  // PATCH mark all as read — must be registered BEFORE the :id/read handler
  http.patch(`${BASE}/notifications/read-all`, () => {
    return HttpResponse.json({
      success: true,
      data: { updated: mockBackendNotifications.length },
    });
  }),

  // PATCH mark one notification as read
  http.patch(`${BASE}/notifications/:id/read`, ({ params }) => {
    const { id } = params as { id: string };
    const found = mockBackendNotifications.find((n) => n.id === id);
    if (!found) {
      return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: { ...found, isRead: true },
    });
  }),

  // GET unread count
  http.get(`${BASE}/notifications/unread-count`, () => {
    return HttpResponse.json({
      data: {
        count: mockBackendNotifications.filter((n) => !n.isRead).length,
      },
    });
  }),
];

// Override handler for the empty-notifications scenario
export const notificationsEmptyHandler = http.get(`${BASE}/notifications`, () => {
  return HttpResponse.json({
    data: [],
    meta: { page: 1, limit: 50, total: 0, totalPages: 0, unread: 0 },
  });
});

// Override handler for a server error
export const notificationsErrorHandler = http.get(`${BASE}/notifications`, () => {
  return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
});
