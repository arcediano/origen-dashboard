import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayoutRulesCard } from '@/app/dashboard/account/payments/PayoutRulesCard';

describe('PayoutRulesCard', () => {
  it('muestra los plazos vigentes de la política contados desde la entrega', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 15, disputeWindowDays: 5, returnWindowDays: 14 }} />);
    expect(screen.getByText(/Todos los plazos se cuentan desde la fecha en que el pedido pasa a «Entregado»/)).toBeInTheDocument();
    expect(screen.getByText(/Hasta el día 5 o 14/)).toBeInTheDocument();
    expect(screen.getByText(/Día 15/)).toBeInTheDocument();
    expect(screen.getByText(/Siempre 15 días después de la entrega, sea cual sea el producto/)).toBeInTheDocument();
    // Ambos casos explicados: solo perecederos (5) y pedido con desistimiento (14, igualados)
    expect(screen.getByText(/solo tiene productos perecederos/)).toBeInTheDocument();
    expect(screen.getByText(/se igualan hasta el día 14 para todo el pedido/)).toBeInTheDocument();
  });

  it('explica que la disputa abierta retiene el cobro', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 15, disputeWindowDays: 5, returnWindowDays: 14 }} />);
    expect(screen.getByText(/Cobro retenido:/)).toBeInTheDocument();
    expect(screen.getByText(/Congelado/)).toBeInTheDocument();
    expect(screen.getByText(/lo comprueba de nuevo justo antes de cada pago/)).toBeInTheDocument();
  });

  it('refleja plazos distintos si el administrador los cambia', () => {
    render(<PayoutRulesCard policy={{ payoutRetentionDays: 20, disputeWindowDays: 3, returnWindowDays: 18 }} />);
    expect(screen.getByText(/Hasta el día 3 o 18/)).toBeInTheDocument();
    expect(screen.getByText(/Día 20/)).toBeInTheDocument();
  });
});
