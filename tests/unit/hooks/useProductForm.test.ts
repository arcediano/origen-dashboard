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
import { formDataToProduct } from '@/hooks/useProductForm';
import { defaultFormData } from '@/types/product';
import type { ProductFormData } from '@/types/product';

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
