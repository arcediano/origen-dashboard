/**
 * @file categories.ts
 * @description Llamadas al API Gateway para obtener las categorías de productos.
 *
 * Las categorías son públicas (no requieren autenticación) y se usan en:
 * - Formularios de creación/edición de productos (selector de categoría)
 * - Filtros de búsqueda del catálogo
 * - Navegación del marketplace
 *
 * Ruta del gateway: GET /api/v1/categories
 * Ruta del gateway (árbol): GET /api/v1/categories/tree
 */

import { gatewayClient, GatewayError } from './client';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: ApiCategory[];
  _count?: { products: number };
}

/** Formato simplificado para usar en selects del formulario */
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
}

/** Árbol de categorías raíz con sus subcategorías */
export interface CategoryTree extends CategoryOption {
  children: CategoryOption[];
}

// ─── FUNCIONES ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista plana de todas las categorías activas.
 * Útil para poblar selects simples.
 *
 * @returns Array de categorías ordenadas por `sortOrder`
 */
export async function fetchCategories(): Promise<CategoryOption[]> {
  try {
    const categories = await gatewayClient.get<ApiCategory[]>('/categories');
    return categories
      .filter(c => c.isActive)
      .map(toOption);
  } catch (error) {
    console.error('[categories] Error en fetchCategories:', error);
    return [];
  }
}

/**
 * Obtiene el árbol de categorías (raíces con sus hijos).
 * Útil para selects con agrupación padre/subcategoría.
 *
 * @returns Array de categorías raíz, cada una con su array `children`
 */
export async function fetchCategoriesTree(): Promise<CategoryTree[]> {
  try {
    const tree = await gatewayClient.get<ApiCategory[]>('/categories/tree');
    return tree
      .filter(c => c.isActive)
      .map(c => ({
        ...toOption(c),
        children: (c.children ?? [])
          .filter(sub => sub.isActive)
          .map(toOption),
      }));
  } catch (error) {
    console.error('[categories] Error en fetchCategoriesTree:', error);
    return [];
  }
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function toOption(c: ApiCategory): CategoryOption {
  return {
    id:       c.id,
    name:     c.name,
    slug:     c.slug,
    parentId: c.parentId,
    icon:     c.icon,
  };
}
