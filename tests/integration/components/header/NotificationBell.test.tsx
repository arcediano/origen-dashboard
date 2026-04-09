/**
 * Integration tests for NotificationBell and NotificationItem.
 *
 * Uses MSW (configured in tests/mocks/server.ts) to intercept real fetch
 * calls made by gatewayClient, so no module-level mocking of the API layer
 * is needed. Each test reflects real runtime behavior.
 *
 * Covers:
 *  - Badge shows the real unread count from the API
 *  - markNotificationAsRead is called when a notification is clicked
 *  - External / unsafe URLs are blocked (NotificationItem renders a <button>)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { render } from '../../../helpers/render';
import { server } from '../../../mocks/server';
import {
  notificationsEmptyHandler,
  notificationsErrorHandler,
  mockBackendNotifications,
} from '../../../mocks/handlers/notifications.handlers';
import { TEST_API_BASE } from '../../../mocks/api-base';
import { NotificationBell } from '@/app/dashboard/components/header/NotificationBell';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';
import type { Notification } from '@/types/notification';

// next/navigation is not used by NotificationBell directly, but Link may pull
// it in via next internals — mock it to avoid "invariant" errors in happy-dom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// ---------------------------------------------------------------------------
// NotificationBell — integration tests
// ---------------------------------------------------------------------------

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra badge con el contador real de notificaciones no leídas', async () => {
    // Both mock notifications are isRead:false → unreadCount should be 2
    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones (2)');
    expect(bell).toBeDefined();
  });

  it('abre el desplegable con las notificaciones al hacer click en la campana', async () => {
    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones (2)');
    fireEvent.click(bell);

    expect(await screen.findByText('Nuevo pedido recibido')).toBeDefined();
    expect(screen.getByText('Producto aprobado')).toBeDefined();

    const viewAllLink = screen.getByRole('link', { name: /ver todas las notificaciones/i });
    expect(viewAllLink.getAttribute('href')).toBe('/dashboard/notifications');
  });

  it('elimina la notificación del listado (update optimista) al hacer click en ella', async () => {
    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones (2)');
    fireEvent.click(bell);

    const item = await screen.findByText('Nuevo pedido recibido');
    fireEvent.click(item);

    // Optimistic update removes it from the list immediately
    await waitFor(() => {
      expect(screen.queryByText('Nuevo pedido recibido')).toBeNull();
    });
  });

  it('llama markNotificationAsRead al hacer click en una notificación no leída', async () => {
    // Track the PATCH /notifications/:id/read call via MSW
    let capturedId: string | undefined;
    server.use(
      http.patch(`${TEST_API_BASE}/notifications/:id/read`, ({ params }) => {
        capturedId = params.id as string;
        return HttpResponse.json({
          success: true,
          data: { ...mockBackendNotifications[0], isRead: true },
        });
      }),
    );

    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones (2)');
    fireEvent.click(bell);

    const item = await screen.findByText('Nuevo pedido recibido');
    fireEvent.click(item);

    await waitFor(() => {
      expect(capturedId).toBe('notif-1');
    });
  });

  it('vacía la lista al hacer click en "Marcar todas"', async () => {
    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones (2)');
    fireEvent.click(bell);

    const markAll = await screen.findByText('Marcar todas');
    fireEvent.click(markAll);

    // Dropdown closes and all notifications are removed optimistically
    await waitFor(() => {
      expect(screen.queryByText('Nuevo pedido recibido')).toBeNull();
      expect(screen.queryByText('Producto aprobado')).toBeNull();
    });
  });

  it('muestra estado vacío cuando la API no devuelve notificaciones', async () => {
    server.use(notificationsEmptyHandler);

    render(<NotificationBell />);

    // No unread → label without count
    const bell = await screen.findByLabelText('Notificaciones');
    fireEvent.click(bell);

    expect(await screen.findByText('¡Todo al día!')).toBeDefined();
  });

  it('muestra estado de error con botón de reintento cuando la API falla', async () => {
    server.use(notificationsErrorHandler);

    render(<NotificationBell />);

    const bell = await screen.findByLabelText('Notificaciones');
    fireEvent.click(bell);

    expect(await screen.findByText('No se pudieron cargar')).toBeDefined();
    expect(screen.getByText('Reintentar')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// NotificationItem — security / URL sanitization unit tests
// ---------------------------------------------------------------------------

const baseNotification: Notification = {
  id: 'test-1',
  type: 'order',
  title: 'Notificación de prueba',
  description: 'Descripción de prueba',
  timestamp: new Date(),
  read: false,
};

describe('NotificationItem — seguridad de URLs de acción', () => {
  it('renderiza como botón principal y navega por click completo cuando la URL interna es válida', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, actionUrl: '/dashboard/pedidos/123' }}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: /notificación de prueba/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /marcar como leida/i })).toBeNull();
  });

  it('bloquea URLs https:// externas y renderiza un <button> en su lugar', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, actionUrl: 'https://malicious.example/phishing' }}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: /notificación de prueba/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /marcar como leida/i })).toBeDefined();
  });

  it('bloquea rutas de red (//) y renderiza un <button>', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, actionUrl: '//evil.com/steal-cookie' }}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: /notificación de prueba/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /marcar como leida/i })).toBeDefined();
  });

  it('bloquea el protocolo javascript: y renderiza un <button>', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, actionUrl: 'javascript:alert(document.cookie)' }}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: /notificación de prueba/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /marcar como leida/i })).toBeDefined();
  });

  it('renderiza un <button> cuando no hay actionUrl', () => {
    render(<NotificationItem notification={baseNotification} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: /notificación de prueba/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /marcar como leida/i })).toBeDefined();
  });

  it('llama onMarkAsRead con el id cuando se hace click en una notificación no leída', () => {
    const onMarkAsRead = vi.fn();
    render(
      <NotificationItem
        notification={{ ...baseNotification, actionUrl: '/dashboard/pedidos/123' }}
        onMarkAsRead={onMarkAsRead}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /notificación de prueba/i }));
    expect(onMarkAsRead).toHaveBeenCalledWith('test-1');
  });

  it('no llama onMarkAsRead cuando la notificación ya está leída', () => {
    const onMarkAsRead = vi.fn();
    render(
      <NotificationItem
        notification={{ ...baseNotification, read: true, actionUrl: '/dashboard/pedidos/123' }}
        onMarkAsRead={onMarkAsRead}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /notificación de prueba/i }));
    expect(onMarkAsRead).not.toHaveBeenCalled();
  });
});
