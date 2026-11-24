import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayoutRulesCard } from '@/app/dashboard/account/payments/PayoutRulesCard';

describe('PayoutRulesCard', () => {
  it('muestra los plazos vigentes de la política contados desde la entrega', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 10, disputeWindowDays: 5 }} />);
    expect(screen.getByText(/Todos los plazos se cuentan desde la fecha en que el pedido pasa a «Entregado»/)).toBeInTheDocument();
    expect(screen.getByText(/Hasta el día 5/)).toBeInTheDocument();
    expect(screen.getByText(/Día 10/)).toBeInTheDocument();
    expect(screen.getByText(/como máximo 10 días después de la entrega/)).toBeInTheDocument();
  });

  it('explica que la disputa abierta retiene el cobro', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 10, disputeWindowDays: 5 }} />);
    expect(screen.getByText(/Cobro retenido:/)).toBeInTheDocument();
    expect(screen.getByText(/Congelado/)).toBeInTheDocument();
  });

  it('refleja plazos distintos si el administrador los cambia', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 8, disputeWindowDays: 3 }} />);
    expect(screen.getByText(/Hasta el día 3/)).toBeInTheDocument();
    expect(screen.getByText(/Día 8/)).toBeInTheDocument();
  });
});
