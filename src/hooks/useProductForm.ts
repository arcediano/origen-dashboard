/**
 * @file useProductForm.ts
 * @description Hook global para la gestión del formulario de productos
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 
 * 1. CARGA DE DATOS
 *    - Con productId → Carga de API y transforma a FormData
 *    - Sin productId → Carga borrador de localStorage
 * 
 * 2. GESTIÓN DEL FORMULARIO
 *    - formData: Estado del formulario (tipo ProductFormData)
 *    - activeTab: Pestaña activa
 *    - completedTabs: Pasos completados
 * 
 * 3. AUTO-GUARDADO (solo creación)
 *    - Cada 2 segundos en localStorage
 *    - Indicadores isAutoSaving / lastSaved
 * 
 * 4. ACCIONES
 *    - handleSave: Guarda (localStorage o API)
 *    - handlePublish: Publica (createProduct o updateProduct)
 *    - handleCancel: Vuelve al listado
 * 
 * 5. UTILIDADES
 *    - skuSuggestion: Sugerencia de SKU en tiempo real
 *    - isEditMode: Detección de modo edición
 *    - reloadProduct: Recarga manual
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@arcediano/ux-library';
import type { 
  PriceTier, 
  ProductFormData, 
  FormStepId, 
  ProductCertification, 
  ProductImage,
  Product 
} from '@/types/product';
import { defaultFormData } from '@/types/product';
import { 
  createProduct, 
  saveProductDraft, 
  suggestSku,
  updateProduct,
  fetchProductById 
} from '@/lib/api/products';

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEY = 'origen-nuevo-producto-draft-v11';
const FORM_STEP_KEYS: FormStepId[] = [
  'basic',
  'images',
  'pricing',
  'nutritional',
  'production',
  'inventory',
  'certifications',
];

/**
 * Lista de campos granularizados que disparan revisión automática si el producto
 * está publicado (ACTIVE/OUT_OF_STOCK) y se modifican.
 *
 * Corresponde con los campos sensibles detectados en backend:
 * origen-master-microservices/src/modules/products/products/products.service.ts
 * en la función detectSensitiveChanges() (línea ~1021)
 *
 * Mantenerse sincronizado: si el backend agrega/quita campos sensibles,
 * actualizar esta lista también.
 */
const SENSITIVE_FIELDS = {
  // Campos atomicos
  atomic: [
    'name',
    'shortDescription',
    'fullDescription',
    'mainImage',
    'gallery',
    'categoryId',
    'subcategoryId',
    'certifications',
  ],
  // Subcampos de nutritionalInfo que son sensibles (seguridad alimentaria)
  nutritional: [
    'allergens',
    'mayContain',
    'ingredients',
  ],
  // Subcampos de productionInfo que son sensibles (trazabilidad)
  production: [
    'origin',
    'farmName',
    'producerName',
    'batchNumber',
    'harvestDate',
    'productionDate',
    'expiryDate',
  ],
};

// Pasos que el productor DEBE completar para poder publicar.
// Los pasos opcionales (nutritional, production, certifications) no bloquean la publicación.
const REQUIRED_STEPS_FOR_PUBLISH: FormStepId[] = [
  'basic',
  'images',
  'pricing',
  'inventory',
];

// ============================================================================
// FUNCIONES DE TRANSFORMACIÓN (helpers puros)
// ============================================================================

/**
 * Convierte un Product de API a ProductFormData para el formulario
 */
const productToFormData = (product: Product): ProductFormData => {
  // Si el producto es un borrador de onboarding, gallery[] llega vacío aunque
  // mainImage sí existe. En ese caso la inyectamos para que el paso Imágenes
  // no aparezca siempre como pendiente.
  const gallery: ProductFormData['gallery'] =
    product.gallery.length > 0
      ? product.gallery
      : product.mainImage
        ? [{ ...product.mainImage, isMain: true, sortOrder: 0 }]
        : [];

  return ({
  name: product.name,
  shortDescription: product.shortDescription,
  fullDescription: product.fullDescription,
  categoryId: product.categoryId,
  categoryName: product.categoryName,
  subcategoryId: product.subcategoryId,
  subcategoryName: product.subcategoryName,
  tags: product.tags,
  mainImage: product.mainImage,
  gallery,
  basePrice: product.basePrice,
  comparePrice: product.comparePrice,
  priceTiers: product.priceTiers || [],
  sku: product.sku,
  barcode: product.barcode,
  stock: product.stock,
  lowStockThreshold: product.lowStockThreshold,
  trackInventory: product.trackInventory,
  allowBackorders: product.allowBackorders,
  weight: product.weight,
  weightUnit: product.weightUnit || 'kg',
  dimensions: product.dimensions,
  shippingClass: product.shippingClass,
  nutritionalInfo: product.nutritionalInfo || defaultFormData.nutritionalInfo,
  certifications: product.certifications || [],
  productionInfo: product.productionInfo || defaultFormData.productionInfo,
  attributes: product.attributes || [],
  status: product.status === 'active' ? 'active' : 'draft',
  visibility: product.visibility || 'public',
  });
};

/**
 * Convierte ProductFormData a Partial<Product> para enviar a la API
 */
const formDataToProduct = (formData: ProductFormData): Partial<Product> => {
  // Mapeo de estados del formulario a estados del producto
  const statusMap: Record<string, 'draft' | 'pending_approval' | 'active' | 'inactive' | 'out_of_stock'> = {
    'draft': 'draft',
    'active': 'active',
    'pending_approval': 'pending_approval',
  };

  return {
    name: formData.name,
    shortDescription: formData.shortDescription,
    fullDescription: formData.fullDescription,
    categoryId: formData.categoryId,
    categoryName: formData.categoryName,
    subcategoryId: formData.subcategoryId,
    tags: formData.tags,
    mainImage: formData.mainImage,
    gallery: formData.gallery,
    basePrice: formData.basePrice,
    comparePrice: formData.comparePrice,
    priceTiers: formData.priceTiers,
    sku: formData.sku,
    barcode: formData.barcode,
    stock: formData.stock,
    lowStockThreshold: formData.lowStockThreshold,
    trackInventory: formData.trackInventory,
    allowBackorders: formData.allowBackorders,
    weight: formData.weight,
    weightUnit: formData.weightUnit,
    dimensions: formData.dimensions,
    shippingClass: formData.shippingClass,
    nutritionalInfo: formData.nutritionalInfo,
    certifications: formData.certifications,
    productionInfo: formData.productionInfo,
    attributes: formData.attributes,
    status: statusMap[formData.status] || 'draft',
    visibility: formData.visibility,
  };
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useProductForm(productId?: string) {
  const router = useRouter();
  
  // ==========================================================================
  // ESTADO
  // ==========================================================================
  
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<FormStepId>('basic');
  const [completedTabs, setCompletedTabs] = useState<Record<string, boolean>>({});
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'pending_approval' | 'error'>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [skuSuggestion, setSkuSuggestion] = useState<string>('');
  
  // Ref para evitar que el auto-guardado dispare en la carga inicial
  const isInitialDataLoad = useRef(true);

  // Ref para guardar el producto original al cargar (para detección de cambios sensibles)
  const originalProductRef = useRef<ProductFormData | null>(null);

  // Ref con el status crudo del backend ('ACTIVE' | 'OUT_OF_STOCK' | ...), sin pasar por
  // productToFormData (que colapsa cualquier status distinto de 'active' a 'draft' — ver
  // línea ~164 — por lo que ProductFormData.status NUNCA puede valer 'out_of_stock' y no
  // sirve para calcular isPublishedProduct).
  const originalStatusRef = useRef<string | null>(null);

  // Estados para detección de cambios sensibles
  const [sensitiveDirtyFields, setSensitiveDirtyFields] = useState<string[]>([]);
  const [pendingSensitiveConfirmation, setPendingSensitiveConfirmation] = useState(false);

  // Dialog States
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Conflicto 409 EXCLUSIVE_OFFER_CONFLICT al enviar priceTiers con una Flash ya activa —
  // guarda el reintento a ejecutar (con replaceActiveFlashDeal: true) si el productor confirma.
  const [pendingOfferConflict, setPendingOfferConflict] = useState<{
    conflictingOfferType: 'FLASH';
    retry: () => Promise<void>;
  } | null>(null);
  const [isResolvingOfferConflict, setIsResolvingOfferConflict] = useState(false);

  // ==========================================================================
  // CARGA INICIAL
  // ==========================================================================

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    } else {
      loadDraft();
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchProductById(id);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        isInitialDataLoad.current = true;
        const formData = productToFormData(response.data);
        setFormData(formData);
        // Guardar el producto original para detectar cambios sensibles
        originalProductRef.current = formData;
        originalStatusRef.current = response.data.status;
        setLastSaved(new Date());
      }
    } catch (err) {
      setError('Error al cargar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProductFormData;
        setFormData(parsed);
        setLastSaved(new Date());
        // Avisar si el borrador tiene datos pero las imágenes no se guardaron
        // (los objetos File no son serializables en localStorage)
        if (parsed.name && (!parsed.gallery || parsed.gallery.length === 0)) {
          setTimeout(() => {
            toast({
              title: 'Imágenes pendientes',
              description: 'El borrador se ha recuperado. Las imágenes no se guardan automáticamente — por favor, vuélvelas a añadir.',
              variant: 'warning',
            });
          }, 500);
        }
      } catch (e) {
        console.error('Error al cargar borrador:', e);
      }
    }
  };

  // ==========================================================================
  // DETECCIÓN DE CAMBIOS SENSIBLES
  // ==========================================================================
  // Declarado antes del efecto de auto-guardado porque este último depende de
  // isPublishedProduct/sensitiveDirtyFields en su array de dependencias.

  /**
   * Calcula si el producto actual está publicado (ACTIVE u OUT_OF_STOCK).
   * Se basa en el status crudo del backend cargado originalmente (originalStatusRef),
   * no en formData.status (que colapsa todo lo que no sea 'active' a 'draft'), y no en
   * el estado actual del formulario, para mantener la bandera estable durante la edición.
   */
  const isPublishedProduct = useMemo(() => {
    return originalStatusRef.current === 'ACTIVE' || originalStatusRef.current === 'OUT_OF_STOCK';
  }, [originalStatusRef.current]);

  /**
   * Calcula el arreglo de campos sensibles que han cambiado en la sesión actual.
   * Solo se calcula para productos publicados y compara contra el original.
   */
  const computedSensitiveDirtyFields = useMemo(() => {
    if (!isPublishedProduct || !originalProductRef.current) return [];

    const dirty: string[] = [];
    const original = originalProductRef.current;

    // Campos atomicos
    for (const field of SENSITIVE_FIELDS.atomic) {
      const currentVal = formData[field as keyof ProductFormData];
      const originalVal = original[field as keyof ProductFormData];

      if (JSON.stringify(currentVal) !== JSON.stringify(originalVal)) {
        dirty.push(field);
      }
    }

    // Subcampos de nutritionalInfo
    if (formData.nutritionalInfo && original.nutritionalInfo) {
      for (const subfield of SENSITIVE_FIELDS.nutritional) {
        const currentVal = (formData.nutritionalInfo as any)[subfield];
        const originalVal = (original.nutritionalInfo as any)[subfield];

        if (JSON.stringify(currentVal) !== JSON.stringify(originalVal)) {
          dirty.push(subfield);
        }
      }
    }

    // Subcampos de productionInfo
    if (formData.productionInfo && original.productionInfo) {
      for (const subfield of SENSITIVE_FIELDS.production) {
        const currentVal = (formData.productionInfo as any)[subfield];
        const originalVal = (original.productionInfo as any)[subfield];

        if (JSON.stringify(currentVal) !== JSON.stringify(originalVal)) {
          dirty.push(subfield);
        }
      }
    }

    return dirty;
  }, [formData, isPublishedProduct]);

  // Actualizar sensitiveDirtyFields cuando cambia computedSensitiveDirtyFields
  useEffect(() => {
    setSensitiveDirtyFields(computedSensitiveDirtyFields);
  }, [computedSensitiveDirtyFields]);

  // ==========================================================================
  // AUTO-GUARDADO
  // ==========================================================================

  useEffect(() => {
    // Saltar el primer render tras cargar datos (no guardar lo que acaba de llegar de la API)
    if (isInitialDataLoad.current) {
      isInitialDataLoad.current = false;
      return;
    }

    if (!productId) {
      // Modo creación: auto-save en localStorage cada 2 s
      // Las imágenes con File pendiente se omiten del draft (File no es serializable
      // y se perdería al recargar; el usuario debe volver a añadirlas igualmente)
      const timer = setTimeout(() => {
        setIsAutoSaving(true);
        const draftData = {
          ...formData,
          gallery: formData.gallery.filter(img => !img.file),
          mainImage: formData.mainImage?.file ? undefined : formData.mainImage,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
        setLastSaved(new Date());
        setTimeout(() => setIsAutoSaving(false), 500);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Modo edición: auto-save en API cada 3 s (más conservador)
      // Si hay cambios sensibles sobre un producto publicado, pausar autoguardado
      // y requerir confirmación explícita
      if (isPublishedProduct && sensitiveDirtyFields.length > 0) {
        // Pausar autoguardado: establecer pendingSensitiveConfirmation
        // El usuario debe confirmar explícitamente via confirmSensitiveSave
        setPendingSensitiveConfirmation(true);
        return () => {}; // Sin timer
      }

      // Pausar autoguardado mientras haya un conflicto de oferta sin resolver —
      // el usuario debe confirmar el reemplazo o quitar los tiers manualmente.
      if (pendingOfferConflict) {
        return () => {};
      }

      const timer = setTimeout(async () => {
        setIsAutoSaving(true);
        try {
          const productData = formDataToProduct(formData);
          const response = await updateProduct(productId, productData);
          if (response.error) {
            if (response.errorCode === 'EXCLUSIVE_OFFER_CONFLICT' && response.conflictingOfferType === 'FLASH') {
              setPendingOfferConflict({
                conflictingOfferType: 'FLASH',
                retry: async () => {
                  const retryResponse = await updateProduct(productId, productData, { replaceActiveFlashDeal: true });
                  if (!retryResponse.error) setLastSaved(new Date());
                },
              });
            }
            // Otros errores: silencioso — no interrumpir la UX; el usuario puede guardar manualmente
          } else {
            setLastSaved(new Date());
          }
        } catch {
          // Silencioso — no interrumpir la UX; el usuario puede guardar manualmente
        } finally {
          setIsAutoSaving(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formData, productId, isPublishedProduct, sensitiveDirtyFields, pendingOfferConflict]);

  // ==========================================================================
  // VALIDACIÓN DE PASOS
  // ==========================================================================

  useEffect(() => {
    const nutritional = formData.nutritionalInfo;
    const production = formData.productionInfo;
    // Nutricional: los alérgenos solos (del onboarding) no son suficientes.
    // Se requiere servingSizeValue > 0 + al menos un campo de contenido.
    const hasNutritionalData = Boolean(
      (nutritional?.servingSizeValue && nutritional.servingSizeValue > 0)
      && (
        nutritional?.calories
        || nutritional?.ingredients?.length
        || nutritional?.storageInstructions
        || nutritional?.preparationInstructions
        || nutritional?.allergens?.length
      ),
    );
    const hasProductionData = Boolean(
      production?.story
      || production?.origin
      || production?.farmName
      || production?.productionMethod
      || production?.batchNumber
      || production?.practices?.length
      || production?.media?.length,
    );

    setCompletedTabs({
      basic: !!(formData.name && formData.categoryId),
      images: !!(formData.gallery && formData.gallery.length > 0),
      pricing: !!(formData.basePrice && formData.basePrice > 0),
      nutritional: hasNutritionalData,
      production: hasProductionData,
      // Inventario: se considera completado cuando el productor ha revisado
      // los valores de stock — los campos tienen defaults válidos (0 / 5).
      inventory: formData.stock >= 0 && formData.lowStockThreshold >= 0,
      certifications: true,
    });
  }, [formData]);

  // ==========================================================================
  // SUGERENCIA DE SKU
  // ==========================================================================

  useEffect(() => {
    const getSkuSuggestion = async () => {
      if (formData.name?.length >= 3 && formData.categoryId) {
        const response = await suggestSku(formData.name);
        if (response.data) {
          setSkuSuggestion(response.data.suggestedSku);
        }
      } else {
        setSkuSuggestion('');
      }
    };

    const timer = setTimeout(getSkuSuggestion, 500);
    return () => clearTimeout(timer);
  }, [formData.name, formData.categoryId]);

  // ==========================================================================
  // VALIDACIÓN DE CAMPOS OBLIGATORIOS POR PASO
  // ==========================================================================

  /**
   * Devuelve los mensajes de error de los campos requeridos para un paso concreto.
   * Se usa para bloquear la navegación y mostrar al usuario qué falta.
   */
  const getStepErrors = useCallback((tab: FormStepId): string[] => {
    const errors: string[] = [];
    switch (tab) {
      case 'basic':
        if (!formData.name || formData.name.trim().length < 5)
          errors.push('Nombre del producto (mínimo 5 caracteres)');
        if (!formData.categoryId)
          errors.push('Categoría del producto');
        if (!formData.shortDescription || formData.shortDescription.trim().length < 20)
          errors.push('Descripción corta (mínimo 20 caracteres)');
        break;
      case 'images':
        if (!formData.gallery || formData.gallery.length === 0)
          errors.push('Al menos una imagen del producto');
        break;
      case 'pricing':
        if (!formData.basePrice || formData.basePrice <= 0)
          errors.push('Precio de venta (debe ser mayor que 0)');
        break;
      case 'inventory':
        // SKU lo asigna el backend — no se requiere aquí.
        break;
      // nutritional, production y certifications son pasos opcionales — no bloquean
      default:
        break;
    }
    return errors;
  }, [formData]);

  // Errores del paso activo — para pasarlos directamente a la navegación
  const currentStepErrors = getStepErrors(activeTab);

  // ==========================================================================
  // HANDLERS DEL FORMULARIO
  // ==========================================================================

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNestedChange = useCallback((section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof ProductFormData] as any || {}),
        [field]: value
      }
    }));
  }, []);

  const handlePriceTiersChange = useCallback((priceTiers: PriceTier[]) => {
    setFormData(prev => ({ ...prev, priceTiers }));
  }, []);

  const handleImagesChange = useCallback((images: ProductImage[]) => {
    setFormData(prev => ({ ...prev, gallery: images }));
  }, []);

  // ==========================================================================
  // ACCIONES PRINCIPALES
  // ==========================================================================

  const handleSave = useCallback(async () => {
    // Si hay confirmación pendiente de cambios sensibles, no guardar directamente.
    // El modal de confirmación debe invocar confirmSensitiveSave en su lugar.
    if (pendingSensitiveConfirmation) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (productId) {
        // Edición: convertir y enviar a API
        const productData = formDataToProduct(formData);
        const response = await updateProduct(productId, productData);
        if (response.error) {
          if (response.errorCode === 'EXCLUSIVE_OFFER_CONFLICT' && response.conflictingOfferType === 'FLASH') {
            setPendingOfferConflict({
              conflictingOfferType: 'FLASH',
              retry: async () => {
                const retryResponse = await updateProduct(productId, productData, { replaceActiveFlashDeal: true });
                if (retryResponse.error) setError(retryResponse.error);
                else setLastSaved(new Date());
              },
            });
          } else {
            setError(response.error);
          }
        } else {
          setLastSaved(new Date());
        }
      } else {
        // Creación: guardar como borrador en la API (sube imágenes y crea el producto)
        const response = await saveProductDraft(formData);
        if (response.error) {
          setError(response.error);
        } else {
          // Borrador guardado correctamente: limpiar localStorage y navegar a la lista
          localStorage.removeItem(STORAGE_KEY);
          router.push('/dashboard/products');
        }
      }
    } catch (error) {
      setError('Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  }, [formData, productId, router, pendingSensitiveConfirmation]);

  const handlePublish = useCallback(async () => {
    // Solo verificar pasos obligatorios; nutricional, producción y certificaciones son opcionales.
    const requiredCompleted = REQUIRED_STEPS_FOR_PUBLISH.every((step) => completedTabs[step]);
    if (!requiredCompleted) {
      setError('Completa los pasos obligatorios antes de publicar: Información básica, Imágenes, Precio e Inventario.');
      return;
    }
    
    setIsPublishing(true);
    setPublishStatus('idle');
    setPublishError(null);

    try {
      if (productId) {
        // Edición: enviar a revisión (PENDING_APPROVAL) para aprobación del admin
        const productData = {
          ...formDataToProduct(formData),
          status: 'pending_approval' as const,
        };
        const response = await updateProduct(productId, productData);

        if (response.error) {
          if (response.errorCode === 'EXCLUSIVE_OFFER_CONFLICT' && response.conflictingOfferType === 'FLASH') {
            setPendingOfferConflict({
              conflictingOfferType: 'FLASH',
              retry: async () => {
                const retryResponse = await updateProduct(productId, productData, { replaceActiveFlashDeal: true });
                if (retryResponse.error) {
                  setPublishStatus('error');
                  setPublishError(retryResponse.error);
                } else {
                  setPublishStatus('pending_approval');
                  setShowSuccessModal(true);
                }
              },
            });
            setPublishStatus('idle');
          } else {
            setPublishStatus('error');
            setPublishError(response.error);
          }
        } else {
          setPublishStatus('pending_approval');
          setShowSuccessModal(true);
        }
      } else {
        // Creación: enviar a revisión (PENDING_APPROVAL)
        const response = await createProduct({ ...formData, status: 'pending_approval' as const });

        if (response.error) {
          setPublishStatus('error');
          setPublishError(response.error);
        } else {
          setPublishStatus('pending_approval');
          localStorage.removeItem(STORAGE_KEY);
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      setPublishStatus('error');
      setPublishError('Error inesperado al publicar el producto');
    } finally {
      setIsPublishing(false);
    }
  }, [formData, completedTabs, productId]);

  const handleCancel = useCallback(() => {
    router.push('/dashboard/products');
  }, [router]);

  /**
   * Ejecuta el guardado real tras confirmación explícita de cambios sensibles.
   * Se invoca desde el modal de confirmación, no desde autoguardado.
   * Resetea originalProductRef tras persistir con éxito para permitir que
   * futuras ediciones se comparen contra el nuevo estado guardado.
   */
  const confirmSensitiveSave = useCallback(async () => {
    setIsSaving(true);
    setPendingSensitiveConfirmation(false);

    try {
      if (productId) {
        const productData = formDataToProduct(formData);
        const response = await updateProduct(productId, productData);
        if (response.error) {
          if (response.errorCode === 'EXCLUSIVE_OFFER_CONFLICT' && response.conflictingOfferType === 'FLASH') {
            setPendingOfferConflict({
              conflictingOfferType: 'FLASH',
              retry: async () => {
                const retryResponse = await updateProduct(productId, productData, { replaceActiveFlashDeal: true });
                if (retryResponse.error) {
                  setError(retryResponse.error);
                } else {
                  setLastSaved(new Date());
                  originalProductRef.current = formData;
                }
              },
            });
          } else {
            setError(response.error);
          }
        } else {
          setLastSaved(new Date());
          // Resetear originalProductRef: el producto ha sido guardado con los cambios sensibles
          // Las futuras ediciones se compararán contra este nuevo estado
          originalProductRef.current = formData;
        }
      }
    } catch (error) {
      setError('Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  }, [formData, productId]);

  /**
   * Confirma el reemplazo tras un conflicto 409 EXCLUSIVE_OFFER_CONFLICT: ejecuta
   * el reintento guardado (con replaceActiveFlashDeal: true) y limpia el estado.
   */
  const confirmOfferConflictReplace = useCallback(async () => {
    if (!pendingOfferConflict) return;
    const { retry } = pendingOfferConflict;
    setIsResolvingOfferConflict(true);
    try {
      await retry();
    } finally {
      setIsResolvingOfferConflict(false);
      setPendingOfferConflict(null);
    }
  }, [pendingOfferConflict]);

  /** Descarta el conflicto sin reemplazar nada — los tiers quedan sin guardar. */
  const cancelOfferConflict = useCallback(() => {
    setPendingOfferConflict(null);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Estado
    formData,
    activeTab,
    setActiveTab,
    completedTabs,
    
    // UI States
    isLoading,
    error,
    isSaving,
    isAutoSaving,
    lastSaved,
    isPublishing,
    publishStatus,
    publishError,
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    skuSuggestion,
    
    // Valores computados
    allStepsCompleted: REQUIRED_STEPS_FOR_PUBLISH.every((step) => completedTabs[step]),
    hasCertifications: formData.certifications.length > 0,
    certificationsApproved: formData.certifications.every(c => c.verified) || false,
    hasPendingManualCerts: formData.certifications.some(c => c.source === 'manual' && !c.verified),
    isEditMode: !!productId,
    isPublishedProduct,
    sensitiveDirtyFields,
    pendingSensitiveConfirmation,
    pendingOfferConflict,
    isResolvingOfferConflict,
    confirmOfferConflictReplace,
    cancelOfferConflict,

    // Validación por paso
    getStepErrors,
    currentStepErrors,

    // Handlers
    handleInputChange,
    handleNestedChange,
    handlePriceTiersChange,
    handleImagesChange,
    handleSave,
    handlePublish,
    handleCancel,
    confirmSensitiveSave,

    // Utilidades
    reloadProduct: productId ? () => loadProduct(productId) : undefined,
  };
}