import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const fetchSellerDebts = vi.fn();
vi.mock('@/lib/api/orders', () => ({ fetchSellerDebts: () => fetchSellerDebts() }));

import { DebtAlert, debtCause } from '@/app/dashboard/account/payments/DebtAlert';

const base = { reason: '', createdAt: '2026-11-28T15:10:00Z', resolvedAt: null };

describe('DebtAlert', () => {
  beforeEach(() => fetchSellerDebts.mockReset());

  it('una tasa de Stripe por disputa explica de qué pedido viene, por qué corre a su cargo y cómo se cobra', async () => {
    fetchSellerDebts.mockResolvedValue({
      status: 200,
      data: [{ ...base, id: 'd1', orderId: 'ea9a', orderNumber: 'ORG-2026-00106', kind: 'STRIPE_FEE', status: 'OPEN', amount: 0.28, remaining: 0.28 }],
    });
    render(<DebtAlert debtAmountCents={28} />);
    expect(screen.getByTestId('debt-alert').textContent).toMatch(/saldo negativo de 0,28 €/);
    const item = await screen.findByTestId('debt-alert-items');
    expect(item.textContent).toMatch(/tasa de Stripe de una disputa del pedido ORG-2026-00106/);
    expect(item.textContent).toMatch(/a favor del comprador por un fallo/);
    expect(screen.getByRole('link', { name: /pedido ORG-2026-00106 y su disputa/ })).toHaveAttribute('href', '/dashboard/orders/ea9a');
    // cómo se cobra: de los próximos pagos de cualquier pedido, no solo del que la originó
    expect(screen.getByTestId('debt-alert').textContent).toMatch(/de cualquier pedido, no solo del que la originó/);
  });

  it('no atribuye a «una devolución que no se pudo compensar» lo que no lo es', async () => {
    fetchSellerDebts.mockResolvedValue({
      status: 200,
      data: [{ ...base, id: 'd1', orderId: 'x', orderNumber: 'ORG-1', kind: 'STRIPE_FEE', status: 'OPEN', amount: 1, remaining: 1 }],
    });
    render(<DebtAlert debtAmountCents={100} />);
    await screen.findByTestId('debt-alert-items');
    expect(screen.getByTestId('debt-alert').textContent).not.toMatch(/no se pudo compensar/);
  });

  it('sin desglose (deuda anterior al libro) mantiene el aviso con el importe y el cobro', async () => {
    fetchSellerDebts.mockResolvedValue({ status: 200, data: [] });
    render(<DebtAlert debtAmountCents={1250} />);
    expect(screen.getByTestId('debt-alert').textContent).toMatch(/12,50 €/);
    expect(screen.queryByTestId('debt-alert-items')).toBeNull();
    expect(screen.getByTestId('debt-alert').textContent).toMatch(/próximas transferencias/);
  });

  it('describe cada origen de deuda', () => {
    expect(debtCause({ kind: 'REVERSAL_FAILED', orderNumber: 'ORG-2' })).toMatch(/devolución del pedido ORG-2/);
    expect(debtCause({ kind: 'CHARGEBACK_LOST', orderNumber: 'ORG-3' })).toMatch(/contracargo perdido del pedido ORG-3/);
    expect(debtCause({ kind: 'MANUAL', orderNumber: null })).toMatch(/anterior/);
  });
});
