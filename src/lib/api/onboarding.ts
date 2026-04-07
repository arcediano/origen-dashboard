/**
 * Cliente para los endpoints de onboarding del producers-service (via gateway).
 * Cada función mapea los datos del formulario al DTO esperado por el backend.
 */

import { gatewayClient } from './client';
import type { EnhancedLocationData } from '@/components/features/onboarding/components/steps/step-location';
import type { EnhancedStoryData } from '@/components/features/onboarding/components/steps/step-story';
import type { EnhancedCapacityData } from '@/components/features/onboarding/components/steps/step-capacity';
import type { EnhancedStep5DocumentsData } from '@/components/features/onboarding/components/steps/step-documents';
import type { EnhancedStep6StripeData } from '@/components/features/onboarding/components/steps/step-stripe';
import type { OnboardingProduct } from '@/components/features/onboarding/components/steps/step-products';

// Tipos de respuesta
interface StepSaveResponse {
  success: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEAM_SIZE_MAP: Record<string, 'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'ELEVEN_PLUS'> = {
  '1-2': 'ONE_TWO',
  '3-5': 'THREE_FIVE',
  '6-10': 'SIX_TEN',
  '11+': 'ELEVEN_PLUS',
};

// ─── Paso 1: Ubicación ────────────────────────────────────────────────────────

export async function saveStep1(
  data: EnhancedLocationData,
  locationImageKeys: string[],
): Promise<StepSaveResponse> {
  const billingAddress = data.billingAddressSameAsProduction
    ? undefined
    : data.billingAddress
      ? {
          street: data.billingAddress.street,
          streetNumber: data.billingAddress.streetNumber,
          streetComplement: data.billingAddress.streetComplement,
          city: data.billingAddress.city,
          province: data.billingAddress.province,
          postalCode: data.billingAddress.postalCode,
        }
      : undefined;

  return gatewayClient.post('/producers/onboarding/step/1', {
    // Identidad legal
    entityType: data.entityType,
    legalRepresentativeName: data.legalRepresentativeName || undefined,
    businessPhone: data.businessPhone,
    taxId: data.taxId,
    // Dirección de producción — campos separados (no concatenados)
    street: data.street,
    streetNumber: data.streetNumber,
    streetComplement: data.streetComplement || undefined,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    // Dirección de facturación (undefined si es igual a la de producción)
    billingAddress,
    categories: data.categories,
    foundedYear: data.foundedYear ?? null,
    teamSize: data.teamSize ? TEAM_SIZE_MAP[data.teamSize] : null,
    locationImageKeys,
  });
}

// ─── Paso 2: Historia ─────────────────────────────────────────────────────────

export async function saveStep2(
  data: EnhancedStoryData,
  teamPhotoKeys: string[],
): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/2', {
    businessName: data.businessName,
    tagline: data.tagline || undefined,
    description: data.description,
    productionPhilosophy: data.productionPhilosophy || undefined,
    values: data.values,
    website: data.website || undefined,
    instagramHandle: data.instagramHandle || undefined,
    certifications: data.certifications?.map((c) => ({
      certificationId: c.id,
      name: c.name,
      issuingBody: c.issuingBody,
    })),
    teamPhotoKeys,
  });
}

// ─── Paso 3: Perfil visual ────────────────────────────────────────────────────

export async function saveStep3(keys: {
  logoKey?: string;
  bannerKey?: string;
  introVideoUrl?: string;
}): Promise<StepSaveResponse> {
  const introVideoUrl = keys.introVideoUrl?.trim() || undefined;

  return gatewayClient.post('/producers/onboarding/step/3', {
    logoKey: keys.logoKey,
    bannerKey: keys.bannerKey,
    productImageKeys: [],
    introVideoUrl,
  });
}

// ─── Paso 4: Logística ────────────────────────────────────────────────────────

export async function saveStep4(data: EnhancedCapacityData): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/4', {
    isInOriginRoute: data.isInOriginRoute,
    logisticsLevel: data.logisticsLevel,
    useCentralizedTransport: data.useCentralizedTransport,
    minOrderAmount: data.minOrderAmount,
    sustainablePackaging: data.sustainablePackaging ?? false,
    packagingDescription: data.packagingDescription || undefined,
    deliveryOptions: data.deliveryOptions.map((opt) => ({
      name: opt.name,
      description: opt.description || undefined,
      price: opt.price,
      estimatedDays: opt.estimatedDays,
    })),
    includedZones: data.includedZones.map((z) => ({
      type: z.type.toUpperCase() as 'PROVINCE' | 'POSTAL' | 'CUSTOM',
      value: z.value,
      label: z.label,
    })),
    excludedZones: data.excludedZones?.map((z) => ({
      type: z.type.toUpperCase() as 'PROVINCE' | 'POSTAL' | 'CUSTOM',
      value: z.value,
      label: z.label,
    })),
  });
}

// ─── Paso 5: Documentos ───────────────────────────────────────────────────────

export async function saveStep5(
  data: EnhancedStep5DocumentsData,
  keys: {
    cifKey?: string;
    seguroRcKey?: string;
    manipuladorAlimentosKey?: string;
    certificationDocumentKeys: Array<{ certificationId: string; documentKey: string }>;
  },
): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/5', {
    cifKey: keys.cifKey,
    seguroRcKey: keys.seguroRcKey,
    manipuladorAlimentosKey: keys.manipuladorAlimentosKey,
    certificationDocuments: keys.certificationDocumentKeys,
  });
}

// ─── Paso 6: Pagos ────────────────────────────────────────────────────────────

export async function saveStep6(data: EnhancedStep6StripeData): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/6', {
    stripeConnected: data.stripeConnected,
    stripeAccountId: data.stripeAccountId,
    acceptTerms: data.acceptTerms,
  });
}

// ─── Paso Productos ───────────────────────────────────────────────────────────

export async function saveStepProducts(
  products: OnboardingProduct[],
  productImageKeys: Array<{ productId: string; imageKey: string }>,
): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/products', {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId || undefined,
      referencePrice: p.referencePrice,
      unit: p.unit,
      allergens: p.allergens,
      mayContain: p.mayContain,
      noAllergens: p.noAllergens,
      availabilityType: p.availabilityType,
      activeMonths: p.activeMonths,
      leadTimeDays: p.leadTimeDays,
      imageKey: productImageKeys.find((k) => k.productId === p.id)?.imageKey,
    })),
  });
}

// ─── Completar onboarding ─────────────────────────────────────────────────────

export async function completeOnboarding(): Promise<{ success: boolean; onboardingCompleted: boolean }> {
  return gatewayClient.post('/producers/onboarding/complete');
}

// ─── Cargar datos guardados ────────────────────────────────────────────────────

export async function loadOnboardingData(): Promise<any> {
  return gatewayClient.get('/producers/onboarding/data');
}
