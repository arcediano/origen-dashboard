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

interface WrappedPayload<T> {
  data?: T;
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
    const raw = await gatewayClient.get<ApiCategory[] | WrappedPayload<ApiCategory[]>>('/categories');
    const categories = unwrapArray(raw);
    return categories
      .filter(isActiveCategory)
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
    const rawTree = await gatewayClient.get<ApiCategory[] | WrappedPayload<ApiCategory[]>>('/categories/tree');
    const tree = unwrapArray(rawTree);
    if (tree.length > 0) {
      return tree
        .filter(isActiveCategory)
        .map(c => ({
          ...toOption(c),
          children: (c.children ?? [])
            .filter(isActiveCategory)
            .map(toOption),
        }));
    }

    // Fallback operativo: si /tree falla o devuelve vacío, construir el árbol
    // desde la lista plana para no bloquear creación de producto.
    const flat = await fetchCategories();
    return buildTreeFromFlat(flat);
  } catch (error) {
    if (error instanceof GatewayError) {
      console.error(
        `[categories] Error en fetchCategoriesTree (${error.status}). Intentando fallback /categories`,
        error,
      );
    } else {
      console.error('[categories] Error en fetchCategoriesTree. Intentando fallback /categories:', error);
    }

    const flat = await fetchCategories();
    return buildTreeFromFlat(flat);
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

function unwrapArray(
  payload: ApiCategory[] | WrappedPayload<ApiCategory[]>,
): ApiCategory[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function isActiveCategory(c: ApiCategory): boolean {
  return c.isActive !== false;
}

function buildTreeFromFlat(categories: CategoryOption[]): CategoryTree[] {
  const byId = new Map<string, CategoryTree>();

  for (const category of categories) {
    byId.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTree[] = [];
  for (const category of byId.values()) {
    if (category.parentId && byId.has(category.parentId)) {
      byId.get(category.parentId)?.children.push(category);
      continue;
    }
    roots.push(category);
  }

  return roots;
}
