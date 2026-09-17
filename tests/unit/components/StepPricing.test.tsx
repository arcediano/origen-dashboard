/**
 * Reproduce en el DOM real (jsdom + Testing Library) el bug reportado por el
 * humano (2026-09-17): al editar un producto con una oferta flash activa,
 * el paso de Precios debe mostrarla y bloquear "Nueva oferta por cantidad"
 * -- antes solo se comprobaba !hasBasePrice, dejando crear una oferta por
 * cantidad en conflicto real con la Flash activa (detectado solo al
 * guardar). Ver useProductForm.test.ts para el fix del mapeo de datos que
 * alimenta este mismo escenario (productToFormData -> formData.flashDeal).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepPricing } from '@/app/dashboard/products/components/steps/StepPricing';
import type { FlashDeal } from '@/types/product';

const activeFlashDeal: FlashDeal = {
  id: 'fd-1',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  startsAt: new Date('2026-09-17T00:00:00.000Z'),
  endsAt: new Date('2026-09-20T00:00:00.000Z'),
  isActive: true,
  isCurrentlyActive: true,
  stacksWithTiers: false,
};

describe('StepPricing — oferta flash activa al editar', () => {
  it('muestra la oferta flash existente y bloquea "Nueva oferta por cantidad" con aviso', () => {
    render(
      <StepPricing
        formData={{ basePrice: 10, comparePrice: undefined, priceTiers: [], flashDeal: activeFlashDeal }}
        onInputChange={() => {}}
        productId="prod-1"
      />,
    );

    // La oferta flash existente se ve (antes: flashDeals arrancaba vacío)
    expect(screen.getByText('Descuento del 20%')).toBeInTheDocument();
    expect(screen.getAllByText('Activa ahora').length).toBeGreaterThan(0);

    // Con tiers vacíos (caso por defecto), el estado vacío de "Ofertas por
    // cantidad" no ofrece su CTA "Crear primera oferta" mientras la Flash
    // siga activa -- muestra el aviso en su lugar.
    expect(screen.queryByRole('button', { name: 'Crear primera oferta' })).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Ya tienes una oferta flash activa/i).length,
    ).toBeGreaterThan(0);
  });

  it('sin oferta flash, "Crear primera oferta" está disponible si hay precio base', () => {
    render(
      <StepPricing
        formData={{ basePrice: 10, comparePrice: undefined, priceTiers: [], flashDeal: undefined }}
        onInputChange={() => {}}
        productId="prod-1"
      />,
    );

    expect(screen.getByRole('button', { name: 'Crear primera oferta' })).toBeEnabled();
    expect(screen.queryByText(/Ya tienes una oferta flash activa/i)).not.toBeInTheDocument();
  });
});
