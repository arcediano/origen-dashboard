/**
 * @file NotificationsPreferencesPanel.test.tsx
 * @description Tests para el panel de preferencias de notificaciones.
 * Cubre:
 *   - Render de los 3 grupos nuevos (PAYMENT_ACCOUNT_*, CERTIFICATION_PENDING, PROMOTION_CREATED)
 *   - Estado inicial checked=true para toggle de email cuando no hay fila de preferencia
 *   - Al desactivar el toggle se llama a updateNotificationPreference
 *   - Verifica que el default de email sea true (F2 fix)
 *
 * Utiliza MSW para mockear `GET /notifications/preferences` y `PATCH /notifications/preferences/{eventType}`
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { NotificationsPreferencesPanel } from '@/app/dashboard/notifications/components/NotificationsPreferencesPanel';
import { TEST_API_BASE } from '../../../mocks/api-base';

// ─── Mock API Handlers ────────────────────────────────────────────────────────

// Preferencias vacías por defecto: usuario sin preferencias explícitas.
// El componente debería mostrar defaults (email: true, push: false).
// gatewayClient antepone siempre /api/v1 (ver src/lib/api/client.ts) -- las
// rutas sin ese prefijo nunca intersectaban la petición real.
const mockPreferencesHandlers = [
  http.get(`${TEST_API_BASE}/notifications/preferences`, () => {
    return HttpResponse.json([]);
  }),

  http.patch(`${TEST_API_BASE}/notifications/preferences/:eventType`, async ({ params }) => {
    const { eventType } = params;
    return HttpResponse.json(
      { eventType, email: false, inApp: true, push: false },
      { status: 200 },
    );
  }),
];

const server = setupServer(...mockPreferencesHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('NotificationsPreferencesPanel — P4/P5', () => {
  it('debe renderizar el grupo "Cuenta y Productor" con los 3 nuevos eventos', async () => {
    render(<NotificationsPreferencesPanel />);

    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    // Verificar que el grupo "Cuenta y Productor" aparece
    const accountGroup = screen.getByText('Cuenta y Productor');
    expect(accountGroup).toBeInTheDocument();

    // Verificar los 3 eventos nuevos en el grupo account
    expect(screen.getByText('Tu cuenta de pagos necesita atención')).toBeInTheDocument();
    expect(screen.getByText('Cobros pausados')).toBeInTheDocument();
    expect(screen.getByText('Certificación en revisión')).toBeInTheDocument();
  });

  it('debe renderizar el grupo "Marketing" con PROMOTION_CREATED', async () => {
    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    // Verificar grupo marketing
    const marketingGroup = screen.getByText('Marketing');
    expect(marketingGroup).toBeInTheDocument();

    // Verificar evento PROMOTION_CREATED
    expect(screen.getByText('Tu campaña está activa')).toBeInTheDocument();
  });

  it('debe mostrar email toggle como checked=true por defecto para eventos sin preferencia explícita (F2 fix)', async () => {
    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    // Buscar los toggles de email para los eventos nuevos
    // El componente usa NotificationToggleRow que incluye un toggle de email.
    // Toggle de @arcediano/ux-library es un <button aria-pressed>, no un
    // role="checkbox" -- toBeChecked() no aplica a ese patrón ARIA.
    const paymentActionRow = screen.getByText('Tu cuenta de pagos necesita atención').closest('div.py-4') as HTMLElement | null;
    const emailToggle = within(paymentActionRow!).getByRole('button', { name: /email/i });

    // Sin preferencia explícita, el default debería ser checked (email: true)
    expect(emailToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('debe llamar updateNotificationPreference cuando se desactiva el toggle de email', async () => {
    const user = userEvent.setup();
    let patchCalled = false;
    let patchEventType = '';

    server.use(
      http.patch(`${TEST_API_BASE}/notifications/preferences/:eventType`, async ({ params }) => {
        patchCalled = true;
        patchEventType = params.eventType as string;
        return HttpResponse.json(
          { eventType: params.eventType, email: false, inApp: true, push: false },
          { status: 200 },
        );
      }),
    );

    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    // Encontrar el toggle de email para PROMOTION_CREATED
    const promotionRow = screen.getByText('Tu campaña está activa').closest('div.py-4') as HTMLElement | null;
    const emailToggle = within(promotionRow!).getByRole('button', { name: /email/i });

    // Desactivar el toggle
    await user.click(emailToggle);

    // Esperar a que se haya llamado al endpoint
    await waitFor(() => {
      expect(patchCalled).toBe(true);
      expect(patchEventType).toBe('PROMOTION_CREATED');
    });
  });

  it('debe revertir los cambios si la llamada a updateNotificationPreference falla', async () => {
    const user = userEvent.setup();

    server.use(
      http.patch(`${TEST_API_BASE}/notifications/preferences/:eventType`, () => {
        return HttpResponse.json(
          { error: 'Failed to update' },
          { status: 500 },
        );
      }),
    );

    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    const certRow = screen.getByText('Certificación en revisión').closest('div.py-4') as HTMLElement | null;
    const emailToggle = within(certRow!).getByRole('button', { name: /email/i });

    // Toggle debería estar pressed (default email: true)
    expect(emailToggle).toHaveAttribute('aria-pressed', 'true');

    // Intentar desactivar
    await user.click(emailToggle);

    // Esperar un poco para que intente actualizar
    await waitFor(() => {
      // Debería revertir a pressed (true)
      expect(emailToggle).toHaveAttribute('aria-pressed', 'true');
    }, { timeout: 2000 });
  });

  it('PAYMENT_ACCOUNT_RESTRICTED debe mostrar email toggle checked por defecto', async () => {
    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    const restrictedRow = screen.getByText('Cobros pausados').closest('div.py-4') as HTMLElement | null;
    const emailToggle = within(restrictedRow!).getByRole('button', { name: /email/i });

    expect(emailToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('PAYMENT_ACCOUNT_ACTION_REQUIRED debe mostrar email toggle checked por defecto', async () => {
    render(<NotificationsPreferencesPanel />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando preferencias')).not.toBeInTheDocument();
    });

    const actionRow = screen.getByText('Tu cuenta de pagos necesita atención').closest('div.py-4') as HTMLElement | null;
    const emailToggle = within(actionRow!).getByRole('button', { name: /email/i });

    expect(emailToggle).toHaveAttribute('aria-pressed', 'true');
  });
});
