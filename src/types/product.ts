/**
 * @file product.ts
 * @description Tipos completos para la gestión de productos (UNIFICADO)
 */

// ============================================================================
// TIPO PARA DOCUMENTOS - DEFINICIÓN ÚNICA
// ============================================================================

export interface DocumentFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  file?: File;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

// ============================================================================
// TIPO PARA IMÁGENES
// ============================================================================

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  isMain: boolean;
  sortOrder: number;
  file?: File | null;
  progress?: number;
  uploading?: boolean;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  /** Punto focal (% 0-100) del recorte de la imagen principal; ausente = centro. */
  focusX?: number;
  focusY?: number;
}

// ============================================================================
// TIPOS DE PRECIOS
// ============================================================================

export interface PriceTier {
  id: string;
  minQuantity: number;
  maxQuantity?: number;
  type: 'fixed' | 'percentage' | 'bundle';
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  label?: string;
  savings?: number;
}

// ============================================================================
// TIPOS DE INFORMACIÓN NUTRICIONAL
// ============================================================================

export interface VitaminInfo {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  dailyValue?: number;
}

export interface NutritionalInfo {
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
  vitamins: VitaminInfo[];
  allergens: string[];
  mayContain: string[];
  ingredients: string[];
  preparationInstructions: string;
  storageInstructions: string;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isNutFree?: boolean;
  isEggFree?: boolean;
  isSoyFree?: boolean;
}

// ============================================================================
// TIPOS DE CERTIFICACIONES - DEFINICIÓN ÚNICA
// ============================================================================

export type CertificationStatus = 'active' | 'expired' | 'pending' | 'under_review' | 'UNDER_REVIEW' | 'rejected' | 'REJECTED';
export type CertificationCategory = 'organic' | 'quality' | 'safety' | 'sustainability' | 'origin';

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  certificateNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  status: CertificationStatus;
  verified: boolean;
  documents?: DocumentFile[];
  verificationUrl?: string;
  category?: CertificationCategory;
  logo?: string;
  /** 'manual' = añadida por el productor manualmente; 'catalog' = seleccionada del catálogo oficial */
  source?: 'catalog' | 'manual';
  /** Notas del admin si la certificación fue rechazada */
  reviewNotes?: string;
}

// Para compatibilidad (opcional)
export interface ProductCertification extends Certification {
  certificationId?: string;
}

// ============================================================================
// TIPOS DE ATRIBUTOS DINÁMICOS
// ============================================================================

export type NetContentUnit = 'g' | 'kg' | 'ml' | 'l' | 'ud';

export const NET_CONTENT_UNIT_LABELS: Record<NetContentUnit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  ud: 'unidades',
};

export type AttributeType = 'text' | 'number' | 'boolean' | 'date';

export interface DynamicAttribute {
  id: string;
  name: string;
  type: AttributeType;
  value: string | number | boolean;
  unit?: string;
  visible: boolean;
  example?: string;
  description?: string;
}

export interface ProductAttribute extends DynamicAttribute {}

// ============================================================================
// TIPOS DE PRODUCCIÓN
// ============================================================================

export interface ProductionMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  preview?: string;
  thumbnail?: string;
  file?: File | null;
  sortOrder?: number;
  caption?: string;
  width?: number;
  height?: number;
  size?: number;
  uploading?: boolean;
  progress?: number;
  error?: string;
  alt?: string;
}

export interface ProductionInfo {
  story: string;
  farmName: string;
  origin: string;
  productionMethod: string;
  harvestDate?: Date;
  productionDate?: Date;
  expiryDate?: Date;
  batchNumber: string;
  sustainabilityInfo: string;
  artisanProcess: string;
  practices: string[];
  media: ProductionMedia[];
  producerName?: string;
}

// ============================================================================
// TIPOS DE INVENTARIO
// ============================================================================

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: 'cm' | 'm';
}

export interface InventoryData {
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  /** Contenido neto que se vende (cantidad a la que corresponde el precio). */
  netContent?: number;
  netContentUnit?: NetContentUnit;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  reorderPoint?: number;
  maxStock?: number;
}

// ============================================================================
// TIPOS DE OFERTAS FLASH
// ============================================================================

export interface FlashDeal {
  id: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  isCurrentlyActive: boolean;
  effectivePrice?: number;
  stacksWithTiers: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Resumen de la oferta flash vigente embebido en `Product.flashDeal` (lo que
 * de verdad devuelve el backend ahí — `FlashDealSummaryDto`, más reducido
 * que `FlashDeal`: sin startsAt/isActive/isCurrentlyActive). Antes de
 * corregir este tipo, `mapApiProductToProduct` nunca llegaba a rellenar
 * `Product.flashDeal` (no estaba ni en `ApiProduct`), así que cualquier
 * `!!product.flashDeal` leído desde `fetchProducts`/`fetchProductById`
 * siempre daba `false` — hallazgo corregido en el mismo ciclo que añadió el
 * primer consumidor real de este campo (selector de producto de "Ofertas
 * por cantidad", 2026-10-08).
 */
export interface FlashDealSummary {
  id: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  endsAt?: Date;
  effectivePrice?: number;
  stacksWithTiers: boolean;
}

export interface FlashDealWithProduct extends FlashDeal {
  productId: string;
  productName: string;
  productSlug: string;
  productMainImageUrl?: string | null;
  productBasePrice: number;
  /** Indica si el producto es visible en el catálogo público (status=ACTIVE y visibility=PUBLIC) */
  productVisible?: boolean;
  /** Status crudo del producto (ej: 'pending_approval', 'inactive', 'draft') — opcional */
  productStatus?: string;
}

export interface FlashDealFormValue {
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startsAt: string;
  endsAt: string;
}

// ============================================================================
// TIPOS DE OFERTAS POR CANTIDAD (gestión granular — petición del humano,
// 2026-10-08: sección "Ofertas por cantidad" independiente del alta/edición
// de producto, espejo de Ofertas flash). `type` en MAYÚSCULAS — mismo
// convenio que FlashDeal.discountType, distinto del `PriceTier.type` en
// minúsculas que usa (y seguirá usando) el formulario de producto.
// ============================================================================

export interface QuantityOffer {
  id: string;
  minQuantity: number;
  maxQuantity?: number | null;
  type: 'FIXED' | 'PERCENTAGE' | 'BUNDLE';
  value?: number | null;
  buyQuantity?: number | null;
  payQuantity?: number | null;
  label?: string | null;
  isActive: boolean;
  offerPrice: number;
  savings: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuantityOfferWithProduct extends QuantityOffer {
  productId: string;
  productName: string;
  productSlug: string;
  productMainImageUrl?: string | null;
  productBasePrice: number;
  productVisible?: boolean;
  productStatus?: string;
}

// ============================================================================
// TIPOS DE VARIANTES DE PRODUCTO (estilo Shopify — petición del humano,
// 2026-10-08: "además del precio, se podrá configurar las variantes que
// puede tener ese producto... se puede replicar cómo se configura esto en
// Shopify"). Alcance de esta primera versión: solo modelo + edición en el
// dashboard, sin conectar todavía al checkout/carrito. Hasta 3 opciones por
// producto (p. ej. "Tamaño"), cada variante es una combinación concreta de
// hasta 3 valores (option1Value/option2Value/option3Value, mismo modelo
// denormalizado que usa Shopify) con su propio precio/stock/SKU.
// ============================================================================

export interface ProductOptionValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface ProductOption {
  id: string;
  name: string;
  sortOrder: number;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  option1Value?: string;
  option2Value?: string;
  option3Value?: string;
  /** Generado por el backend (coherente con el SKU del producto) -- nunca editable. */
  sku?: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  trackInventory: boolean;
  /** Peso de ESTA variante con embalaje, para envío (petición del humano, 2026-10-09). */
  weight?: number;
  weightUnit?: 'kg' | 'g';
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

// ============================================================================
// TIPO PRODUCTO PRINCIPAL
// ============================================================================

export interface Product {
  id: string;
  producerId: string;
  name: string;
  slug: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  mainImage?: ProductImage;
  gallery: ProductImage[];
  basePrice: number;
  comparePrice?: number;
  priceTiers: PriceTier[];
  flashDeal?: FlashDealSummary;
  /** Decisión explícita del productor: precio/stock/peso/SKU únicos (false) o por variante (true). */
  hasVariants: boolean;
  options: ProductOption[];
  variants: ProductVariant[];
  sku: string;
  barcode?: string;
  stock: number;
  reservedStock?: number; // Cantidad reservada en pedidos pendientes (H1-Etapa2)
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders?: boolean;
  /** Contenido neto que se vende (cantidad a la que corresponde el precio). */
  netContent?: number;
  netContentUnit?: NetContentUnit;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  nutritionalInfo?: NutritionalInfo;
  certifications: Certification[];
  productionInfo?: ProductionInfo;
  attributes: DynamicAttribute[];
  status: 'draft' | 'pending_approval' | 'active' | 'inactive' | 'out_of_stock';
  visibility: 'public' | 'private' | 'password';
  publishedAt?: Date;
  /** Campos que dispararon la última transición automática a PENDING_APPROVAL */
  lastReviewTriggerFields?: string[];
  /** Legacy, no usar -- el backend ya no lo actualiza. Ver hasPendingRevision. */
  hasUnreviewedChanges?: boolean;
  /** Propuesta de cambios sensibles pendiente de aprobación por un admin (ProductPendingRevision). Aplica tanto a un producto ACTIVE/OUT_OF_STOCK editado como a uno INACTIVE que ya estuvo publicado antes. */
  hasPendingRevision?: boolean;
  sales?: number;
  revenue?: number;
  rating?: number;
  reviewCount?: number;
  views?: number;
  conversion?: number;
  organicScore?: number;
  createdAt: Date;
  updatedAt: Date;
  lastOrderDate?: Date;
}

// ============================================================================
// TIPO PARA FORMULARIO
// ============================================================================

export interface ProductFormData {
  name: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  mainImage?: ProductImage;
  gallery: ProductImage[];
  basePrice?: number;
  comparePrice?: number;
  /** Decisión explícita del productor, elegida al principio del paso unificado de precios/variantes/inventario (petición del humano, 2026-10-09): precio/stock/peso/SKU únicos (false) o por variante (true). */
  hasVariants: boolean;
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders?: boolean;
  /** Contenido neto que se vende (cantidad a la que corresponde el precio). */
  netContent?: number;
  netContentUnit?: NetContentUnit;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  nutritionalInfo: NutritionalInfo;
  certifications: Certification[];
  productionInfo: ProductionInfo;
  attributes: DynamicAttribute[];
  status: 'draft' | 'pending_approval' | 'active';
}

// ============================================================================
// CONSTANTES Y VALORES POR DEFECTO
// ============================================================================

export const FORM_STEPS = [
  { id: 'basic', label: 'Básico', icon: 'Package' },
  { id: 'images', label: 'Imágenes', icon: 'Camera' },
  // Precios, variantes e inventario unificados en un solo paso (petición del
  // humano, 2026-10-09: "unificar para no duplicar trabajo"). Antes eran 3
  // pasos separados (Precios, Variantes justo después, Inventario más
  // adelante) y el productor rellenaba precio/stock/SKU del producto único
  // ANTES de decidir si en realidad tiene variantes -- con el toggle "¿Tiene
  // variantes?" al principio de este paso (ver StepPricingInventory), la
  // decisión es lo primero y el resto de la pantalla se adapta sin volver a
  // pedir nada dos veces. Conserva el id 'pricing' (no uno nuevo) para no
  // tener que migrar completedTabs/REQUIRED_STEPS_FOR_PUBLISH guardados.
  { id: 'pricing', label: 'Precio e inventario', icon: 'DollarSign' },
  { id: 'nutritional', label: 'Nutricional', icon: 'FlaskConical' },
  { id: 'production', label: 'Producción', icon: 'Leaf' },
  // Certificaciones se mantiene como ÚLTIMO paso a propósito: create/page.tsx,
  // [id]/edit/page.tsx y CreateProductNavigation.tsx derivan "¿es el último
  // paso?" de la posición en este array (FORM_STEPS.length - 1) para decidir
  // dónde mostrar el botón "Publicar" y los avisos de certificaciones
  // pendientes -- insertar un paso nuevo DESPUÉS de "certifications" movería
  // esa UI al paso nuevo sin querer.
  { id: 'certifications', label: 'Certificaciones', icon: 'Award' },
] as const;

export type FormStepId = typeof FORM_STEPS[number]['id'];

/** Posición (1-indexada) de un paso en el wizard -- para el badge "Paso X de N", calculada en vez de hardcodeada para que un reordenamiento de FORM_STEPS no la desincronice. */
export function stepPosition(id: FormStepId): number {
  return FORM_STEPS.findIndex((s) => s.id === id) + 1;
}

export const defaultNutritionalInfo: NutritionalInfo = {
  servingSize: '100g',
  servingSizeValue: 100,
  servingSizeUnit: 'g',
  calories: undefined,
  protein: undefined,
  totalFat: undefined,
  saturatedFat: undefined,
  transFat: undefined,
  cholesterol: undefined,
  sodium: undefined,
  carbohydrates: undefined,
  dietaryFiber: undefined,
  sugars: undefined,
  addedSugars: undefined,
  vitamins: [],
  allergens: [],
  mayContain: [],
  ingredients: [],
  preparationInstructions: '',
  storageInstructions: '',
  isGlutenFree: false,
  isLactoseFree: false,
  isVegan: false,
  isVegetarian: false,
  isNutFree: false,
  isEggFree: false,
  isSoyFree: false,
};

export const defaultProductionInfo: ProductionInfo = {
  story: '',
  farmName: '',
  origin: '',
  productionMethod: '',
  harvestDate: undefined,
  productionDate: undefined,
  expiryDate: undefined,
  batchNumber: '',
  sustainabilityInfo: '',
  artisanProcess: '',
  practices: [],
  media: [],
};

export const defaultFormData: ProductFormData = {
  name: '',
  fullDescription: '',
  categoryId: '',
  categoryName: '',
  subcategoryId: '',
  mainImage: undefined,
  gallery: [],
  basePrice: undefined,
  comparePrice: undefined,
  hasVariants: false,
  sku: '',
  barcode: '',
  stock: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorders: false,
  netContent: undefined,
  netContentUnit: 'g',
  weight: undefined,
  weightUnit: 'kg',
  dimensions: undefined,
  shippingClass: '',
  nutritionalInfo: defaultNutritionalInfo,
  certifications: [],
  productionInfo: defaultProductionInfo,
  attributes: [],
  status: 'draft',
};

// ============================================================================
// CONSTANTES COMPARTIDAS
// ============================================================================

export const ALLERGENS = [
  'Gluten',
  'Crustáceos',
  'Huevos',
  'Pescado',
  'Cacahuetes',
  'Soja',
  'Lácteos',
  'Frutos de cáscara',
  'Apio',
  'Mostaza',
  'Sésamo',
  'Sulfitos',
  'Altramuces',
  'Moluscos',
];