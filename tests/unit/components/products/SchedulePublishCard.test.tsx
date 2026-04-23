/**
 * @file SchedulePublishCard.test.tsx
 * @description Tests unitarios para el componente SchedulePublishCard.
 *
 * Verifica:
 * - Renderiza el input datetime-local con el valor existente si se pasa currentScheduledAt
 * - Botón "Programar" deshabilitado cuando no hay fecha seleccionada
 * - Llamada a scheduleProduct con la fecha correcta al hacer submit
 * - Muestra mensaje de éxito tras programar correctamente
 * - Muestra toast de error cuando la API falla
 * - Muestra aviso de fecha ya programada cuando currentScheduledAt está presente
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulePublishCard } from '@/app/dashboard/products/components/SchedulePublishCard';
import * as productsApi from '@/lib/api/products';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockToast = vi.fn();

vi.mock('@arcediano/ux-library', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    loading,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled || loading} data-testid="schedule-btn">
      {children}
    </button>
  ),
  toast: (args: unknown) => mockToast(args),
}));

vi.mock('lucide-react', () => ({
  CalendarClock: () => <span data-testid="calendar-icon" />,
  CheckCircle2:  () => <span data-testid="check-icon" />,
  AlertCircle:   () => <span data-testid="alert-icon" />,
}));

vi.mock('@/lib/api/products', () => ({
  scheduleProduct: vi.fn(),
}));

const mockScheduleProduct = vi.mocked(productsApi.scheduleProduct);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function futureDatetimeLocal(daysFromNow = 1): string {
  const d = new Date(Date.now() + daysFromNow * 86400_000);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SchedulePublishCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el encabezado con el título', () => {
    render(<SchedulePublishCard productId="prod-001" />);
    expect(screen.getByText('Programar publicación')).toBeDefined();
  });

  it('el botón está deshabilitado cuando no hay fecha seleccionada', () => {
    render(<SchedulePublishCard productId="prod-001" />);
    const btn = screen.getByTestId('schedule-btn');
    expect(btn).toHaveProperty('disabled', true);
  });

  it('muestra la fecha ya programada cuando currentScheduledAt está presente', () => {
    const isoDate = new Date(Date.now() + 3 * 86400_000).toISOString();
    render(<SchedulePublishCard productId="prod-001" currentScheduledAt={isoDate} />);
    expect(screen.getByText(/Programado para/)).toBeDefined();
  });

  it('llama a scheduleProduct con el productId y la fecha correctos al hacer click', async () => {
    mockScheduleProduct.mockResolvedValueOnce({
      data: { id: 'prod-001', status: 'SCHEDULED', scheduledAt: futureDatetimeLocal() + ':00.000Z' },
      status: 200,
    });

    render(<SchedulePublishCard productId="prod-001" />);

    const input = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(input, { target: { value: futureDatetimeLocal(2) } });

    const btn = screen.getByTestId('schedule-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockScheduleProduct).toHaveBeenCalledTimes(1);
      expect(mockScheduleProduct).toHaveBeenCalledWith(
        'prod-001',
        expect.any(Date),
      );
    });
  });

  it('muestra el mensaje de éxito tras programar correctamente', async () => {
    mockScheduleProduct.mockResolvedValueOnce({
      data: { id: 'prod-001', status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 86400_000).toISOString() },
      status: 200,
    });

    render(<SchedulePublishCard productId="prod-001" />);

    const input = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(input, { target: { value: futureDatetimeLocal(2) } });

    fireEvent.click(screen.getByTestId('schedule-btn'));

    await waitFor(() => {
      expect(screen.getByText('Publicación programada correctamente')).toBeDefined();
    });
  });

  it('llama a toast con variant error cuando la API devuelve un error', async () => {
    mockScheduleProduct.mockResolvedValueOnce({
      error: 'Error del servidor',
      status: 500,
    });

    render(<SchedulePublishCard productId="prod-001" />);

    const input = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(input, { target: { value: futureDatetimeLocal(2) } });

    fireEvent.click(screen.getByTestId('schedule-btn'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });

  it('muestra toast de error si la fecha introducida es pasada', async () => {
    render(<SchedulePublishCard productId="prod-001" />);

    const input = screen.getByDisplayValue('') as HTMLInputElement;
    // Fecha en el pasado
    const pastDate = new Date(Date.now() - 60_000).toISOString().slice(0, 16);
    fireEvent.change(input, { target: { value: pastDate } });

    fireEvent.click(screen.getByTestId('schedule-btn'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
      expect(mockScheduleProduct).not.toHaveBeenCalled();
    });
  });
});
