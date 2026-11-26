import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TEST_API_BASE } from '../../../mocks/api-base';
import { DisputeDetail } from '@/components/orders/DisputeDetail';
import { OrderDisputeLink } from '@/components/orders/OrderDisputeLink';

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

describe('DisputeDetail', () => {
  beforeEach(() => {
    server.use(http.get(`${BASE}/disputes/d1/messages`, () => HttpResponse.json(dispute.messages)));
  });

  it('muestra estado y motivo legibles, y el hilo con autores', async () => {
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([dispute])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(dispute)),
    );
    render(<DisputeDetail dispute={dispute as never} />);
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
    render(<DisputeDetail dispute={dispute as never} />);
    await userEvent.type(await screen.findByLabelText('Respuesta a la disputa'), 'Fotos enviadas');
    await userEvent.click(screen.getByRole('button', { name: /Enviar respuesta/ }));
    await waitFor(() => expect(sent).toEqual({ content: 'Fotos enviadas' }));
    expect(await screen.findByText('Fotos enviadas', { selector: 'p' })).toBeInTheDocument();
  });

  it('distingue comprador, productor y equipo de Origen aunque el comprador escribiera con rol de productor', async () => {
    const mixed = {
      ...dispute,
      buyerUserId: '10',
      producerId: '44',
      messages: [
        { id: 'a', disputeId: 'd1', senderType: 'PRODUCER', senderId: '10', content: 'Llegó roto', attachments: [], createdAt: '2026-11-05T09:00:00Z' },
        { id: 'b', disputeId: 'd1', senderType: 'PRODUCER', senderId: '44', content: 'Lo reviso', attachments: [], createdAt: '2026-11-05T10:00:00Z' },
        { id: 'c', disputeId: 'd1', senderType: 'ADMIN', senderId: '2', content: 'Gracias a ambos', attachments: [], createdAt: '2026-11-05T11:00:00Z' },
      ],
    };
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([mixed])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(mixed)),
      http.get(`${BASE}/disputes/d1/messages`, () => HttpResponse.json(mixed.messages)),
    );
    const { container } = render(<DisputeDetail dispute={mixed as never} />);
    await screen.findByText('Gracias a ambos');
    const roles = Array.from(container.querySelectorAll('[data-role]')).map((el) => el.getAttribute('data-role'));
    expect(roles).toEqual(['BUYER', 'PRODUCER', 'ADMIN']);
  });

  it('los adjuntos se muestran como enlaces de descarga con el nombre del archivo', async () => {
    const withFile = {
      ...dispute,
      messages: [
        { ...dispute.messages[0], attachments: ['https://cdn.origen.test/disputes/foto%20caja.jpg?sig=abc'] },
      ],
    };
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([withFile])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(withFile)),
      http.get(`${BASE}/disputes/d1/messages`, () => HttpResponse.json(withFile.messages)),
    );
    render(<DisputeDetail dispute={withFile as never} />);
    const link = await screen.findByRole('link', { name: /foto caja\.jpg/ });
    expect(link).toHaveAttribute('href', 'https://cdn.origen.test/disputes/foto%20caja.jpg?sig=abc');
    expect(link).toHaveAttribute('download');
    // sin tarjeta: el detalle va sobre la superficie de la página
    expect(screen.getByTestId('order-dispute').className).not.toMatch(/shadow|rounded-\[28px\]/);
  });

  it('resuelta: muestra la resolución y no deja escribir', async () => {
    const resolved = { ...dispute, status: 'RESOLVED', verdict: 'BUYER_WINS', refundAmount: 7.9, verdictNote: 'Reembolso total' };
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([resolved])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(resolved)),
    );
    render(<DisputeDetail dispute={resolved as never} />);
    expect(await screen.findByTestId('dispute-verdict')).toHaveTextContent('A favor del comprador');
    expect(screen.queryByLabelText('Respuesta a la disputa')).toBeNull();
  });

  it('el detalle de una disputa pide el hilo actualizado al abrirse', async () => {
    const fresh = [
      ...dispute.messages,
      { id: 'm9', disputeId: 'd1', senderType: 'BUYER', senderId: '10', content: 'Mensaje nuevo del comprador', attachments: [], createdAt: '2026-11-07T10:00:00Z' },
    ];
    server.use(http.get(`${BASE}/disputes/d1/messages`, () => HttpResponse.json(fresh)));
    render(<DisputeDetail dispute={{ ...dispute, messages: undefined } as never} />);
    expect(await screen.findByText('Mensaje nuevo del comprador')).toBeInTheDocument();
  });
});

describe('OrderDisputeLink — detalle de pedido', () => {
  it('no pinta nada si el pedido no tiene disputa', async () => {
    server.use(http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([])));
    const { container } = render(<OrderDisputeLink orderId="o1" />);
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
  });

  it('con disputa solo enlaza a su detalle (sin conversación en el pedido)', async () => {
    server.use(
      http.get(`${BASE}/disputes/mine`, () => HttpResponse.json([dispute])),
      http.get(`${BASE}/disputes/d1`, () => HttpResponse.json(dispute)),
    );
    render(<OrderDisputeLink orderId="o1" />);
    const link = await screen.findByTestId('order-dispute-link');
    expect(link).toHaveAttribute('href', '/dashboard/disputas?id=d1');
    expect(link).toHaveTextContent('Esperando tu respuesta');
    expect(screen.queryByTestId('dispute-thread')).toBeNull();
    expect(screen.queryByLabelText('Respuesta a la disputa')).toBeNull();
  });
});
