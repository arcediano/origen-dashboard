import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// El mock compartido de @arcediano/ux-library (vitest.setup.ts) resuelve
// EmptyState como passthrough('div'): title/description quedan como
// atributos DOM crudos, no como children renderizados -- se comprueban por
// atributo, no por texto visible.
const getByTitleAttr = (title: string) => document.querySelector(`[title="${title}"]`);

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api/orders', () => ({
  fetchSellerPayoutHistory: vi.fn(),
}));

import { PayoutHistorySection } from '@/app/dashboard/account/payments/PayoutHistorySection';
import { fetchSellerPayoutHistory } from '@/lib/api/orders';

const baseItem = {
  orderId: 'order-1',
  orderNumber: 'ORG-2026-00001',
  createdAt: '2026-01-10T00:00:00.000Z',
  netAmount: 50,
  status: 'scheduled' as const,
  transferScheduledAt: '2026-02-01T00:00:00.000Z',
  transferExecutedAt: null,
  transferReversedAt: null,
  refundedAt: null,
  refundedAmount: null,
};

describe('PayoutHistorySection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('muestra el aviso de demora bancaria siempre, incluso sin cobros', async () => {
    vi.mocked(fetchSellerPayoutHistory).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 10 },
      status: 200,
    });

    render(<PayoutHistorySection />);

    await waitFor(() => {
      expect(screen.getByText(/Origen ya ha transferido el importe a tu cuenta de/i)).toBeInTheDocument();
    });
  });

  it('muestra el EmptyState cuando el productor no tiene ningún cobro', async () => {
    vi.mocked(fetchSellerPayoutHistory).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 10 },
      status: 200,
    });

    render(<PayoutHistorySection />);

    await waitFor(() => {
      expect(getByTitleAttr('Todavía no hay cobros')).not.toBeNull();
    });
  });

  it('renderiza una fila por cobro con su estado y permite navegar al pedido', async () => {
    vi.mocked(fetchSellerPayoutHistory).mockResolvedValue({
      data: {
        items: [
          baseItem,
          {
            ...baseItem,
            orderId: 'order-2',
            orderNumber: 'ORG-2026-00002',
            status: 'executed',
            transferExecutedAt: '2026-02-05T00:00:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      },
      status: 200,
    });

    render(<PayoutHistorySection />);

    await waitFor(() => {
      expect(screen.getAllByText(/ORG-2026-00001/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Programado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cobrado').length).toBeGreaterThan(0);

    const row = screen.getAllByText(/ORG-2026-00002/)[0];
    row.closest('button')?.click();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/orders/order-2');
    });
  });

  it('pide la página siguiente al cambiar de página', async () => {
    vi.mocked(fetchSellerPayoutHistory).mockResolvedValue({
      data: {
        items: Array.from({ length: 10 }, (_, i) => ({
          ...baseItem,
          orderId: `order-${i}`,
          orderNumber: `ORG-2026-0000${i}`,
        })),
        total: 15,
        page: 1,
        limit: 10,
      },
      status: 200,
    });

    render(<PayoutHistorySection />);

    await waitFor(() => {
      expect(fetchSellerPayoutHistory).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});
