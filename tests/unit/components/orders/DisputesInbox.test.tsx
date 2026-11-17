import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TEST_API_BASE } from '../../../mocks/api-base';
import { DisputesInbox } from '@/components/orders/DisputesInbox';

const BASE = TEST_API_BASE;
const mk = (id: string, orderId: string, reason: string, status: string, updatedAt: string) => ({
  id, orderId, reason, description: 'Llegó roto', status, verdict: null, verdictNote: null, refundAmount: null,
  createdAt: '2026-11-04T10:00:00Z', updatedAt,
  messages: [{ id: `m-${id}`, disputeId: id, senderType: 'ADMIN', senderId: '2', content: `Mensaje de ${id}`, attachments: [], createdAt: '2026-11-05T10:00:00Z' }],
});

describe('DisputesInbox', () => {
  it('muestra el estado vacío si no hay disputas', async () => {
    server.use(http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([])));
    const { container } = render(<DisputesInbox />);
    await waitFor(() => expect(container.querySelector('[title="No tienes disputas"]')).not.toBeNull());
  });

  it('lista las disputas y abre la conversación al elegir una', async () => {
    const a = mk('d1', 'o1', 'PRODUCT_DAMAGED', 'AWAITING_PRODUCER', '2026-11-06T10:00:00Z');
    const b = mk('d2', 'o2', 'QUALITY_ISSUE', 'UNDER_REVIEW', '2026-11-05T10:00:00Z');
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([b, a])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(a)),
      http.get(`${BASE}/disputes/d2`, () => HttpResponse.json(b)),
    );
    render(<DisputesInbox />);
    const items = await screen.findAllByRole('button', { name: /Abierta el/ });
    expect(items).toHaveLength(2);
    // la de actividad más reciente (d1) va primero
    expect(items[0]).toHaveTextContent('Producto dañado');
    await userEvent.click(items[1]);
    await waitFor(() => expect(screen.getByText('Mensaje de d2')).toBeInTheDocument());
  });
});
