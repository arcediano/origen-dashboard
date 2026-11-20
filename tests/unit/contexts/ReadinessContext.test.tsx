import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

const getMyReadiness = vi.fn();
vi.mock('@/lib/api/onboarding', () => ({ getMyReadiness: () => getMyReadiness() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { role: 'PRODUCER' } }) }));

import { ReadinessProvider, useReadiness } from '@/contexts/ReadinessContext';

function Probe() {
  const { readiness } = useReadiness();
  return <p data-testid="status">{readiness?.payment.status ?? 'sin datos'}</p>;
}

const report = (status: string) => ({ payment: { status, requirementsDue: [], deadline: null }, blockers: [] });

describe('ReadinessProvider — estado de cobros', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getMyReadiness.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('se actualiza al recuperar el foco (p. ej. tras activarse Stripe) pero no más de una vez cada 30 s', async () => {
    getMyReadiness.mockResolvedValueOnce(report('PENDING_VERIFICATION')).mockResolvedValue(report('OK'));
    render(<ReadinessProvider><Probe /></ReadinessProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('PENDING_VERIFICATION'));

    // Menos de 30 s después: no vuelve a pedirlo
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(getMyReadiness).toHaveBeenCalledTimes(1);

    // Pasados 30 s sí
    act(() => { vi.advanceTimersByTime(31_000); });
    act(() => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('OK'));
    expect(getMyReadiness).toHaveBeenCalledTimes(2);
  });
});
