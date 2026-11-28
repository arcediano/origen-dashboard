import { describe, expect, it } from 'vitest';
import { mapApiProductToProduct, type ApiProduct } from '@/lib/api/products-mapper';

const base = {
  id: 'p1',
  producerId: 'pr1',
  name: 'Lubina de estero',
  slug: 'lubina-de-estero',
  fullDescription: '',
  categoryId: 'c1',
  basePrice: 14,
  status: 'active',
  gallery: [],
} as unknown as ApiProduct;

describe('mapApiProductToProduct — venta a granel (ADR-024)', () => {
  it('conserva el modo de venta, la medida y las reglas de cantidad del producto', () => {
    const product = mapApiProductToProduct({
      ...base,
      saleMode: 'WEIGHT',
      measureKind: 'VOLUME',
      pricePerKgCents: 1400,
      minWeightGrams: 500,
      weightIncrementGrams: 250,
    });
    expect(product).toMatchObject({
      saleMode: 'WEIGHT',
      measureKind: 'VOLUME',
      pricePerKgCents: 1400,
      minWeightGrams: 500,
      weightIncrementGrams: 250,
    });
  });

  it('un producto sin esos campos se trata como por unidad y de peso', () => {
    const product = mapApiProductToProduct(base);
    expect(product.saleMode).toBe('UNIT');
    expect(product.measureKind).toBe('MASS');
  });

  it('conserva el precio por kg o litro y el stock de cada preparación', () => {
    const product = mapApiProductToProduct({
      ...base,
      saleMode: 'WEIGHT',
      hasVariants: true,
      variants: [
        {
          id: 'v1',
          option1Value: 'En rodajas',
          price: 16,
          stock: 6000,
          pricePerKgCents: 1600,
          stockBaseUnits: 6000,
          trackInventory: true,
          sortOrder: 0,
          isActive: true,
        },
      ],
    } as ApiProduct);
    expect(product.variants?.[0]).toMatchObject({
      pricePerKgCents: 1600,
      stockBaseUnits: 6000,
    });
  });
});
