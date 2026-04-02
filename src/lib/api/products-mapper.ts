/**
 * @file products-mapper.ts
 * @description Mapea las respuestas del API Gateway (products-service) al tipo
 *              Product que usa el frontend del dashboard.
 *
 * El products-service devuelve campos en UPPER_CASE (status, visibility) y
 * estructura las imágenes como { key, url }. Este mapper normaliza esas
 * diferencias para que el resto de la aplicación trabaje siempre con el
 * tipo Product del frontend, sin conocer la estructura interna del backend.
 *
 * Reglas de mapeo:
 *   status:     ACTIVE → active | DRAFT → draft | INACTIVE → inactive |
 *               OUT_OF_STOCK → out_of_stock | PENDING_APPROVAL → draft |
 *               SCHEDULED → draft
 *   visibility: PUBLIC → public | PRIVATE → private | PASSWORD → password
 *   mainImage:  { key, url } → ProductImage | null
 *   gallery:    { key, url }[] → ProductImage[]
 *   Fechas:     string ISO → Date
 *   Campos ausentes en la respuesta básica (priceTiers, certifications,
 *   nutritionalInfo, productionInfo, attributes) → valores vacíos seguros
 */

import {
  type Product,
  type ProductImage,
  type Dimensions,
} from '@/types/product';

// ─── TIPOS DE RESPUESTA DEL BACKEND ──────────────────────────────────────────

/** Estructura de imagen tal como la devuelve products-service */
export interface ApiProductImage {
  key: string;
  url: string;
}

/**
 * Respuesta paginada de products-service para el listado del productor.
 * El gateway la reenvía sin modificaciones.
 */
export interface ApiProductsListResponse {
  data: ApiProduct[];
  total: number;
  page: number;
  limit: number;
}

/** Producto tal como lo devuelve products-service */
export interface ApiProduct {
  id: string;
  producerId: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tags: string[];
  basePrice: number;
  comparePrice?: number;
  sku: string;
  barcode?: string;
  // Inventario
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  maxStock?: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  // Imágenes S3
  mainImage?: ApiProductImage;
  gallery: ApiProductImage[];
  // Dimensiones
  weight?: number;
  weightUnit?: string;
  dimensions?: { length?: number; width?: number; height?: number; unit?: string };
  // Estado
  status: string;     // 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'OUT_OF_STOCK' | 'PENDING_APPROVAL' | 'SCHEDULED'
  visibility: string; // 'PUBLIC' | 'PRIVATE' | 'PASSWORD'
  publishedAt?: string;
  // Estadísticas
  rating: number;
  reviewCount: number;
  sales: number;
  revenue: number;
  views: number;
  conversion?: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ─── ESTADÍSTICAS AGREGADAS ───────────────────────────────────────────────────

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  lowStock: number;
  outOfStock: number;
  totalRevenue: number;
  totalSales: number;
  totalViews: number;
  avgRating: number;
}

// ─── MAPAS DE CONVERSIÓN ─────────────────────────────────────────────────────

/**
 * Convierte el status del backend (UPPER_CASE) al formato del frontend (lower_case).
 * Valores no reconocidos se mapean a 'draft' como valor seguro.
 */
const STATUS_MAP: Record<string, Product['status']> = {
  ACTIVE:           'active',
  DRAFT:            'draft',
  INACTIVE:         'inactive',
  OUT_OF_STOCK:     'out_of_stock',
  PENDING_APPROVAL: 'draft',    // Tratado como borrador en el dashboard
  SCHEDULED:        'draft',    // Tratado como borrador en el dashboard
};

/**
 * Convierte la visibilidad del backend al formato del frontend.
 */
const VISIBILITY_MAP: Record<string, Product['visibility']> = {
  PUBLIC:   'public',
  PRIVATE:  'private',
  PASSWORD: 'password',
};

// ─── FUNCIONES DE MAPEO ──────────────────────────────────────────────────────

/**
 * Convierte una imagen del backend { key, url } a ProductImage del frontend.
 * Usa el nombre del producto como texto alternativo.
 */
function mapApiImage(
  img: ApiProductImage,
  productName: string,
  isMain: boolean,
  sortOrder: number,
): ProductImage {
  return {
    id: img.key,           // La clave S3 actúa como identificador único de la imagen
    url: img.url,
    alt: productName,
    isMain,
    sortOrder,
  };
}

/**
 * Mapea un producto de la API al tipo Product del frontend.
 * Los campos complejos (certifications, nutritionalInfo, priceTiers, attributes,
 * productionInfo) no están presentes en la respuesta básica del listado —
 * se inicializan vacíos. El detalle de producto los completará si el endpoint
 * de detalle los incluye en el futuro.
 */
export function mapApiProductToProduct(api: ApiProduct): Product {
  // Mapear imagen principal
  const mainImage: ProductImage | undefined = api.mainImage?.url
    ? mapApiImage(api.mainImage, api.name, true, 0)
    : undefined;

  // Mapear galería
  const gallery: ProductImage[] = (api.gallery ?? []).map((img, i) =>
    mapApiImage(img, api.name, false, i + 1),
  );

  return {
    id:               api.id,
    producerId:       api.producerId,
    name:             api.name,
    slug:             api.slug,
    shortDescription: api.shortDescription,
    fullDescription:  api.fullDescription,
    categoryId:       api.categoryId,
    categoryName:     api.categoryName ?? '',
    subcategoryId:    api.subcategoryId,
    tags:             api.tags ?? [],

    mainImage,
    gallery,

    basePrice:    api.basePrice,
    comparePrice: api.comparePrice,
    priceTiers:   [],   // No en respuesta básica; se rellenarán en detalle

    sku:              api.sku,
    barcode:          api.barcode,
    stock:            api.stock,
    lowStockThreshold: api.lowStockThreshold,
    trackInventory:   api.trackInventory,
    allowBackorders:  api.allowBackorders,

    weight:        api.weight,
    weightUnit:    api.weightUnit as 'kg' | 'g' | undefined,
    dimensions:    api.dimensions as Dimensions | undefined,

    nutritionalInfo: undefined,   // No en respuesta básica del listado
    certifications:  [],
    productionInfo:  undefined,
    attributes:      [],

    status:      STATUS_MAP[api.status]     ?? 'draft',
    visibility:  VISIBILITY_MAP[api.visibility] ?? 'private',
    publishedAt: api.publishedAt ? new Date(api.publishedAt) : undefined,

    sales:       api.sales,
    revenue:     api.revenue,
    rating:      api.rating,
    reviewCount: api.reviewCount,
    views:       api.views,
    conversion:  api.conversion,

    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  };
}

/**
 * Mapea una lista de productos de la API.
 */
export function mapApiProducts(apiProducts: ApiProduct[]): Product[] {
  return apiProducts.map(mapApiProductToProduct);
}

/**
 * Calcula estadísticas agregadas a partir de una lista de productos.
 * Usado por fetchProductStats() cuando no hay un endpoint dedicado de stats.
 */
export function computeProductStats(products: Product[]): ProductStats {
  const active    = products.filter(p => p.status === 'active').length;
  const draft     = products.filter(p => p.status === 'draft').length;
  const inactive  = products.filter(p => p.status === 'inactive').length;
  const outOfStock = products.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;
  const lowStock  = products.filter(
    p => p.stock > 0 && p.stock <= p.lowStockThreshold && p.status !== 'out_of_stock',
  ).length;

  const totalRevenue = products.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
  const totalSales   = products.reduce((sum, p) => sum + (p.sales ?? 0), 0);
  const totalViews   = products.reduce((sum, p) => sum + (p.views ?? 0), 0);

  const rated    = products.filter(p => (p.rating ?? 0) > 0);
  const avgRating = rated.length > 0
    ? parseFloat(
        (rated.reduce((sum, p) => sum + (p.rating ?? 0), 0) / rated.length).toFixed(1),
      )
    : 0;

  return {
    total:        products.length,
    active,
    draft,
    inactive,
    lowStock,
    outOfStock,
    totalRevenue,
    totalSales,
    totalViews,
    avgRating,
  };
}

/**
 * Convierte el status del frontend (lower_case) al formato que espera el backend (UPPER_CASE).
 */
export function mapStatusToApi(status: Product['status'] | string): string {
  const map: Record<string, string> = {
    active:      'ACTIVE',
    draft:       'DRAFT',
    inactive:    'INACTIVE',
    out_of_stock: 'OUT_OF_STOCK',
  };
  return map[status] ?? 'DRAFT';
}

/**
 * Convierte la visibilidad del frontend al formato del backend.
 */
export function mapVisibilityToApi(visibility: Product['visibility'] | string): string {
  const map: Record<string, string> = {
    public:   'PUBLIC',
    private:  'PRIVATE',
    password: 'PASSWORD',
  };
  return map[visibility] ?? 'PRIVATE';
}
