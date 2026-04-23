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
  animalWelfare: string;
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
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  reorderPoint?: number;
  maxStock?: number;
}

// ============================================================================
// TIPO PRODUCTO PRINCIPAL
// ============================================================================

export interface Product {
  id: string;
  producerId: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tags: string[];
  mainImage?: ProductImage;
  gallery: ProductImage[];
  basePrice: number;
  comparePrice?: number;
  priceTiers: PriceTier[];
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders?: boolean;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  nutritionalInfo?: NutritionalInfo;
  certifications: Certification[];
  productionInfo?: ProductionInfo;
  attributes: DynamicAttribute[];
  status: 'draft' | 'pending_approval' | 'active' | 'inactive' | 'out_of_stock' | 'scheduled';
  visibility: 'public' | 'private' | 'password';
  publishedAt?: Date;
  scheduledAt?: Date;
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
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tags: string[];
  mainImage?: ProductImage;
  gallery: ProductImage[];
  basePrice?: number;
  comparePrice?: number;
  priceTiers: PriceTier[];
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders?: boolean;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  nutritionalInfo: NutritionalInfo;
  certifications: Certification[];
  productionInfo: ProductionInfo;
  attributes: DynamicAttribute[];
  status: 'draft' | 'pending_approval' | 'active' | 'scheduled';
  visibility: 'public' | 'private' | 'password';
}

// ============================================================================
// CONSTANTES Y VALORES POR DEFECTO
// ============================================================================

export const FORM_STEPS = [
  { id: 'basic', label: 'Básico', icon: 'Package' },
  { id: 'images', label: 'Imágenes', icon: 'Camera' },
  { id: 'pricing', label: 'Precios', icon: 'DollarSign' },
  { id: 'nutritional', label: 'Nutricional', icon: 'FlaskConical' },
  { id: 'production', label: 'Producción', icon: 'Leaf' },
  { id: 'inventory', label: 'Inventario', icon: 'ShoppingBag' },
  { id: 'certifications', label: 'Certificaciones', icon: 'Award' },
] as const;

export type FormStepId = typeof FORM_STEPS[number]['id'];

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
  animalWelfare: '',
  artisanProcess: '',
  practices: [],
  media: [],
};

export const defaultFormData: ProductFormData = {
  name: '',
  shortDescription: '',
  fullDescription: '',
  categoryId: '',
  categoryName: '',
  subcategoryId: '',
  tags: [],
  mainImage: undefined,
  gallery: [],
  basePrice: undefined,
  comparePrice: undefined,
  priceTiers: [],
  sku: '',
  barcode: '',
  stock: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorders: false,
  weight: undefined,
  weightUnit: 'kg',
  dimensions: undefined,
  shippingClass: '',
  nutritionalInfo: defaultNutritionalInfo,
  certifications: [],
  productionInfo: defaultProductionInfo,
  attributes: [],
  status: 'draft',
  visibility: 'private',
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