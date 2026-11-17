import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TEST_API_BASE } from '../../../mocks/api-base';
import { OrderDisputeSection } from '@/components/orders/OrderDisputeSection';

const BASE = TEST_API_BASE;
const dispute = {
  id: 'd1',
  orderId: 'o1',
  reason: 'PRODUCT_DAMAGED',
  description: 'Llegó roto',
  status: 'AWAITING_PRODUCER',
  verdict: null,
  verdictNote: null,
  refundAmount: null,
  createdAt: '2026-11-04T10:00:00Z',
  updatedAt: '2026-11-04T10:00:00Z',
  messages: [
    { id: 'm1', disputeId: 'd1', senderType: 'ADMIN', senderId: '2', content: 'Envíanos fotos', attachments: [], createdAt: '2026-11-05T10:00:00Z' },
    { id: 'm2', disputeId: 'd1', senderType: 'PRODUCER', senderId: '44', content: 'Ahora las subo', attachments: [], createdAt: '2026-11-05T11:00:00Z' },
  ],
};

describe('OrderDisputeSection', () => {
  it('no pinta nada si el pedido no tiene disputa', async () => {
    server.use(http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([])));
    const { container } = render(<OrderDisputeSection orderId="o1" />);
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra estado y motivo legibles, y el hilo con autores', async () => {
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([dispute])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(dispute)),
    );
    render(<OrderDisputeSection orderId="o1" />);
    expect(await screen.findByText('Esperando tu respuesta')).toBeInTheDocument();
    expect(screen.getByText(/Producto dañado/)).toBeInTheDocument();
    expect(screen.getByText('Equipo de Origen')).toBeInTheDocument();
    expect(screen.getByText('Tú')).toBeInTheDocument();
    expect(screen.queryByText('AWAITING_PRODUCER')).toBeNull();
  });

  it('permite responder y refresca el hilo', async () => {
    let sent: unknown = null;
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([dispute])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(dispute)),
      http.post(`${BASE}/disputes/d1/messages`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: 'm3' }, { status: 201 });
      }),
      http.get(`${BASE}/disputes/d1/messages`, () =>
        HttpResponse.json([...dispute.messages, { id: 'm3', disputeId: 'd1', senderType: 'PRODUCER', senderId: '44', content: 'Fotos enviadas', attachments: [], createdAt: '2026-11-06T10:00:00Z' }]),
      ),
    );
    render(<OrderDisputeSection orderId="o1" />);
    await userEvent.type(await screen.findByLabelText('Respuesta a la disputa'), 'Fotos enviadas');
    await userEvent.click(screen.getByRole('button', { name: /Enviar respuesta/ }));
    await waitFor(() => expect(sent).toEqual({ content: 'Fotos enviadas' }));
    expect(await screen.findByText('Fotos enviadas', { selector: 'p' })).toBeInTheDocument();
  });

  it('resuelta: muestra la resolución y no deja escribir', async () => {
    const resolved = { ...dispute, status: 'RESOLVED', verdict: 'BUYER_WINS', refundAmount: 7.9, verdictNote: 'Reembolso total' };
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([resolved])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(resolved)),
    );
    render(<OrderDisputeSection orderId="o1" />);
    expect(await screen.findByTestId('dispute-verdict')).toHaveTextContent('A favor del comprador');
    expect(screen.queryByLabelText('Respuesta a la disputa')).toBeNull();
  });
});
