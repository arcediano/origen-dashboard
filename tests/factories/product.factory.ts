/**
 * Factories para datos de producto en tests.
 * Cada función devuelve un objeto con valores por defecto que pueden ser sobrescritos.
 */

export interface MockProduct {
  id: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
  basePrice: number;
  comparePrice: number | null;
  stock: number;
  sku: string;
  status: 'draft' | 'active' | 'inactive' | 'pending';
  categoryId: number;
  producerId: number;
  images: MockProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface MockProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

let _idCounter = 1;

export function buildProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  const id = overrides.id ?? _idCounter++;
  return {
    id,
    name: `Producto Test ${id}`,
    shortDescription: 'Descripción corta de prueba para el producto de test',
    fullDescription: 'Descripción completa de prueba. Este es un producto de ejemplo para los tests automatizados del panel de gestión.',
    basePrice: 12.5,
    comparePrice: 15.0,
    stock: 100,
    sku: `SKU-TEST-${String(id).padStart(3, '0')}`,
    status: 'active',
    categoryId: 1,
    producerId: 42,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400', isPrimary: true },
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function buildProductList(count = 5, overrides: Partial<MockProduct> = {}): MockProduct[] {
  return Array.from({ length: count }, (_, i) =>
    buildProduct({ id: i + 1, name: `Producto ${i + 1}`, ...overrides }),
  );
}

export function buildOutOfStockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return buildProduct({ stock: 0, status: 'active', ...overrides });
}

export function buildDraftProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return buildProduct({ status: 'draft', ...overrides });
}

export function buildInactiveProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return buildProduct({ status: 'inactive', ...overrides });
}
