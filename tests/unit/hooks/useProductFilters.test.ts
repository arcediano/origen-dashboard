/**
 * Tests unitarios para el hook useProductFilters.
 * Cubre: estado inicial, filtros (búsqueda, categoría, estado, stock),
 * ordenamiento, paginación, combinación de filtros y limpiar filtros.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductFilters } from '@/hooks/useProductFilters';
import type { Product } from '@/types/product';

// ── Factory de productos mínimos ─────────────────────────────────────────────

let idCounter = 1;
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: String(idCounter++),
  producerId: 'prod-1',
  name: 'Producto Test',
  slug: 'producto-test',
  shortDescription: 'Descripción',
  fullDescription: 'Descripción completa',
  categoryId: 'cat-1',
  categoryName: 'General',
  tags: [],
  gallery: [],
  basePrice: 1000,
  priceTiers: [],
  sku: `SKU-${idCounter}`,
  stock: 50,
  lowStockThreshold: 10,
  trackInventory: true,
  certifications: [],
  attributes: [],
  status: 'active',
  visibility: 'public',
  sales: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
} as Product);

// ── Datos de prueba ───────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  makeProduct({
    id: '1',
    name: 'Aceite de Oliva',
    sku: 'ACE-001',
    categoryName: 'Aceites',
    status: 'active',
    stock: 50,
    lowStockThreshold: 10,
    basePrice: 1500,
    sales: 20,
    createdAt: new Date('2024-03-01'),
  }),
  makeProduct({
    id: '2',
    name: 'Queso Manchego',
    sku: 'QUE-001',
    categoryName: 'Lácteos',
    status: 'draft',
    stock: 5,
    lowStockThreshold: 10,
    basePrice: 2800,
    sales: 5,
    createdAt: new Date('2024-01-01'),
  }),
  makeProduct({
    id: '3',
    name: 'Miel de Romero',
    sku: 'MIE-001',
    categoryName: 'Mieles',
    status: 'inactive',
    stock: 0,
    lowStockThreshold: 5,
    basePrice: 800,
    sales: 50,
    createdAt: new Date('2024-02-01'),
  }),
];

// ── Estado inicial ────────────────────────────────────────────────────────────

describe('useProductFilters — estado inicial', () => {
  it('todos los filtros comienzan vacíos', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedCategory).toBe('');
    expect(result.current.selectedStatus).toBe('');
    expect(result.current.selectedStock).toBe('');
    expect(result.current.sortBy).toBe('');
  });

  it('empieza en página 1', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    expect(result.current.currentPage).toBe(1);
  });

  it('devuelve todos los productos cuando no hay filtros', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    expect(result.current.filteredProducts).toHaveLength(3);
  });

  it('hasFilters es false inicialmente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    expect(result.current.hasFilters).toBe(false);
  });

  it('lista vacía de entrada devuelve filteredProducts vacío', () => {
    const { result } = renderHook(() => useProductFilters([]));
    expect(result.current.filteredProducts).toHaveLength(0);
    expect(result.current.totalPages).toBe(0);
  });
});

// ── Búsqueda por texto ────────────────────────────────────────────────────────

describe('useProductFilters — búsqueda por texto', () => {
  it('filtra por nombre de producto', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('aceite'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Aceite de Oliva');
  });

  it('filtra por SKU del producto', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('MIE-001'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Miel de Romero');
  });

  it('la búsqueda es case-insensitive', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('QUESO'); });
    expect(result.current.filteredProducts).toHaveLength(1);
  });

  it('búsqueda sin resultados devuelve array vacío', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('producto-inexistente-xyz'); });
    expect(result.current.filteredProducts).toHaveLength(0);
  });

  it('hasFilters es true cuando hay búsqueda activa', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('aceite'); });
    expect(result.current.hasFilters).toBe(true);
  });

  it('búsqueda parcial encuentra productos', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSearchQuery('anch'); }); // "Manchego"
    expect(result.current.filteredProducts).toHaveLength(1);
  });
});

// ── Filtro por categoría ──────────────────────────────────────────────────────

describe('useProductFilters — filtro por categoría', () => {
  it('filtra por categoría existente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedCategory('Lácteos'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Queso Manchego');
  });

  it('categoría inexistente devuelve 0 resultados', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedCategory('NoExiste'); });
    expect(result.current.filteredProducts).toHaveLength(0);
  });

  it('hasFilters es true con categoría seleccionada', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedCategory('Aceites'); });
    expect(result.current.hasFilters).toBe(true);
  });
});

// ── Filtro por estado ─────────────────────────────────────────────────────────

describe('useProductFilters — filtro por estado', () => {
  it('filtra productos activos', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStatus('active'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].status).toBe('active');
  });

  it('filtra borradores (draft)', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStatus('draft'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Queso Manchego');
  });

  it('filtra inactivos', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStatus('inactive'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Miel de Romero');
  });

  it('estado inexistente devuelve 0 resultados', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStatus('out_of_stock'); });
    expect(result.current.filteredProducts).toHaveLength(0);
  });
});

// ── Filtro por stock ──────────────────────────────────────────────────────────

describe('useProductFilters — filtro por stock', () => {
  it('"agotado" devuelve solo productos con stock === 0', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStock('agotado'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].stock).toBe(0);
  });

  it('"bajo" devuelve productos con stock <= threshold y stock > 0', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStock('bajo'); });
    // Queso Manchego: stock=5, threshold=10 → bajo stock pero no agotado
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Queso Manchego');
  });

  it('"disponible" devuelve solo productos con stock > 0', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStock('disponible'); });
    expect(result.current.filteredProducts.every(p => p.stock > 0)).toBe(true);
    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it('hasFilters es true con filtro de stock activo', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStock('agotado'); });
    expect(result.current.hasFilters).toBe(true);
  });
});

// ── Ordenamiento ──────────────────────────────────────────────────────────────

describe('useProductFilters — ordenamiento', () => {
  it('ordena por nombre A-Z', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('name-asc'); });
    const names = result.current.filteredProducts.map(p => p.name);
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  it('ordena por nombre Z-A', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('name-desc'); });
    const names = result.current.filteredProducts.map(p => p.name);
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('ordena por precio ascendente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('price-asc'); });
    const prices = result.current.filteredProducts.map(p => p.basePrice);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  it('ordena por precio descendente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('price-desc'); });
    const prices = result.current.filteredProducts.map(p => p.basePrice);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
    }
  });

  it('ordena por stock ascendente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('stock-asc'); });
    const stocks = result.current.filteredProducts.map(p => p.stock);
    for (let i = 0; i < stocks.length - 1; i++) {
      expect(stocks[i]).toBeLessThanOrEqual(stocks[i + 1]);
    }
  });

  it('ordena por stock descendente', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('stock-desc'); });
    const stocks = result.current.filteredProducts.map(p => p.stock);
    for (let i = 0; i < stocks.length - 1; i++) {
      expect(stocks[i]).toBeGreaterThanOrEqual(stocks[i + 1]);
    }
  });

  it('ordena por más vendidos (sales-desc)', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('sales-desc'); });
    const sales = result.current.filteredProducts.map(p => p.sales ?? 0);
    for (let i = 0; i < sales.length - 1; i++) {
      expect(sales[i]).toBeGreaterThanOrEqual(sales[i + 1]);
    }
  });

  it('ordena por más recientes (newest)', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('newest'); });
    const dates = result.current.filteredProducts.map(p => new Date(p.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('ordena por más antiguos (oldest)', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('oldest'); });
    const dates = result.current.filteredProducts.map(p => new Date(p.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
    }
  });

  it('hasFilters es true con sortBy activo', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSortBy('newest'); });
    expect(result.current.hasFilters).toBe(true);
  });
});

// ── Paginación ────────────────────────────────────────────────────────────────

describe('useProductFilters — paginación', () => {
  const MANY_PRODUCTS = Array.from({ length: 25 }, (_, i) =>
    makeProduct({ id: String(100 + i), name: `Producto ${i + 1}`, sku: `SKU-P${i + 1}` })
  );

  it('devuelve máximo 10 productos por página', () => {
    const { result } = renderHook(() => useProductFilters(MANY_PRODUCTS));
    expect(result.current.paginatedProducts).toHaveLength(10);
  });

  it('calcula el total de páginas correctamente (25 productos → 3 páginas)', () => {
    const { result } = renderHook(() => useProductFilters(MANY_PRODUCTS));
    expect(result.current.totalPages).toBe(3);
  });

  it('la página 2 devuelve los siguientes 10 productos', () => {
    const { result } = renderHook(() => useProductFilters(MANY_PRODUCTS));
    act(() => { result.current.setCurrentPage(2); });
    expect(result.current.paginatedProducts).toHaveLength(10);
    expect(result.current.currentPage).toBe(2);
  });

  it('la última página devuelve los productos restantes', () => {
    const { result } = renderHook(() => useProductFilters(MANY_PRODUCTS));
    act(() => { result.current.setCurrentPage(3); });
    expect(result.current.paginatedProducts).toHaveLength(5); // 25 - 20 = 5
  });

  it('lista con exactamente 10 productos → 1 página', () => {
    const ten = Array.from({ length: 10 }, (_, i) =>
      makeProduct({ id: String(200 + i) })
    );
    const { result } = renderHook(() => useProductFilters(ten));
    expect(result.current.totalPages).toBe(1);
  });

  it('lista vacía → 0 páginas', () => {
    const { result } = renderHook(() => useProductFilters([]));
    expect(result.current.totalPages).toBe(0);
    expect(result.current.paginatedProducts).toHaveLength(0);
  });
});

// ── Limpiar filtros ───────────────────────────────────────────────────────────

describe('useProductFilters — limpiar filtros', () => {
  it('clearFilters resetea todos los filtros a vacío', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => {
      result.current.setSearchQuery('aceite');
      result.current.setSelectedCategory('Aceites');
      result.current.setSelectedStatus('active');
      result.current.setSelectedStock('disponible');
      result.current.setSortBy('newest');
      result.current.setCurrentPage(2);
    });
    act(() => { result.current.clearFilters(); });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedCategory).toBe('');
    expect(result.current.selectedStatus).toBe('');
    expect(result.current.selectedStock).toBe('');
    expect(result.current.sortBy).toBe('');
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasFilters).toBe(false);
  });

  it('clearFilters devuelve todos los productos', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setSelectedStatus('active'); });
    expect(result.current.filteredProducts).toHaveLength(1);
    act(() => { result.current.clearFilters(); });
    expect(result.current.filteredProducts).toHaveLength(3);
  });

  it('resetPagination vuelve a la página 1', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => { result.current.setCurrentPage(3); });
    act(() => { result.current.resetPagination(); });
    expect(result.current.currentPage).toBe(1);
  });
});

// ── Filtros combinados ────────────────────────────────────────────────────────

describe('useProductFilters — filtros combinados', () => {
  it('búsqueda + categoría combinados reducen resultados', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => {
      result.current.setSearchQuery('miel');
      result.current.setSelectedCategory('Mieles');
    });
    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe('Miel de Romero');
  });

  it('búsqueda + estado sin coincidencia devuelve vacío', () => {
    const { result } = renderHook(() => useProductFilters(PRODUCTS));
    act(() => {
      result.current.setSearchQuery('aceite');
      result.current.setSelectedStatus('draft'); // El aceite es "active"
    });
    expect(result.current.filteredProducts).toHaveLength(0);
  });

  it('filtro + ordenamiento funcionan juntos', () => {
    const twoActive = [
      makeProduct({ id: 'a1', name: 'Zumo', status: 'active', basePrice: 500 }),
      makeProduct({ id: 'a2', name: 'Aceite', status: 'active', basePrice: 1200 }),
      makeProduct({ id: 'a3', name: 'Queso', status: 'draft', basePrice: 800 }),
    ];
    const { result } = renderHook(() => useProductFilters(twoActive));
    act(() => {
      result.current.setSelectedStatus('active');
      result.current.setSortBy('price-asc');
    });
    expect(result.current.filteredProducts).toHaveLength(2);
    expect(result.current.filteredProducts[0].basePrice).toBeLessThanOrEqual(
      result.current.filteredProducts[1].basePrice
    );
  });
});
