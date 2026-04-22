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
  type Certification,
  type DynamicAttribute,
  type NutritionalInfo,
  type PriceTier,
  type ProductionInfo,
} from '@/types/product';

// ─── TIPOS DE RESPUESTA DEL BACKEND ──────────────────────────────────────────

/** Estructura de imagen tal como la devuelve products-service */
export interface ApiProductImage {
  key: string;
  url: string;
}

export interface ApiPriceTier {
  id: string;
  minQuantity: number;
  maxQuantity?: number;
  type: string;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  label?: string;
  savings?: number;
}

export interface ApiVitaminInfo {
  id: string;
  name: string;
  amount: number;
  unit: string;
  dailyValue?: number;
}

export interface ApiNutritionalInfo {
  servingSize: string;
  servingSizeValue: number;
  servingSizeUnit: 'g' | 'ml';
  calories?: number;
  protein?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  carbohydrates?: number;
  dietaryFiber?: number;
  sugars?: number;
  addedSugars?: number;
  allergens: string[];
  mayContain: string[];
  ingredients: string[];
  preparationInstructions?: string;
  storageInstructions?: string;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isNutFree?: boolean;
  isEggFree?: boolean;
  isSoyFree?: boolean;
  vitamins: ApiVitaminInfo[];
}

export interface ApiCertification {
  certificationId: string;
  name: string;
  issuingBody: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  verified: boolean;
  verificationUrl?: string;
  category?: 'ORGANIC' | 'QUALITY' | 'SAFETY' | 'SUSTAINABILITY' | 'ORIGIN';
  logoId?: string;
  documentIds: string[];
  source?: 'CATALOG' | 'MANUAL';
}

export interface ApiProductionMedia {
  id: string;
  url?: string;
}

export interface ApiProductionInfo {
  story: string;
  farmName: string;
  origin: string;
  producerName?: string;
  productionMethod: string;
  sustainabilityInfo?: string;
  animalWelfare?: string;
  artisanProcess?: string;
  practices: string[];
  harvestDate?: string;
  productionDate?: string;
  expiryDate?: string;
  batchNumber: string;
  media: ApiProductionMedia[];
}

export interface ApiProductAttribute {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  value: string | number | boolean;
  unit?: string;
  visible: boolean;
  description?: string;
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
  shippingClass?: string;
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
  priceTiers: ApiPriceTier[];
  nutritionalInfo?: ApiNutritionalInfo;
  certifications: ApiCertification[];
  productionInfo?: ApiProductionInfo;
  attributes: ApiProductAttribute[];
  lastOrderDate?: string;
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
  PENDING_APPROVAL: 'pending_approval',
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
  // Si el backend no devuelve url (campo null o vacío), construirla desde la clave S3
  // usando la variable de entorno NEXT_PUBLIC_CDN_BASE_URL.
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL ?? '';
  const url = img.url || (cdnBase && img.key ? `${cdnBase}/${img.key}` : '');
  return {
    id: img.key,           // La clave S3 actúa como identificador único de la imagen
    url,
    alt: productName,
    isMain,
    sortOrder,
  };
}

function mapPriceTier(tier: ApiPriceTier): PriceTier {
  return {
    id: tier.id,
    minQuantity: tier.minQuantity,
    maxQuantity: tier.maxQuantity,
    type: tier.type.toLowerCase() as PriceTier['type'],
    value: tier.value,
    buyQuantity: tier.buyQuantity,
    payQuantity: tier.payQuantity,
    label: tier.label,
    savings: tier.savings,
  };
}

function mapNutritionalInfo(info?: ApiNutritionalInfo): NutritionalInfo | undefined {
  if (!info) return undefined;
  return {
    servingSize: info.servingSize,
    servingSizeValue: info.servingSizeValue,
    servingSizeUnit: info.servingSizeUnit,
    calories: info.calories,
    protein: info.protein,
    totalFat: info.totalFat,
    saturatedFat: info.saturatedFat,
    transFat: info.transFat,
    cholesterol: info.cholesterol,
    sodium: info.sodium,
    carbohydrates: info.carbohydrates,
    dietaryFiber: info.dietaryFiber,
    sugars: info.sugars,
    addedSugars: info.addedSugars,
    allergens: info.allergens ?? [],
    mayContain: info.mayContain ?? [],
    ingredients: info.ingredients ?? [],
    preparationInstructions: info.preparationInstructions ?? '',
    storageInstructions: info.storageInstructions ?? '',
    isGlutenFree: info.isGlutenFree,
    isLactoseFree: info.isLactoseFree,
    isVegan: info.isVegan,
    isVegetarian: info.isVegetarian,
    isNutFree: info.isNutFree,
    isEggFree: info.isEggFree,
    isSoyFree: info.isSoyFree,
    vitamins: (info.vitamins ?? []).map((vitamin) => ({
      id: vitamin.id,
      name: vitamin.name,
      amount: vitamin.amount,
      unit: vitamin.unit,
      dailyValue: vitamin.dailyValue,
    })),
  };
}

function mapCertification(item: ApiCertification): Certification {
  return {
    id: item.certificationId,
    name: item.name,
    issuingBody: item.issuingBody,
    certificateNumber: item.certificateNumber,
    issueDate: item.issueDate ? new Date(item.issueDate) : undefined,
    expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
    status: item.status.toLowerCase() as Certification['status'],
    verified: item.verified,
    verificationUrl: item.verificationUrl,
    category: item.category?.toLowerCase() as Certification['category'] | undefined,
    source: item.source === 'MANUAL' ? 'manual' : 'catalog',
    documents: (item.documentIds ?? []).map((id) => ({
      id,
      name: id,
      url: id,
      size: 0,
      type: 'application/octet-stream',
      uploadedAt: new Date(),
    })),
  };
}

function mapProductionInfo(info?: ApiProductionInfo): ProductionInfo | undefined {
  if (!info) return undefined;
  return {
    story: info.story,
    farmName: info.farmName,
    origin: info.origin,
    producerName: info.producerName,
    productionMethod: info.productionMethod,
    sustainabilityInfo: info.sustainabilityInfo ?? '',
    animalWelfare: info.animalWelfare ?? '',
    artisanProcess: info.artisanProcess ?? '',
    practices: info.practices ?? [],
    harvestDate: info.harvestDate ? new Date(info.harvestDate) : undefined,
    productionDate: info.productionDate ? new Date(info.productionDate) : undefined,
    expiryDate: info.expiryDate ? new Date(info.expiryDate) : undefined,
    batchNumber: info.batchNumber,
    media: (info.media ?? []).map((media, index) => ({
      id: media.id,
      type: 'image',
      url: media.url ?? media.id,
      sortOrder: index,
    })),
  };
}

function mapAttribute(attribute: ApiProductAttribute): DynamicAttribute {
  return {
    id: attribute.id,
    name: attribute.name,
    type: attribute.type.toLowerCase() as DynamicAttribute['type'],
    value: attribute.value,
    unit: attribute.unit,
    visible: attribute.visible,
    description: attribute.description,
  };
}

/**
 * Mapea un producto de la API al tipo Product del frontend.
 * Los campos complejos ya pueden venir en detalle y en listados protegidos del dashboard.
 */
export function mapApiProductToProduct(api: ApiProduct): Product {
  // Mapear imagen principal — usar cuando exista key o url (la función mapApiImage
  // construirá la url a partir de la clave S3 si url viene nulo del backend).
  const mainImage: ProductImage | undefined = api.mainImage
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
    subcategoryName:  api.subcategoryName,
    tags:             api.tags ?? [],

    mainImage,
    gallery,

    basePrice:    api.basePrice,
    comparePrice: api.comparePrice,
    priceTiers:   (api.priceTiers ?? []).map(mapPriceTier),

    sku:              api.sku,
    barcode:          api.barcode,
    stock:            api.stock,
    lowStockThreshold: api.lowStockThreshold,
    trackInventory:   api.trackInventory,
    allowBackorders:  api.allowBackorders,

    weight:        api.weight,
    weightUnit:    api.weightUnit as 'kg' | 'g' | undefined,
    dimensions:    api.dimensions as Dimensions | undefined,
    shippingClass: api.shippingClass,

    nutritionalInfo: mapNutritionalInfo(api.nutritionalInfo),
    certifications:  (api.certifications ?? []).map(mapCertification),
    productionInfo:  mapProductionInfo(api.productionInfo),
    attributes:      (api.attributes ?? []).map(mapAttribute),

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
    lastOrderDate: api.lastOrderDate ? new Date(api.lastOrderDate) : undefined,
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
    active:           'ACTIVE',
    draft:            'DRAFT',
    inactive:         'INACTIVE',
    out_of_stock:     'OUT_OF_STOCK',
    pending_approval: 'PENDING_APPROVAL',
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
