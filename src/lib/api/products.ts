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
import {
  type ApiProduct,
  type ApiProductsListResponse,
  mapApiProductToProduct,
  mapApiProducts,
  computeProductStats,
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
    'price-asc':  'price_asc',
    'price-desc': 'price_desc',
    'sales-desc': 'sales',
  };
  return map[sortBy] ?? 'newest';
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
    fullDescription:   formData.fullDescription,
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
    'weight', 'weightUnit', 'dimensions',
  ];

  for (const key of scalar) {
    if (product[key] !== undefined) body[key] = product[key];
  }

  if (product.status !== undefined)     body.status     = mapStatusToApi(product.status);
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
  category?: string;
  status?: string;
  stock?: string;
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

    // categoryId — el dashboard filtra por nombre; el backend usa ID.
    // Si el filtro de categoría llega como ID directamente, se pasa tal cual.
    // La integración completa con la API de categorías llegará con `categories.ts`.
    if (params?.category && params.category !== 'Todas') {
      query.categoryId = params.category;
    }

    const raw = await gatewayClient.get<ApiProductsListResponse>(
      '/products/producer/my-products',
      { params: query as Record<string, string | number | boolean | undefined | null> },
    );

    let items = mapApiProducts(raw.data);

    // Filtro de stock — aplicado en cliente sobre los resultados paginados.
    // Nota: esto afecta al conteo total si hay menos resultados de los esperados.
    if (params?.stock && params.stock !== 'todos') {
      items = applyStockFilter(items, params.stock);
    }

    const total = params?.stock && params.stock !== 'todos' ? items.length : raw.total;
    const limit = params?.limit ?? 10;

    return {
      data: {
        items,
        total,
        page:       raw.page,
        limit:      raw.limit,
        totalPages: Math.ceil(total / limit),
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error, 'fetchProducts');
  }
}

/**
 * Aplica filtros de stock sobre una lista de productos ya mapeados.
 */
function applyStockFilter(products: Product[], stockFilter: string): Product[] {
  switch (stockFilter) {
    case 'bajo':
      return products.filter(
        p => p.stock > 0 && p.lowStockThreshold > 0 && p.stock <= p.lowStockThreshold,
      );
    case 'agotado':
      return products.filter(p => p.stock === 0 || p.status === 'out_of_stock');
    case 'disponible':
      return products.filter(p => p.stock > 0);
    default:
      return products;
  }
}

/**
 * Obtiene un producto por su ID.
 * Ruta backend: GET /products/:id
 */
export async function fetchProductById(id: string): Promise<ApiResponse<Product>> {
  try {
    const raw = await gatewayClient.get<ApiProduct>(`/products/${id}`);
    return { data: mapApiProductToProduct(raw), status: 200 };
  } catch (error) {
    return handleError(error, 'fetchProductById');
  }
}

/**
 * Calcula las estadísticas de productos del productor.
 * Obtiene todos los productos (límite alto) y aplica `computeProductStats` en cliente.
 *
 * Optimización futura: añadir GET /products/producer/stats en products-service.
 */
export async function fetchProductStats(): Promise<ApiResponse<ProductStats>> {
  try {
    const raw = await gatewayClient.get<ApiProductsListResponse>(
      '/products/producer/my-products',
      { params: { page: 1, limit: 500 } },
    );
    const products = mapApiProducts(raw.data);
    return { data: computeProductStats(products), status: 200 };
  } catch (error) {
    return handleError(error, 'fetchProductStats');
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
    const validation = validateProductForm(formData);
    if (!validation.valid) {
      return {
        error:   'Error de validación',
        message: validation.errors.map(e => e.message).join(', '),
        status:  400,
      };
    }

    const body = formDataToApiBody(formData);
    const raw  = await gatewayClient.post<ApiProduct>('/products', body);
    const product = mapApiProductToProduct(raw);

    return {
      data: { product, redirectUrl: `/products/${product.id}` },
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
    const body = { ...formDataToApiBody(formData), status: 'DRAFT' };
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
    const body = partialProductToApiBody(productData);
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
 * Verifica si un SKU ya está en uso en el catálogo.
 * El backend valida la unicidad en el momento de crear/actualizar y devuelve 409.
 * Esta función es una comprobación preventiva para UX — el backend es la fuente de verdad.
 *
 * Nota: no hay endpoint dedicado en products-service; el backend retorna 409 si hay conflicto.
 * Se mantiene la función para compatibilidad con el formulario — siempre devuelve false.
 */
export async function checkSkuExists(sku: string): Promise<ApiResponse<{ exists: boolean }>> {
  // Sin endpoint dedicado — la validación real ocurre en el backend al crear/editar.
  return { data: { exists: false }, status: 200 };
}

/**
 * Genera una sugerencia de SKU en cliente a partir del nombre y categoría.
 * Lógica puramente local — no hay endpoint en el backend para esto.
 */
export async function suggestSku(
  productName: string,
  categoryId: string,
): Promise<ApiResponse<{ suggestedSku: string }>> {
  if (!productName || productName.trim().length < 3) {
    return { data: { suggestedSku: 'PRO-XXX-001' }, status: 200 };
  }

  const prefixes: Record<string, string> = {
    quesos:    'QUE', aceites:   'ACE', vinos:   'VIN', embutidos: 'EMB',
    mieles:    'MIE', panaderia: 'PAN', conservas: 'CON', dulces:  'DUL',
    bebidas:   'BEB',
  };
  const prefix = prefixes[categoryId] ?? 'PRO';

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

  return { data: { suggestedSku: `${prefix}-${code}-XXX` }, status: 200 };
}
