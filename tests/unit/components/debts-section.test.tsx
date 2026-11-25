import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const fetchSellerDebts = vi.fn();
vi.mock('@/lib/api/orders', () => ({ fetchSellerDebts: () => fetchSellerDebts() }));

import { DebtsSection } from '@/app/dashboard/account/payments/DebtsSection';

const base = { orderId: 'o1', reason: '', createdAt: '2026-11-25T10:00:00Z', resolvedAt: null };

describe('DebtsSection', () => {
  beforeEach(() => fetchSellerDebts.mockReset());

  it('no muestra nada si el productor no tiene deudas', async () => {
    fetchSellerDebts.mockResolvedValue({ data: [], status: 200 });
    const { container } = render(<DebtsSection />);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });

  it('un contracargo perdido muestra el pedido, el importe y avisa de que no se descuenta automáticamente', async () => {
    fetchSellerDebts.mockResolvedValue({
      status: 200,
      data: [{ ...base, id: 'd1', orderNumber: 'ORG-2026-00071', kind: 'CHARGEBACK_LOST', status: 'PENDING_REVIEW', amount: 85.48, remaining: 85.48 }],
    });
    render(<DebtsSection />);
    expect(await screen.findByText(/Contracargo perdido · Pedido ORG-2026-00071/)).toBeInTheDocument();
    expect(screen.getByText('85,48 €')).toBeInTheDocument();
    expect(screen.getByText('Lo gestionaremos contigo')).toBeInTheDocument();
    expect(screen.getByText(/No se te descuenta nada automáticamente/)).toBeInTheDocument();
  });

  it('una deuda confirmada explica que se descuenta de los próximos cobros', async () => {
    fetchSellerDebts.mockResolvedValue({
      status: 200,
      data: [{ ...base, id: 'd2', orderNumber: 'ORG-2026-00064', kind: 'REVERSAL_FAILED', status: 'OPEN', amount: 58, remaining: 38 }],
    });
    render(<DebtsSection />);
    expect(await screen.findByText('38,00 €')).toBeInTheDocument();
    expect(screen.getByText('Se descuenta de tus próximos cobros')).toBeInTheDocument();
    expect(screen.getByText(/no se te hace ningún cargo en el banco/)).toBeInTheDocument();
  });
});
