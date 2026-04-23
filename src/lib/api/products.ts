/**
 * @file products.ts
 * @description Capa de acceso a datos de productos para el dashboard.
 *              Conecta con el API Gateway (products-service) a través de `gatewayClient`.
 *
 * Todas las funciones devuelven `ApiResponse<T>` para mantener compatibilidad
 * con los consumidores existentes (pages, hooks, dialogs) que comprueban
 * `response.error` antes de usar `response.data`.
 *
 * La transformación entre el formato del backend (UPPER_CASE, imágenes { key, url })
 * y el tipo `Product` del frontend se delega completamente a `products-mapper.ts`.
 */

import { gatewayClient, GatewayError } from './client';
import { type Product, type ProductFormData } from '@/types/product';
import { uploadFile } from './media';
import {
  type ApiProduct,
  type ApiProductsListResponse,
  mapApiProductToProduct,
  mapApiProducts,
  mapStatusToApi,
  mapVisibilityToApi,
  type ProductStats,
} from './products-mapper';

// ─── TIPOS DE RESPUESTA ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationError[];
}

export interface CreateProductResponse {
  product: Product;
  redirectUrl: string;
}

export interface ProductFacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ProductFacetsResponse {
  categories: ProductFacetCategory[];
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

/**
 * Normaliza cualquier error en un `ApiResponse` estandarizado.
 * Preserva el status HTTP si el error proviene del gateway.
 */
function handleError<T>(error: unknown, context: string): ApiResponse<T> {
  console.error(`[products] Error en ${context}:`, error);
  if (error instanceof GatewayError) {
    return { error: error.message, status: error.status };
  }
  return { error: `Error inesperado en ${context}`, status: 500 };
}

/**
 * Traduce el `sortBy` del dashboard al formato que acepta products-service.
 * Los valores no reconocidos se mapean a 'newest' como fallback seguro.
 */
function mapSortBy(sortBy?: string): string | undefined {
  if (!sortBy) return undefined;
  const map: Record<string, string> = {
    newest:       'newest',
    oldest:       'oldest',
    'name-asc':   'name_asc',
    'name-desc':  'name_desc',
    'price-asc':  'price_asc',
    'price-desc': 'price_desc',
    'stock-asc':  'stock_asc',
    'stock-desc': 'stock_desc',
    'sales-desc': 'sales',
  };
  return map[sortBy] ?? 'newest';
}

function mapPriceTierType(type: string): string {
  const map: Record<string, string> = {
    fixed: 'FIXED',
    percentage: 'PERCENTAGE',
    bundle: 'BUNDLE',
  };
  return map[type] ?? 'FIXED';
}

function mapCertificationStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'ACTIVE',
    expired: 'EXPIRED',
    pending: 'PENDING',
  };
  return map[status] ?? 'PENDING';
}

function mapCertificationCategory(category?: string): string | undefined {
  if (!category) return undefined;
  return category.toUpperCase();
}

function isHttpUrl(url?: string): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}

async function normalizeProductImagesForApi(
  images: Product['gallery'],
  productId?: string,
): Promise<Product['gallery']> {
  const normalized = await Promise.all(images.map(async (image, index) => {
    // Imagen ya subida a S3: tiene URL HTTP y no hay archivo pendiente de subir
    if (isHttpUrl(image.url) && !image.file) {
      return image;
    }

    // Sin archivo: la imagen se perdió (p.ej. tras recargar desde localStorage)
    if (!image.file) {
      throw new Error(
        `La imagen ${index + 1} se perdió al recargar la página. Vuelve a añadirla antes de guardar.`
      );
    }

    const uploadCategory = productId
      ? `products/${productId}/images`
      : 'products/drafts/images';

    const uploaded = await uploadFile(image.file as File, uploadCategory, {
      entityType: 'products',
      entityId: productId,
    });
    if (!uploaded.url) {
      throw new Error(`No se pudo obtener la URL pública para la imagen ${index + 1}.`);
    }

    return {
      ...image,
      id: uploaded.key,
      url: uploaded.url,
      file: null,
      uploading: false,
      progress: 100,
    };
  }));

  return normalized;
}

async function normalizeFormDataBeforeSubmit(formData: ProductFormData): Promise<ProductFormData> {
  if (!formData.gallery?.length) {
    return formData;
  }

  const normalizedGallery = await normalizeProductImagesForApi(formData.gallery);
  const normalizedMain = normalizedGallery.find((img) => img.isMain) ?? normalizedGallery[0];

  return {
    ...formData,
    gallery: normalizedGallery,
    mainImage: normalizedMain,
  };
}

async function normalizePartialProductBeforeSubmit(productData: Partial<Product>): Promise<Partial<Product>> {
  if (!productData.gallery) {
    return productData;
  }

  const normalizedGallery = await normalizeProductImagesForApi(productData.gallery, productData.id);
  const normalizedMain = productData.mainImage
    ? normalizedGallery.find((image) => image.id === productData.mainImage?.id)
    : normalizedGallery.find((image) => image.isMain);

  return {
    ...productData,
    gallery: normalizedGallery,
    mainImage: normalizedMain ?? productData.mainImage,
  };
}

function mapAttributeType(type: string): string {
  const map: Record<string, string> = {
    text: 'TEXT',
    number: 'NUMBER',
    boolean: 'BOOLEAN',
    date: 'DATE',
  };
  return map[type] ?? 'TEXT';
}

/**
 * Convierte un `ProductFormData` del frontend al cuerpo JSON que espera
 * el endpoint POST /products del products-service.
 *
 * - Imágenes: `ProductImage { id (=S3 key), url }` → `mainImageUrl/Key` + `galleryImageUrls/Keys[]`
 * - Estado:   `'active'` → `'ACTIVE'` (Prisma enum)
 * - SKU vacío: omitido para que el backend lo genere automáticamente
 */
function formDataToApiBody(formData: ProductFormData): Record<string, unknown> {
  return {
    name:              formData.name,
    shortDescription:  formData.shortDescription,
    fullDescription:   formData.fullDescription || undefined,
    categoryId:        formData.categoryId,
    subcategoryId:     formData.subcategoryId || undefined,
    tags:              formData.tags,

    // Imágenes S3 — el frontend almacena la key en ProductImage.id
    mainImageUrl:      formData.mainImage?.url,
    mainImageKey:      formData.mainImage?.id,
    galleryImageUrls:  formData.gallery.map(img => img.url),
    galleryImageKeys:  formData.gallery.map(img => img.id),

    basePrice:         formData.basePrice,
    comparePrice:      formData.comparePrice || undefined,
    priceTiers:        formData.priceTiers.map((tier) => ({
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      type: mapPriceTierType(tier.type),
      value: tier.value,
      buyQuantity: tier.buyQuantity,
      payQuantity: tier.payQuantity,
      label: tier.label,
      savings: Math.max(0, tier.savings ?? 0),
    })),

    // El backend genera el SKU si está vacío
    sku:               formData.sku || undefined,
    barcode:           formData.barcode || undefined,

    stock:             formData.stock,
    lowStockThreshold: formData.lowStockThreshold,
    trackInventory:    formData.trackInventory,
    allowBackorders:   formData.allowBackorders,

    weight:     formData.weight,
    weightUnit: formData.weightUnit,
    dimensions: formData.dimensions,
    shippingClass: formData.shippingClass || undefined,

    // Solo enviar nutritionalInfo si el productor rellenó datos reales (no solo el default de porción)
    nutritionalInfo: (
      (formData.nutritionalInfo?.servingSizeValue ?? 0) > 0 &&
      (
        formData.nutritionalInfo?.calories != null ||
        formData.nutritionalInfo?.protein != null ||
        formData.nutritionalInfo?.totalFat != null ||
        (formData.nutritionalInfo?.ingredients?.length ?? 0) > 0 ||
        (formData.nutritionalInfo?.allergens?.length ?? 0) > 0
      )
    )
      ? {
          servingSize: formData.nutritionalInfo.servingSize,
          servingSizeValue: formData.nutritionalInfo.servingSizeValue,
          servingSizeUnit: formData.nutritionalInfo.servingSizeUnit,
          calories: formData.nutritionalInfo.calories,
          protein: formData.nutritionalInfo.protein,
          totalFat: formData.nutritionalInfo.totalFat,
          saturatedFat: formData.nutritionalInfo.saturatedFat,
          transFat: formData.nutritionalInfo.transFat,
          cholesterol: formData.nutritionalInfo.cholesterol,
          sodium: formData.nutritionalInfo.sodium,
          carbohydrates: formData.nutritionalInfo.carbohydrates,
          dietaryFiber: formData.nutritionalInfo.dietaryFiber,
          sugars: formData.nutritionalInfo.sugars,
          addedSugars: formData.nutritionalInfo.addedSugars,
          allergens: formData.nutritionalInfo.allergens,
          mayContain: formData.nutritionalInfo.mayContain,
          ingredients: formData.nutritionalInfo.ingredients,
          preparationInstructions: formData.nutritionalInfo.preparationInstructions,
          storageInstructions: formData.nutritionalInfo.storageInstructions,
          isGlutenFree: formData.nutritionalInfo.isGlutenFree,
          isLactoseFree: formData.nutritionalInfo.isLactoseFree,
          isVegan: formData.nutritionalInfo.isVegan,
          isVegetarian: formData.nutritionalInfo.isVegetarian,
          isNutFree: formData.nutritionalInfo.isNutFree,
          isEggFree: formData.nutritionalInfo.isEggFree,
          isSoyFree: formData.nutritionalInfo.isSoyFree,
          vitamins: formData.nutritionalInfo.vitamins,
        }
      : undefined,
    certifications: formData.certifications.map((certification) => ({
      // Para certs manuales (source === 'manual') no se envía certificationId;
      // el backend las identifica por name + issuingBody y crea el registro maestro.
      certificationId: certification.source === 'catalog' ? (certification.id || undefined) : undefined,
      name: certification.name || undefined,
      issuingBody: certification.issuingBody || undefined,
      certificateNumber: certification.certificateNumber || undefined,
      issueDate: certification.issueDate?.toISOString(),
      expiryDate: certification.expiryDate?.toISOString(),
      status: mapCertificationStatus(certification.status),
      verified: false, // Productores no pueden auto-verificar
      verificationUrl: certification.verificationUrl || undefined,
      category: mapCertificationCategory(certification.category),
      // documentIds contiene S3 keys reales (tras subida en DocumentUploader)
      documentIds: certification.documents?.map((document) => document.id) ?? [],
    })),
    // Solo enviar productionInfo si el productor rellenó al menos un campo significativo
    productionInfo: (
      formData.productionInfo?.story ||
      formData.productionInfo?.farmName ||
      formData.productionInfo?.origin ||
      formData.productionInfo?.productionMethod ||
      formData.productionInfo?.batchNumber
    )
      ? {
          story: formData.productionInfo.story,
          farmName: formData.productionInfo.farmName,
          origin: formData.productionInfo.origin,
          producerName: formData.productionInfo.producerName,
          productionMethod: formData.productionInfo.productionMethod,
          sustainabilityInfo: formData.productionInfo.sustainabilityInfo,
          animalWelfare: formData.productionInfo.animalWelfare,
          artisanProcess: formData.productionInfo.artisanProcess,
          practices: formData.productionInfo.practices,
          harvestDate: formData.productionInfo.harvestDate?.toISOString(),
          productionDate: formData.productionInfo.productionDate?.toISOString(),
          expiryDate: formData.productionInfo.expiryDate?.toISOString(),
          batchNumber: formData.productionInfo.batchNumber,
          media: formData.productionInfo.media.map((media) => ({ id: media.id, url: media.url })),
        }
      : undefined,
    attributes: formData.attributes.map((attribute) => ({
      name: attribute.name,
      type: mapAttributeType(attribute.type),
      value: attribute.value,
      unit: attribute.unit,
      visible: attribute.visible,
      description: attribute.description,
    })),

    status:     mapStatusToApi(formData.status),
    visibility: mapVisibilityToApi(formData.visibility),
  };
}

/**
 * Convierte un `Partial<Product>` al cuerpo JSON del endpoint PUT /products/:id.
 * Solo incluye los campos que están presentes (no undefined) para evitar
 * sobreescribir campos no modificados con valores null.
 */
function partialProductToApiBody(product: Partial<Product>): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  const scalar: Array<keyof Product> = [
    'name', 'shortDescription', 'fullDescription', 'categoryId', 'subcategoryId',
    'tags', 'basePrice', 'comparePrice', 'sku', 'barcode', 'stock',
    'lowStockThreshold', 'trackInventory', 'allowBackorders',
    'weight', 'weightUnit', 'dimensions', 'shippingClass',
  ];

  for (const key of scalar) {
    if (product[key] !== undefined) body[key] = product[key];
  }

  // Los productores solo pueden enviar DRAFT o PENDING_APPROVAL en un PUT.
  // ACTIVE y OUT_OF_STOCK los gestiona el backend automáticamente (por stock).
  const PRODUCER_PUT_ALLOWED_STATUSES = ['draft', 'pending_approval', 'inactive'];
  if (product.status !== undefined && PRODUCER_PUT_ALLOWED_STATUSES.includes(product.status)) {
    body.status = mapStatusToApi(product.status);
  }
  if (product.visibility !== undefined) body.visibility = mapVisibilityToApi(product.visibility);

  // Imágenes S3
  if (product.mainImage !== undefined) {
    body.mainImageUrl = product.mainImage?.url ?? null;
    body.mainImageKey = product.mainImage?.id  ?? null;
  }
  if (product.gallery !== undefined) {
    body.galleryImageUrls = product.gallery.map(img => img.url);
    body.galleryImageKeys = product.gallery.map(img => img.id);
  }

  if (product.priceTiers !== undefined) {
    body.priceTiers = product.priceTiers.map((tier) => ({
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      type: mapPriceTierType(tier.type),
      value: tier.value,
      buyQuantity: tier.buyQuantity,
      payQuantity: tier.payQuantity,
      label: tier.label,
      savings: Math.max(0, tier.savings ?? 0),
    }));
  }

  if (product.nutritionalInfo !== undefined) {
    body.nutritionalInfo = product.nutritionalInfo
      ? {
          ...product.nutritionalInfo,
          vitamins: product.nutritionalInfo.vitamins,
        }
      : null;
  }

  if (product.certifications !== undefined) {
    body.certifications = product.certifications.map((certification) => ({
      // Para certs manuales no se envía certificationId (temp ID o sin registro en DB);
      // el backend las identifica por name + issuingBody y crea/reutiliza el registro maestro.
      certificationId: certification.source === 'catalog' ? certification.id : undefined,
      name: certification.name,
      issuingBody: certification.issuingBody,
      certificateNumber: certification.certificateNumber,
      issueDate: certification.issueDate?.toISOString(),
      expiryDate: certification.expiryDate?.toISOString(),
      status: mapCertificationStatus(certification.status),
      verified: certification.verified,
      verificationUrl: certification.verificationUrl,
      category: mapCertificationCategory(certification.category),
      documentIds: certification.documents?.map((document) => document.id) ?? [],
    }));
  }

  if (product.productionInfo !== undefined) {
    body.productionInfo = product.productionInfo
      ? {
          story: product.productionInfo.story,
          farmName: product.productionInfo.farmName,
          origin: product.productionInfo.origin,
          producerName: product.productionInfo.producerName,
          productionMethod: product.productionInfo.productionMethod,
          sustainabilityInfo: product.productionInfo.sustainabilityInfo,
          animalWelfare: product.productionInfo.animalWelfare,
          artisanProcess: product.productionInfo.artisanProcess,
          practices: product.productionInfo.practices,
          harvestDate: product.productionInfo.harvestDate?.toISOString(),
          productionDate: product.productionInfo.productionDate?.toISOString(),
          expiryDate: product.productionInfo.expiryDate?.toISOString(),
          batchNumber: product.productionInfo.batchNumber,
          media: product.productionInfo.media.map((media) => ({ id: media.id, url: media.url })),
        }
      : null;
  }

  if (product.attributes !== undefined) {
    body.attributes = product.attributes.map((attribute) => ({
      name: attribute.name,
      type: mapAttributeType(attribute.type),
      value: attribute.value,
      unit: attribute.unit,
      visible: attribute.visible,
      description: attribute.description,
    }));
  }

  return body;
}

// ─── VALIDACIONES (cliente) ───────────────────────────────────────────────────

/**
 * Valida los datos del formulario en el cliente antes de enviarlos.
 * Devuelve la lista de errores por campo para mostrar inline en el formulario.
 */
export const validateProductForm = (formData: ProductFormData): ValidationResponse => {
  const errors: ValidationError[] = [];

  if (!formData.name || formData.name.trim().length < 5) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 5 caracteres' });
  } else if (formData.name.length > 100) {
    errors.push({ field: 'name', message: 'El nombre no puede tener más de 100 caracteres' });
  }

  if (!formData.shortDescription || formData.shortDescription.trim().length < 20) {
    errors.push({ field: 'shortDescription', message: 'La descripción corta debe tener al menos 20 caracteres' });
  } else if (formData.shortDescription.length > 160) {
    errors.push({ field: 'shortDescription', message: 'La descripción corta no puede tener más de 160 caracteres' });
  }

  if (!formData.categoryId) {
    errors.push({ field: 'categoryId', message: 'Debes seleccionar una categoría' });
  }

  if (!formData.gallery || formData.gallery.length === 0) {
    errors.push({ field: 'gallery', message: 'Debes subir al menos una imagen' });
  }

  if (formData.basePrice !== undefined && formData.basePrice <= 0) {
    errors.push({ field: 'basePrice', message: 'El precio base debe ser mayor que 0' });
  }

  if (formData.stock < 0) {
    errors.push({ field: 'stock', message: 'El stock no puede ser negativo' });
  }

  if (formData.lowStockThreshold < 0) {
    errors.push({ field: 'lowStockThreshold', message: 'El umbral de stock bajo no puede ser negativo' });
  }

  return { valid: errors.length === 0, errors };
};

// ─── LISTADO Y CONSULTA ───────────────────────────────────────────────────────

/**
 * Obtiene los productos del productor autenticado con paginación y filtros.
 * Ruta backend: GET /products/producer/my-products
 *
 * El filtro `stock` se aplica localmente sobre la página recibida
 * porque el backend no expone un filtro de nivel de stock en este endpoint.
 * Para mayor precisión en paginación con filtro de stock, se puede
 * aumentar el límite o añadir el filtro al backend en el futuro.
 */
export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  stockState?: string;
  sortBy?: string;
}): Promise<ApiResponse<PaginatedResponse<Product>>> {
  try {
    // Construir query params para el backend
    const query: Record<string, string | number | undefined> = {
      page:   params?.page  ?? 1,
      limit:  params?.limit ?? 10,
      sortBy: mapSortBy(params?.sortBy),
    };

    if (params?.search)                                query.search    = params.search;
    if (params?.status && params.status !== 'todos')   query.status    = mapStatusToApi(params.status);
    if (params?.categoryId)                             query.categoryId = params.categoryId;
    if (params?.stockState)                            query.stockState = params.stockState;

    const raw = await gatewayClient.get<ApiProductsListResponse>(
      '/products/producer/my-products',
      { params: query as Record<string, string | number | boolean | undefined | null> },
    );

    const items = mapApiProducts(raw.data);

    return {
      data: {
        items,
        total: raw.total,
        page:       raw.page,
        limit:      raw.limit,
        totalPages: Math.ceil(raw.total / raw.limit),
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error, 'fetchProducts');
  }
}

/**
 * Obtiene un producto por su ID.
 * Ruta backend: GET /products/producer/my-products/:id
 */
export async function fetchProductById(id: string): Promise<ApiResponse<Product>> {
  try {
    const raw = await gatewayClient.get<ApiProduct>(`/products/producer/my-products/${id}`);
    return { data: mapApiProductToProduct(raw), status: 200 };
  } catch (error) {
    return handleError(error, 'fetchProductById');
  }
}

/**
 * Obtiene las estadísticas agregadas del productor desde el backend.
 */
export async function fetchProductStats(): Promise<ApiResponse<ProductStats>> {
  try {
    const raw = await gatewayClient.get<ProductStats>('/products/producer/my-products/stats');
    return { data: raw, status: 200 };
  } catch (error) {
    return handleError(error, 'fetchProductStats');
  }
}

export async function fetchProductFacets(): Promise<ApiResponse<ProductFacetsResponse>> {
  try {
    const raw = await gatewayClient.get<ProductFacetsResponse>('/products/producer/my-products/facets');
    return { data: raw, status: 200 };
  } catch (error) {
    return handleError(error, 'fetchProductFacets');
  }
}

// ─── CREACIÓN Y EDICIÓN ───────────────────────────────────────────────────────

/**
 * Crea un nuevo producto.
 * El SKU lo genera el backend si el campo llega vacío.
 * Ruta backend: POST /products
 */
export async function createProduct(
  formData: ProductFormData,
): Promise<ApiResponse<CreateProductResponse>> {
  try {
    const normalizedFormData = await normalizeFormDataBeforeSubmit(formData);
    const validation = validateProductForm(normalizedFormData);
    if (!validation.valid) {
      return {
        error:   'Error de validación',
        message: validation.errors.map(e => e.message).join(', '),
        status:  400,
      };
    }

    const body = formDataToApiBody(normalizedFormData);
    const raw  = await gatewayClient.post<ApiProduct>('/products', body);
    const product = mapApiProductToProduct(raw);

    return {
      data: { product, redirectUrl: `/dashboard/products/${product.id}` },
      status: 201,
    };
  } catch (error) {
    return handleError(error, 'createProduct');
  }
}

/**
 * Guarda un borrador del producto.
 * Crea el producto con estado DRAFT en el backend.
 * Ruta backend: POST /products
 */
export async function saveProductDraft(
  formData: ProductFormData,
): Promise<ApiResponse<{ draftId: string; message: string }>> {
  try {
    const normalizedFormData = await normalizeFormDataBeforeSubmit(formData);
    const body = { ...formDataToApiBody(normalizedFormData), status: 'DRAFT' };
    const raw  = await gatewayClient.post<ApiProduct>('/products', body);
    return {
      data: { draftId: raw.id, message: 'Borrador guardado' },
      status: 200,
    };
  } catch (error) {
    return handleError(error, 'saveProductDraft');
  }
}

/**
 * Actualiza un producto existente.
 * Acepta un `Partial<Product>` del frontend y lo mapea al formato del backend.
 * Ruta backend: PUT /products/:id
 */
export async function updateProduct(
  id: string,
  productData: Partial<Product>,
): Promise<ApiResponse<Product>> {
  try {
    const normalizedProductData = await normalizePartialProductBeforeSubmit({ ...productData, id });
    const body = partialProductToApiBody(normalizedProductData);
    const raw  = await gatewayClient.put<ApiProduct>(`/products/${id}`, body);
    return { data: mapApiProductToProduct(raw), status: 200 };
  } catch (error) {
    return handleError(error, 'updateProduct');
  }
}

/**
 * Elimina un producto y todas sus imágenes S3 asociadas.
 * Ruta backend: DELETE /products/:id
 */
export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  try {
    await gatewayClient.delete(`/products/${id}`);
    return { status: 200, data: null };
  } catch (error) {
    return handleError(error, 'deleteProduct');
  }
}

/**
 * Duplica un producto: obtiene el original y crea una copia en borrador.
 * Ruta backend: GET /products/:id + POST /products
 *
 * Nota: el backend no expone un endpoint de duplicado nativo.
 * Optimización futura: añadir POST /products/:id/duplicate en products-service.
 */
export async function duplicateProduct(id: string): Promise<ApiResponse<Product>> {
  try {
    const original = await gatewayClient.get<ApiProduct>(`/products/${id}`);

    const duplicateBody = {
      name:              `${original.name} (copia)`,
      shortDescription:  original.shortDescription,
      fullDescription:   original.fullDescription,
      categoryId:        original.categoryId,
      subcategoryId:     original.subcategoryId,
      tags:              original.tags,
      basePrice:         original.basePrice,
      comparePrice:      original.comparePrice,
      stock:             original.stock,
      lowStockThreshold: original.lowStockThreshold,
      trackInventory:    original.trackInventory,
      allowBackorders:   original.allowBackorders,
      weight:            original.weight,
      weightUnit:        original.weightUnit,
      dimensions:        original.dimensions,
      status:            'DRAFT',
      visibility:        'PRIVATE',
    };

    const raw = await gatewayClient.post<ApiProduct>('/products', duplicateBody);
    return { data: mapApiProductToProduct(raw), status: 201 };
  } catch (error) {
    return handleError(error, 'duplicateProduct');
  }
}

// ─── STOCK ────────────────────────────────────────────────────────────────────

/**
 * Actualiza el stock de un producto con un valor absoluto.
 * El backend ajusta el estado automáticamente (OUT_OF_STOCK si stock = 0).
 * Ruta backend: PATCH /products/:id/stock
 *
 * @param id    - ID del producto
 * @param stock - Nuevo stock absoluto (no delta)
 */
export async function updateProductStock(
  id: string,
  stock: number,
): Promise<ApiResponse<Product>> {
  try {
    const raw = await gatewayClient.patch<ApiProduct>(`/products/${id}/stock`, { stock });
    return { data: mapApiProductToProduct(raw), status: 200 };
  } catch (error) {
    return handleError(error, 'updateProductStock');
  }
}

// ─── SKU ──────────────────────────────────────────────────────────────────────

/**
 * Genera una sugerencia de SKU en cliente a partir del nombre del producto.
 * Lógica puramente local — no hay endpoint en el backend para esto.
 * El backend genera el SKU final si el campo llega vacío.
 */
export async function suggestSku(
  productName: string,
): Promise<ApiResponse<{ suggestedSku: string }>> {
  if (!productName || productName.trim().length < 3) {
    return { data: { suggestedSku: 'PRO-XXX-001' }, status: 200 };
  }

  const nameParts = productName
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, ' ')
    .split(' ')
    .filter(p => p.length > 0);

  let code = nameParts.length === 1
    ? nameParts[0].substring(0, 3)
    : nameParts.map(p => p[0]).join('').substring(0, 3);

  if (code.length < 2) code = (code + 'XX').substring(0, 3);

  return { data: { suggestedSku: `PRO-${code}-XXX` }, status: 200 };
}

// ─── CATÁLOGO DE CERTIFICACIONES ─────────────────────────────────────────────

export interface CatalogCertification {
  id: string;
  name: string;
  issuingBody: string;
  category: string;
  logoId?: string | null;
  description?: string | null;
}

/**
 * Obtiene el catálogo maestro de certificaciones disponibles.
 * Endpoint público (no requiere auth): GET /products/certifications/catalog
 */
export async function getCertificationsCatalog(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<CatalogCertification>>> {
  try {
    const qs = new URLSearchParams();
    if (params?.search)   qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    if (params?.page)     qs.set('page', String(params.page));
    if (params?.limit)    qs.set('limit', String(params.limit ?? 20));
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const raw = await gatewayClient.get<{ items: CatalogCertification[]; total: number; page: number; limit: number }>(
      `/products/certifications/catalog${query}`,
    );

    return {
      data: {
        items:      raw.items ?? [],
        total:      raw.total ?? 0,
        page:       raw.page  ?? 1,
        limit:      raw.limit ?? 20,
        totalPages: Math.ceil((raw.total ?? 0) / (raw.limit ?? 20)),
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error, 'getCertificationsCatalog');
  }
}

/**
 * Añade una certificación a un producto.
 * - Cert de catálogo: enviar certificationId
 * - Cert manual: omitir certificationId, enviar name + issuingBody
 * Ruta backend: POST /products/:id/certifications
 */
export async function addProductCertification(
  productId: string,
  data: {
    certificationId?: string;
    name?: string;
    issuingBody?: string;
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    documentIds?: string[];
    source?: 'CATALOG' | 'MANUAL';
  },
): Promise<ApiResponse<{ certificationId: string }>> {
  try {
    const raw = await gatewayClient.post<{ certificationId: string }>(
      `/products/${productId}/certifications`,
      data,
    );
    return { data: raw, status: 201 };
  } catch (error) {
    return handleError(error, 'addProductCertification');
  }
}

/**
 * Elimina una certificación de un producto.
 * Ruta backend: DELETE /products/:id/certifications/:certificationId
 */
export async function removeProductCertification(
  productId: string,
  certificationId: string,
): Promise<ApiResponse<null>> {
  try {
    await gatewayClient.delete(`/products/${productId}/certifications/${certificationId}`);
    return { status: 200, data: null };
  } catch (error) {
    return handleError(error, 'removeProductCertification');
  }
}

/**
 * Actualiza los datos específicos del producto de una certificación ya asignada.
 * (certificateNumber, issueDate, expiryDate, documentIds)
 * Ruta backend: PATCH /products/:id/certifications/:certificationId
 */
export async function updateProductCertification(
  productId: string,
  certificationId: string,
  data: {
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    documentIds?: string[];
  },
): Promise<ApiResponse<{ certificationId: string }>> {
  try {
    const raw = await gatewayClient.patch<{ certificationId: string }>(
      `/products/${productId}/certifications/${certificationId}`,
      data,
    );
    return { data: raw, status: 200 };
  } catch (error) {
    return handleError(error, 'updateProductCertification');
  }
}
