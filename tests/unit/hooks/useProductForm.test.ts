/**
 * Tests unitarios para formDataToProduct (useProductForm).
 *
 * Reproduce el hallazgo del wizard de edición de producto (2026-09-11):
 * formDataToProduct() incluía siempre `status`, lo que rompía 2 cosas en el
 * backend (ProductsService.update()):
 *   - `deferSensitive` nunca se activaba (!dto.status siempre falso), así
 *     que una edición sensible de un producto ya publicado se aplicaba de
 *     inmediato en vez de diferirse a ProductPendingRevision.
 *   - un producto INACTIVE (formData.status colapsado a 'draft' al cargar,
 *     ver productToFormData) pasaba silenciosamente a DRAFT en cada
 *     autoguardado (INACTIVE → DRAFT sí está permitido por el backend).
 *
 * formDataToProduct ya no debe incluir `status` en absoluto -- los cambios
 * de estado de un producto existente pasan siempre por una acción explícita
 * (StatusCard o handlePublish, que lo fija aparte).
 */

import { describe, it, expect } from 'vitest';
import { formDataToProduct, productToFormData } from '@/hooks/useProductForm';
import { defaultFormData } from '@/types/product';
import type { ProductFormData, Product, FlashDeal } from '@/types/product';

describe('formDataToProduct', () => {
  it('nunca incluye status, sea cual sea el status del formulario', () => {
    (['draft', 'active', 'pending_approval'] as const).forEach((status) => {
      const formData: ProductFormData = { ...defaultFormData, status };
      const result = formDataToProduct(formData);
      expect(result).not.toHaveProperty('status');
    });
  });

  it('propaga el resto de campos de contenido sin cambios', () => {
    const formData: ProductFormData = {
      ...defaultFormData,
      name: 'Huevos ecológicos - XL',
      basePrice: 4.5,
      stock: 25,
      status: 'active',
    };

    const result = formDataToProduct(formData);

    expect(result.name).toBe('Huevos ecológicos - XL');
    expect(result.basePrice).toBe(4.5);
    expect(result.stock).toBe(25);
  });
});

/**
 * Reproduce el bug reportado por el humano (2026-09-17): al editar un
 * producto con una oferta flash activa, el paso de Precios no la mostraba
 * (dando pie a crear otra oferta duplicada, bloqueada solo al final del
 * proceso) porque productToFormData() nunca mapeaba `flashDeal` desde el
 * Product cargado.
 */
describe('productToFormData', () => {
  const flashDeal: FlashDeal = {
    id: 'fd-1',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    startsAt: new Date('2026-09-17T00:00:00.000Z'),
    endsAt: new Date('2026-09-20T00:00:00.000Z'),
    isActive: true,
    isCurrentlyActive: true,
    stacksWithTiers: false,
  };

  it('mapea flashDeal desde el Product para que el paso de Precios la muestre al editar', () => {
    const product = { ...defaultFormData, flashDeal } as unknown as Product;
    const result = productToFormData(product);

    expect(result.flashDeal).toEqual(flashDeal);
  });

  it('deja flashDeal undefined cuando el producto no tiene ninguna oferta flash activa', () => {
    const product = { ...defaultFormData, flashDeal: undefined } as unknown as Product;
    const result = productToFormData(product);

    expect(result.flashDeal).toBeUndefined();
  });
});
