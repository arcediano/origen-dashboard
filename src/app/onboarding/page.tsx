// 📁 /src/app/onboarding/page.tsx
/**
 * @page Onboarding Premium - VERSIÓN DEFINITIVA
 * @version 14.0.0 - CORREGIDO: Tipos específicos por paso
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@arcediano/ux-library';
import { MobileStepperBar } from '@/components/features/onboarding/components/MobileStepperBar';
import { MobileNavBar } from '@/components/features/onboarding/components/MobileNavBar';
import { StepValidationPanel } from '@/components/features/onboarding/components/StepValidationPanel';
import { uploadFile } from '@/lib/api/media';
import { GatewayError } from '@/lib/api/client';
import { validateSpanishTaxId } from '@/lib/utils/tax-id';
import {
  saveStep1,
  saveStep2,
  saveStep3,
  saveStep4,
  saveStep5,
  saveStep6,
  saveStepProducts,
  completeOnboarding as apiCompleteOnboarding,
  loadOnboardingData,
} from '@/lib/api/onboarding';

// Importar tipos específicos de cada paso
import { EnhancedStep1Location, type EnhancedLocationData } from '@/components/features/onboarding/components/steps/step-location';
import { EnhancedStep2Story, type EnhancedStoryData, type Certification } from '@/components/features/onboarding/components/steps/step-story';
import { EnhancedStep3Visual, type EnhancedVisualData } from '@/components/features/onboarding/components/steps/step-visual';
import { EnhancedStep4Capacity, type EnhancedCapacityData } from '@/components/features/onboarding/components/steps/step-capacity';
import { EnhancedStep5Documents, type EnhancedStep5DocumentsData } from '@/components/features/onboarding/components/steps/step-documents';
import { EnhancedStep6Stripe, type EnhancedStep6StripeData } from '@/components/features/onboarding/components/steps/step-stripe';
import { EnhancedStepProducts, type EnhancedProductsData, getProductErrors } from '@/components/features/onboarding/components/steps/step-products';

import {
  MapPin,
  BookOpen,
  Camera,
  Package,
  FileText,
  CreditCard,
  ShoppingBasket,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  Shield,
  Leaf,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// CONFIGURACIÓN DE PASOS
// ============================================================================

const STEPS = [
  {
    id: 1,
    title: 'Ubicación',
    icon: MapPin,
    color: 'text-origen-pradera',
    bgColor: 'bg-origen-pradera/10',
    time: '2 min',
    description: 'Dirección, provincia y categorías',
    longDescription: 'Cuéntanos dónde está ubicado tu negocio y qué productos vendes.'
  },
  {
    id: 2,
    title: 'Historia',
    icon: BookOpen,
    color: 'text-origen-hoja',
    bgColor: 'bg-origen-hoja/10',
    time: '3 min',
    description: 'Nombre, descripción y valores',
    longDescription: 'Comparte la historia detrás de tus productos y los valores de tu marca.'
  },
  {
    id: 3,
    title: 'Productos',
    icon: ShoppingBasket,
    color: 'text-origen-hoja',
    bgColor: 'bg-origen-hoja/10',
    time: '3 min',
    description: 'Catálogo inicial y alérgenos',
    longDescription: 'Define hasta 5 productos con nombre, precio y alérgenos obligatorios por ley.'
  },
  {
    id: 4,
    title: 'Perfil visual',
    icon: Camera,
    color: 'text-origen-pino',
    bgColor: 'bg-origen-pino/10',
    time: '2 min',
    description: 'Logo, banner y fotos',
    longDescription: 'Configura la imagen de tu perfil y muestra tus productos.'
  },
  {
    id: 5,
    title: 'Capacidad',
    icon: Package,
    color: 'text-origen-bosque',
    bgColor: 'bg-origen-bosque/10',
    time: '2 min',
    description: 'Producción y envíos',
    longDescription: 'Define tu capacidad de producción y las opciones de envío.'
  },
  {
    id: 6,
    title: 'Documentación',
    icon: FileText,
    color: 'text-origen-oscuro',
    bgColor: 'bg-origen-oscuro/10',
    time: '3 min',
    description: 'Verificación de identidad',
    longDescription: 'Verifica tu identidad como productor y sube tus certificaciones.'
  },
  {
    id: 7,
    title: 'Pagos',
    icon: CreditCard,
    color: 'text-origen-pradera',
    bgColor: 'bg-origen-pradera/10',
    time: '2 min',
    description: 'Conectar Stripe',
    longDescription: 'Configura Stripe para recibir pagos de forma segura.'
  }
];

// ============================================================================
// HELPER: MENSAJES DE ERROR PARA EL USUARIO
// ============================================================================

function getUserFriendlyError(error: unknown, fallback = 'Error inesperado. Inténtalo de nuevo.'): string {
  // Sin conexión / timeout
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    return 'No se pudo conectar al servidor. Comprueba tu conexión a internet e inténtalo de nuevo.';
  }
  if (error instanceof GatewayError) {
    switch (error.status) {
      case 400:
      case 422:
        return error.message || 'Algunos campos no son válidos. Revísalos e inténtalo de nuevo.';
      case 401:
        return 'Tu sesión ha expirado. Recarga la página e inicia sesión de nuevo.';
      case 403:
        return 'No tienes permiso para realizar esta acción.';
      case 413:
        return 'El archivo supera el tamaño máximo permitido. Prueba con un archivo más pequeño.';
      case 429:
        return 'Demasiadas peticiones. Espera unos segundos e inténtalo de nuevo.';
      case 500:
      case 502:
      case 503:
        return 'Error temporal del servidor. Inténtalo de nuevo en unos momentos.';
      default:
        return error.message || fallback;
    }
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

// ============================================================================
// TIPOS ESPECÍFICOS PARA CADA PASO
// ============================================================================

interface OnboardingFormData {
  step1: EnhancedLocationData;
  step2: EnhancedStoryData;
  step_products: EnhancedProductsData;
  step3: EnhancedVisualData;
  step4: EnhancedCapacityData;
  step5: EnhancedStep5DocumentsData;
  step6: EnhancedStep6StripeData;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const redirectToLoginOnExpiredSession = useCallback(() => {
    const message = encodeURIComponent('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
    router.replace(`/auth/login?reason=expired&message=${message}`);
  }, [router]);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  // UX-3: counter para disparar auto-expansión del primer producto incompleto en step 2
  const [focusProductsCounter, setFocusProductsCounter] = useState(0);

  // Estado con tipos específicos por paso
  const [formData, setFormData] = useState<OnboardingFormData>({
    step1: {
      street: '',
      streetNumber: '',
      streetComplement: '',
      city: '',
      province: '',
      postalCode: '',
      categories: [],
      locationImages: [],
      foundedYear: undefined,
      teamSize: undefined,
      taxId: '',
      entityType: undefined,
      legalRepresentativeName: '',
      businessPhone: '',
      billingAddressSameAsProduction: true,
      billingAddress: undefined,
    },
    step2: {
      businessName: '',
      tagline: '',
      description: '',
      values: [],
      photos: [],
      website: '',
      instagramHandle: '',
      productionPhilosophy: '',
      certifications: []
    },
    step_products: {
      products: [],
    },
    step3: {
      logo: null,
      banner: null,
      introVideo: ''
    },
    step4: {
      isInOriginRoute: false,
      deliveryOptions: [],
      includedZones: [],
      excludedZones: [],
      minOrderAmount: 20,
      sustainablePackaging: false,
      packagingDescription: ''
    },
    step5: {
      cif: undefined,
      seguroRC: undefined,
      manipuladorAlimentos: undefined,
      certifications: [],
      verificationStatus: 'pending'
    },
    step6: {
      stripeConnected: false,
      acceptTerms: false
    }
  });

  useEffect(() => {
    loadOnboardingData()
      .then((res: any) => {
        const d = res?.data;
        if (!d) return;
        setFormData(prev => ({
          ...prev,
          step1: {
            ...prev.step1,
            // Identidad legal (Sprint 2)
            entityType: d.fiscal?.entityType ?? prev.step1.entityType,
            legalRepresentativeName: d.fiscal?.legalRepresentativeName ?? prev.step1.legalRepresentativeName,
            businessPhone: d.fiscal?.businessPhone ?? prev.step1.businessPhone,
            taxId: d.fiscal?.taxId ?? prev.step1.taxId,
            // Dirección de producción
            street: d.location?.street ?? d.location?.address ?? prev.step1.street,
            streetNumber: d.location?.streetNumber ?? prev.step1.streetNumber,
            streetComplement: d.location?.streetComplement ?? prev.step1.streetComplement,
            city: d.location?.city ?? prev.step1.city,
            province: d.location?.province ?? d.fiscal?.legalProvince ?? prev.step1.province,
            postalCode: d.location?.postalCode ?? prev.step1.postalCode,
            foundedYear: d.location?.foundedYear ?? prev.step1.foundedYear,
            teamSize: d.location?.teamSize ?? prev.step1.teamSize,
            categories: d.fiscal?.categories?.length ? d.fiscal.categories : prev.step1.categories,
            // Dirección de facturación (Sprint 2)
            billingAddressSameAsProduction: d.fiscal?.billingAddress == null,
            billingAddress: d.fiscal?.billingAddress ?? prev.step1.billingAddress,
          },
          step2: {
            ...prev.step2,
            businessName: d.story?.businessName ?? d.fiscal?.businessName ?? prev.step2.businessName,
            tagline: d.story?.tagline ?? prev.step2.tagline,
            description: d.story?.description ?? d.fiscal?.whyOrigin ?? prev.step2.description,
            productionPhilosophy: d.story?.productionPhilosophy ?? prev.step2.productionPhilosophy,
            values: d.story?.values?.length ? d.story.values : prev.step2.values,
            website: d.story?.website ?? prev.step2.website,
            instagramHandle: d.story?.instagramHandle ?? prev.step2.instagramHandle,
          },
          step3: {
            ...prev.step3,
            introVideo: d.story?.introVideoUrl ?? prev.step3.introVideo,
          },
          step4: d.logistics ? {
            ...prev.step4,
            isInOriginRoute: d.logistics.isInOriginRoute,
            logisticsLevel: d.logistics.logisticsLevel ?? prev.step4.logisticsLevel,
            useCentralizedTransport: d.logistics.useCentralizedTransport ?? prev.step4.useCentralizedTransport,
            minOrderAmount: Number.isFinite(Number(d.logistics.minOrderAmount))
              ? Number(d.logistics.minOrderAmount)
              : prev.step4.minOrderAmount,
            sustainablePackaging: d.logistics.sustainablePackaging,
            packagingDescription: d.logistics.packagingDescription ?? '',
            deliveryOptions: (Array.isArray(d.logistics.deliveryOptions) ? d.logistics.deliveryOptions : []).map((o: any) => ({
              id: o.id, name: o.name, description: o.description ?? '',
              price: Number(o.price), estimatedDays: o.estimatedDays,
              icon: Package,
            })),
            includedZones: (Array.isArray(d.logistics.shippingZones) ? d.logistics.shippingZones : []).filter((z: any) => !z.isExcluded)
              .map((z: any) => ({ id: z.id, type: z.type.toLowerCase(), value: z.value, label: z.label })),
            excludedZones: (Array.isArray(d.logistics.shippingZones) ? d.logistics.shippingZones : []).filter((z: any) => z.isExcluded)
              .map((z: any) => ({ id: z.id, type: z.type.toLowerCase(), value: z.value, label: z.label })),
          } : prev.step4,
          step_products: Array.isArray(d.products) && d.products.length ? {
            products: d.products.map((p: any) => ({
              id: p.id,
              name: p.name ?? '',
              description: p.description ?? '',
              categoryId: p.categoryId ?? '',
              referencePrice: p.referencePrice != null ? Number(p.referencePrice) : undefined,
              unit: p.unit ?? 'kg',
              allergens: p.allergens ?? [],
              mayContain: p.mayContain ?? [],
              noAllergens: p.noAllergens ?? false,
              availabilityType: p.availabilityType ?? 'year_round',
              activeMonths: p.activeMonths ?? [],
              leadTimeDays: p.leadTimeDays ?? undefined,
              photo: p.imageUrl ? { preview: p.imageUrl, url: p.imageUrl } : undefined,
            })),
          } : prev.step_products,
          step6: d.payment ? {
            stripeConnected: d.payment.stripeConnected,
            acceptTerms: !!d.payment.acceptedTermsAt,
          } : prev.step6,
        }));
        if (d.onboarding?.currentStep) {
          const savedStep = Math.min(d.onboarding.currentStep - 1, STEPS.length - 1);
          setCurrentStep(Math.max(0, savedStep));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof GatewayError && error.status === 401) {
          redirectToLoginOnExpiredSession();
          return;
        }
        /* primer acceso — sin datos guardados */
      })
      .finally(() => setIsLoading(false));
  }, [redirectToLoginOnExpiredSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const stepValidationMessages = useMemo<string[]>(() => {
    const messages: string[] = [];

    switch (currentStep) {
      case 0: {
        const { step1 } = formData;
        const billingRequired = !step1.billingAddressSameAsProduction;
        const billingOk = !billingRequired ||
          (!!step1.billingAddress?.street.trim() &&
           !!step1.billingAddress?.streetNumber.trim() &&
           !!step1.billingAddress?.city.trim() &&
           /^\d{5}$/.test(step1.billingAddress?.postalCode ?? ''));
        const legalRepOk = step1.entityType === 'autonomo' || !step1.entityType
          ? true
          : !!step1.legalRepresentativeName?.trim();
        const phoneOk = !!step1.businessPhone && /^[6789]\d{8}$/.test(step1.businessPhone);

        if (!step1.entityType) messages.push('Selecciona el tipo de entidad.');
        if (!validateSpanishTaxId(step1.taxId ?? '').valid) messages.push('Introduce un CIF/NIF válido.');
        if (!legalRepOk) messages.push('Añade el representante legal para entidades jurídicas.');
        if (!phoneOk) messages.push('Introduce un teléfono válido (9 dígitos, empieza por 6, 7, 8 o 9).');
        if (!step1.street.trim()) messages.push('Completa la calle de producción.');
        if (!step1.streetNumber.trim()) messages.push('Completa el número de la dirección de producción.');
        if (!step1.city.trim()) messages.push('Completa la ciudad de producción.');
        if (!step1.province) messages.push('Selecciona la provincia de producción.');
        if (!/^\d{5}$/.test(step1.postalCode)) messages.push('El código postal de producción debe tener 5 dígitos.');
        if (step1.categories.length < 1) messages.push('Selecciona al menos una categoría de productos.');
        if (!billingOk) messages.push('Completa la dirección de facturación o marca que es igual a la de producción.');
        break;
      }
      case 1: {
        if (!formData.step2.businessName.trim()) messages.push('Escribe el nombre del negocio.');
        if (formData.step2.description.trim().length < 50) messages.push('Amplía la historia del negocio (mínimo 50 caracteres).');
        if (formData.step2.values.length < 1) messages.push('Selecciona al menos un valor que represente tu marca.');
        break;
      }
      case 2: {
        const products = formData.step_products.products;
        if (products.length < 1) {
          messages.push('Añade al menos un producto para continuar.');
          break;
        }

        products.forEach((product, index) => {
          const errors = getProductErrors(product);
          if (errors.length > 0) {
            const productLabel =
              product.name.trim().length >= 3
                ? `"${product.name.trim()}"`
                : `Producto ${index + 1}`;
            messages.push(`${productLabel}: falta ${errors.join(', ')}.`);
          }
        });
        break;
      }
      case 3: {
        if (formData.step3.logo === null) messages.push('Sube el logo del negocio para continuar.');
        break;
      }
      case 4: {
        if (formData.step4.deliveryOptions.length < 1) messages.push('Añade al menos un método de envío.');
        if (formData.step4.includedZones.length < 1) messages.push('Añade al menos una zona de entrega incluida.');
        if (!formData.step4.minOrderAmount || formData.step4.minOrderAmount <= 0) messages.push('El pedido mínimo debe ser mayor que 0 €.');
        break;
      }
      case 5: {
        if (!formData.step5.cif) messages.push('Sube el documento CIF/NIF.');
        if (!formData.step5.seguroRC) messages.push('Sube el documento de seguro RC.');
        if (!formData.step5.manipuladorAlimentos) messages.push('Sube el documento de manipulador de alimentos.');
        break;
      }
      case 6: {
        if (!formData.step6.acceptTerms) {
          messages.push('Debes aceptar los términos para finalizar el onboarding. Stripe sigue siendo opcional en este paso.');
        }
        break;
      }
      default:
        break;
    }

    return messages;
  }, [currentStep, formData]);

  const isStepValid = stepValidationMessages.length === 0;

  const focusFirstIncompleteField = useCallback(() => {
    if (typeof window === 'undefined') return;

    // UX-3: en el paso de productos, delegar al componente vía counter
    if (currentStep === 2) {
      setFocusProductsCounter((c) => c + 1);
      return;
    }

    const formRoot = document.querySelector('[data-onboarding-step-content]');
    if (!formRoot) return;

    const candidates = Array.from(
      formRoot.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>(
        'input, textarea, select, button[role="combobox"]',
      ),
    );

    const firstInvalid = candidates.find((el) => {
      if (el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-invalid') === 'true') return true;

      const isRequired = el.hasAttribute('required');
      if (!isRequired) return false;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return !String(el.value ?? '').trim();
      }

      return false;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const firstFocusable = formRoot.querySelector<HTMLElement>('input, textarea, select, button[role="combobox"]');
    if (firstFocusable) {
      firstFocusable.focus();
      firstFocusable.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  // ========================================================================
  // GUARDAR PASO ACTUAL EN EL BACKEND
  // ========================================================================

  const saveCurrentStep = useCallback(async (step: number) => {
    switch (step) {
      case 0: {
        let locationImageKeys: string[] = [];
        try {
          locationImageKeys = await Promise.all(
            formData.step1.locationImages.filter((f) => f.file).map((f) => uploadFile(f.file!, 'visual/location').then((r) => r.key)),
          );
        } catch (uploadErr) {
          throw new Error(`No se pudieron subir las fotos del local: ${getUserFriendlyError(uploadErr)}`);
        }
        await saveStep1(formData.step1, locationImageKeys);
        break;
      }
      case 1: {
        const teamPhotoKeys = await Promise.all(
          formData.step2.photos.filter((f) => f.file).map((f) => uploadFile(f.file!, 'visual/team').then((r) => r.key)),
        );
        await saveStep2(formData.step2, teamPhotoKeys);
        break;
      }
      case 2: {
        const productImageKeys = await Promise.all(
          formData.step_products.products
            .filter((p) => p.photo?.file)
            .map(async (p) => ({
              productId: p.id,
              imageKey: (await uploadFile(p.photo!.file!, `products/${p.id}`)).key,
            })),
        );
        await saveStepProducts(formData.step_products.products, productImageKeys);
        break;
      }
      case 3: {
        const logoKey = formData.step3.logo?.file
          ? (await uploadFile(formData.step3.logo.file, 'visual/logo')).key
          : undefined;
        const bannerKey = formData.step3.banner?.file
          ? (await uploadFile(formData.step3.banner.file, 'visual/banner')).key
          : undefined;
        await saveStep3({ logoKey, bannerKey, introVideoUrl: formData.step3.introVideo });
        break;
      }
      case 4: {
        await saveStep4(formData.step4);
        break;
      }
      case 5: {
        const cifKey = formData.step5.cif?.file
          ? (await uploadFile(formData.step5.cif.file, 'documents/cif')).key
          : undefined;
        const seguroRcKey = formData.step5.seguroRC?.file
          ? (await uploadFile(formData.step5.seguroRC.file, 'documents/seguro-rc')).key
          : undefined;
        const manipuladorAlimentosKey = formData.step5.manipuladorAlimentos?.file
          ? (await uploadFile(formData.step5.manipuladorAlimentos.file, 'documents/manipulador-alimentos')).key
          : undefined;
        const certificationDocumentKeys = await Promise.all(
          formData.step5.certifications
            .filter((c) => (c as any).file)
            .map(async (c) => ({
              certificationId: c.certificationId,
              documentKey: (await uploadFile((c as any).file, `documents/certifications/${c.certificationId}`)).key,
            })),
        );
        await saveStep5(formData.step5, { cifKey, seguroRcKey, manipuladorAlimentosKey, certificationDocumentKeys });
        break;
      }
      case 6: {
        await saveStep6(formData.step6);
        break;
      }
    }
  }, [formData]);

  // ========================================================================
  // MANEJADORES DE NAVEGACIÓN
  // ========================================================================

  const handleNext = async () => {
    if (currentStep >= totalSteps - 1) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await saveCurrentStep(currentStep);
      setDirection(1);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      console.error('[Onboarding] handleNext error:', error);
      if (error instanceof GatewayError && error.status === 401) {
        redirectToLoginOnExpiredSession();
        return;
      }
      setSaveError(getUserFriendlyError(error, 'Error al guardar. Inténtalo de nuevo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep) {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await saveCurrentStep(currentStep);
      await apiCompleteOnboarding();
      if (user) {
        setUser({ ...user, onboardingCompleted: true });
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('[Onboarding] handleComplete error:', error);
      if (error instanceof GatewayError && error.status === 401) {
        redirectToLoginOnExpiredSession();
        return;
      }
      setSaveError(getUserFriendlyError(error, 'Error al completar el onboarding. Inténtalo de nuevo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipOnboarding = () => {
    router.push('/dashboard');
  };

  // ========================================================================
  // MANEJADORES DE CAMBIO POR PASO (TIPADOS)
  // ========================================================================
  
  const handleStep1Change = (data: EnhancedLocationData) => {
    setFormData(prev => ({ ...prev, step1: data }));
  };

  const handleStep2Change = (data: EnhancedStoryData) => {
    setFormData(prev => ({ ...prev, step2: data }));
  };

  const handleStepProductsChange = (data: EnhancedProductsData) => {
    setFormData(prev => ({ ...prev, step_products: data }));
  };

  const handleStep3Change = (data: EnhancedVisualData) => {
    setFormData(prev => ({ ...prev, step3: data }));
  };

  const handleStep4Change = (data: EnhancedCapacityData) => {
    setFormData(prev => ({ ...prev, step4: data }));
  };

  const handleStep5Change = (data: EnhancedStep5DocumentsData) => {
    setFormData(prev => ({ ...prev, step5: data }));
  };

  const handleStep6Change = (data: EnhancedStep6StripeData) => {
    setFormData(prev => ({ ...prev, step6: data }));
  };

  // ========================================================================
  // RENDER DEL PASO ACTUAL
  // ========================================================================
  
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <EnhancedStep1Location
            data={formData.step1}
            onChange={handleStep1Change}
          />
        );
      case 1:
        return (
          <EnhancedStep2Story
            data={formData.step2}
            onChange={handleStep2Change}
          />
        );
      case 2:
        return (
          <EnhancedStepProducts
            data={formData.step_products}
            onChange={handleStepProductsChange}
            autoExpandFirstIncomplete={focusProductsCounter}
          />
        );
      case 3:
        return (
          <EnhancedStep3Visual
            data={formData.step3}
            onChange={handleStep3Change}
          />
        );
      case 4:
        return (
          <EnhancedStep4Capacity
            data={formData.step4}
            onChange={handleStep4Change}
          />
        );
      case 5:
        return (
          <EnhancedStep5Documents
            data={formData.step5}
            onChange={handleStep5Change}
            selectedCertifications={formData.step2.certifications?.map(c => ({
              id: c.id,
              name: c.name,
              issuingBody: c.issuingBody
            })) || []}
          />
        );
      case 6:
        return (
          <EnhancedStep6Stripe
            data={formData.step6}
            onChange={handleStep6Change}
            userEmail={user?.email}
            firstName={user?.firstName}
            lastName={user?.lastName}
            businessName={formData.step2.businessName}
            website={formData.step2.website}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-origen-pradera border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema/30">
      
      {/* ====================================================================
          HEADER - Ultra minimal
      ==================================================================== */}
      <header className="sticky top-0 z-50 w-full bg-surface-alt/80 backdrop-blur-sm border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                  <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="100" cy="140" r="8" fill="white"/>
                  <circle cx="100" cy="140" r="5" fill="#74C69D"/>
                </svg>
              </div>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1}/{totalSteps}
              </span>
              <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-origen-pradera rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper horizontal - solo mobile */}
      <MobileStepperBar steps={STEPS} currentStep={currentStep} />

      {/* ====================================================================
          MAIN - Layout: Timeline vertical (4) + Formulario (8)
      ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:py-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* ====================================================================
              COLUMNA IZQUIERDA - Timeline vertical (4/12) — solo desktop
          ==================================================================== */}
          <div className="hidden lg:block lg:w-4/12">
            <div className="sticky top-24 space-y-6">
              
              {/* Título de la sección */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkles className="w-4 h-4 text-origen-pradera" />
                <h2 className="text-xs font-bold text-origen-bosque uppercase tracking-wider">
                  Configura tu tienda
                </h2>
              </div>
              
              {/* Timeline vertical */}
              <div className="relative">
                {STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  const isPending = index > currentStep;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                      
                      {/* Línea conectora vertical */}
                      {index < totalSteps - 1 && (
                        <div 
                          className={cn(
                            "absolute left-5 top-10 w-0.5 h-[calc(100%-1.5rem)]",
                            index < currentStep 
                              ? "bg-gradient-to-b from-origen-pradera to-origen-pradera/40" 
                              : "bg-border"
                          )}
                        />
                      )}
                      
                      {/* Indicador del paso */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isCompleted && "bg-origen-pradera text-white shadow-sm",
                          isActive && "bg-surface-alt border-2 shadow-sm",
                          isActive && `border-${step.color.replace('text-', '')}`,
                          isPending && "bg-surface border border-border text-text-subtle",
                          !isActive && !isCompleted && !isPending && "bg-surface-alt border-2 border-border text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Icon className={cn("w-5 h-5", isActive && step.color)} />
                          )}
                        </div>
                        
                        {/* Badge de tiempo */}
                        <span className={cn(
                          "absolute -bottom-2 -right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm",
                          isCompleted 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-surface-alt text-muted-foreground border border-border"
                        )}>
                          {step.time}
                        </span>
                      </div>
                      
                      {/* Contenido del paso */}
                      <div 
                        onClick={() => handleStepClick(index)}
                        className={cn(
                          "flex-1 pt-1 transition-all",
                          isPending && "opacity-50 cursor-not-allowed",
                          !isPending && "cursor-pointer"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className={cn(
                            "text-sm font-semibold",
                            isActive && "text-origen-bosque",
                            isCompleted && "text-origen-oscuro",
                            isPending && "text-muted-foreground"
                          )}>
                            {step.title}
                          </h3>
                          
                          {/* Indicador de estado */}
                          {isActive && (
                            <span className="text-[10px] font-medium text-origen-pradera flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-origen-pradera animate-pulse" />
                              En progreso
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-medium text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Listo
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {step.description}
                        </p>
                        
                        {/* Descripción larga - solo paso activo */}
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {step.longDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Tiempo total estimado */}
              <div className="mt-4 bg-surface-alt/50 rounded-xl border border-border-subtle p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-origen-pradera/5 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-origen-pradera" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo total</p>
                    <p className="text-sm font-semibold text-origen-bosque">~14 minutos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ====================================================================
              COLUMNA DERECHA - Formulario (8/12)
          ==================================================================== */}
          <div className="w-full lg:w-8/12">
            
            {/* Título del paso actual */}
            <div className="mb-6 pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center",
                  STEPS[currentStep].bgColor
                )}>
                  {(() => {
                    const Icon = STEPS[currentStep].icon;
                    return <Icon className={cn("w-3.5 h-3.5", STEPS[currentStep].color)} />;
                  })()}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Paso {currentStep + 1} de {totalSteps}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-origen-bosque">
                {STEPS[currentStep].title}
              </h1>

              {!isStepValid && stepValidationMessages.length > 0 && (
                <StepValidationPanel
                  messages={stepValidationMessages}
                  onFocusFirstIncompleteField={focusFirstIncompleteField}
                />
              )}
            </div>

            {/* Contenido del paso - ANIMADO */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                data-onboarding-step-content
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {currentStep === 6 && formData.step6.acceptTerms && !formData.step6.stripeConnected && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                Puedes finalizar el onboarding sin Stripe ahora, pero no podrás publicar productos hasta conectarlo desde tu dashboard.
              </div>
            )}

            {/* ====================================================================
                ERROR DE GUARDADO
            ==================================================================== */}
            {saveError && (
              <div className="mt-6 p-3 bg-feedback-danger-subtle border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{saveError}</span>
                <button type="button" onClick={() => setSaveError(null)} className="ml-auto text-feedback-danger hover:text-red-700">×</button>
              </div>
            )}

            {/* ====================================================================
                NAVEGACIÓN - Botones (solo desktop — mobile usa MobileNavBar)
            ==================================================================== */}
            <div className="hidden lg:flex items-center justify-between mt-10 pt-6 border-t border-border">
              
              {/* Trust badges */}
              <div className="flex items-center gap-3 text-xs text-text-subtle">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SSL</span>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Km 0</span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="h-10 px-4 border-border text-origen-bosque hover:bg-origen-crema/50 hover:border-origen-pradera"
                  >
                    Anterior
                  </Button>
                )}

                {currentStep >= 1 && currentStep < totalSteps - 1 && (
                  <Button
                    variant="outline"
                    onClick={handleSkipOnboarding}
                    disabled={isSubmitting}
                    className="h-10 px-4 border-border text-muted-foreground hover:bg-surface hover:border-border text-xs"
                  >
                    Completar más tarde
                  </Button>
                )}

                {currentStep < totalSteps - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid || isSubmitting}
                    size="sm"
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!isStepValid || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Completando...
                      </>
                    ) : (
                      <>
                        Finalizar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Barra de navegación fija — solo mobile */}
      <MobileNavBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={currentStep < totalSteps - 1 ? handleNext : handleComplete}
        onSkip={handleSkipOnboarding}
        canContinue={isStepValid}
        isSubmitting={isSubmitting}
        isLastStep={currentStep === totalSteps - 1}
      />
    </div>
  );
}

