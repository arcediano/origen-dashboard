/**
 * Cliente para los endpoints de onboarding del producers-service (vía gateway).
 *
 * Contrato: ADR-020 (onboarding de 5 pasos) de origen-master-microservices.
 * La ValidationPipe del backend usa `forbidNonWhitelisted`: un campo que no
 * está en el DTO se rechaza con 400, por eso los `build*Body` de aquí solo
 * emiten los campos vigentes (y están cubiertos por tests).
 */

import { gatewayClient } from './client';
import { isDeliveryOptionComplete } from '@/lib/onboarding/shipping';
import type {
  DeliveryChoice,
  DeliveryTimeUnit,
  DocumentsData,
  DocumentSlot,
  LocationData,
  ShippingCoverage,
  ShippingData,
  ShippingZone,
  StripeData,
} from '@/lib/onboarding/types';

// Tipos de respuesta
interface StepSaveResponse {
  success: boolean;
}

export interface OnboardingDataResponse {
  success: boolean;
  data: OnboardingData;
}

export type ApiDocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface OnboardingData {
  /** Gate único de visibilidad en el marketplace (ADR-007). Determina si el
   *  guard de "al menos un método de envío activo" aplica al guardar logística. */
  profilePubliclyReady?: boolean;
  fiscal?: {
    businessName?: string;
    legalName?: string;
    taxId?: string;
    businessPhone?: string;
    categories?: string[];
    entityType?: string;
    legalRepresentativeName?: string;
    legalProvince?: string;
    whyOrigin?: string | null;
    billingAddress?: {
      street?: string;
      streetNumber?: string;
      streetComplement?: string | null;
      city?: string;
      province?: string;
      postalCode?: string;
    } | null;
  } | null;
  location?: {
    street?: string;
    streetNumber?: string;
    streetComplement?: string | null;
    city?: string;
    province?: string;
    postalCode?: string;
    foundedYear?: number | null;
    teamSize?: 'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'ELEVEN_PLUS' | string | null;
  } | null;
  story?: {
    businessName?: string;
    tagline?: string | null;
    description?: string | null;
    productionPhilosophy?: string | null;
    values?: string[];
    website?: string | null;
    introVideoUrl?: string | null;
    instagramHandle?: string | null;
  } | null;
  visual?: {
    logoUrl?: string | null;
    logoDocId?: string | null;
    bannerUrl?: string | null;
    bannerDocId?: string | null;
    teamPhotoUrls?: Array<{ key: string; url: string }>;
    locationImageUrls?: Array<{ key: string; url: string }>;
    teamPhotoDocIds?: string[];
    locationImageDocIds?: string[];
  } | null;
  /** Duplicado de `visual` por compatibilidad (ADR-020 §7). */
  visualUrls?: {
    logoUrl?: string | null;
    logoKey?: string | null;
    bannerUrl?: string | null;
    bannerKey?: string | null;
    teamPhotos?: Array<{ key: string; url: string }>;
    locationImages?: Array<{ key: string; url: string }>;
  } | null;
  payment?: {
    stripeConnected?: boolean;
    stripeAccountId?: string | null;
    acceptedTermsAt?: string | null;
    /** Modelo A - Intermediario (Sección 3): true si hay un reembolso cuyo
     *  Transfer ya cobrado no se pudo revertir por saldo insuficiente. */
    hasDebt?: boolean;
    /** Importe pendiente de saldar, en céntimos. Se descuenta automáticamente
     *  de las próximas transferencias hasta llegar a 0. */
    debtAmountCents?: number;
  } | null;
  /** Certificaciones declaradas (rehidratación del paso 4). */
  certifications?: Array<{
    certificationId: string;
    name: string;
    issuingBody?: string;
    status: ApiDocumentStatus;
    documentKey?: string | null;
    documentUrl?: string | null;
    verifiedAt?: string | null;
    expiresAt?: string | null;
    rejectedReason?: string | null;
    pendingDocumentKey?: string | null; // ADR-009
    pendingExpiresAt?: string | null; // ADR-009
  }> | null;
  /** Documentos legales (rehidratación del paso 4). `documentKey` es null si la clave no cumple el patrón S3. */
  documents?: Array<{
    type: 'CIF' | 'SEGURO_RC' | 'MANIPULADOR_ALIMENTOS';
    status: ApiDocumentStatus;
    documentKey?: string | null;
    documentUrl?: string | null;
    /** Reverso — solo el CIF lo rellena; el resto de tipos van siempre `null`. */
    documentKeyBack?: string | null;
    documentUrlBack?: string | null;
    verifiedAt?: string | null;
    expiresAt?: string | null;
    rejectedReason?: string | null;
    pendingDocumentKey?: string | null; // ADR-009
    pendingDocumentKeyBack?: string | null; // ADR-009
    pendingExpiresAt?: string | null; // ADR-009
  }> | null;
  logistics?: {
    /** Elección explícita del productor (delegar en Origen / gestión propia). */
    deliveryChoice?: DeliveryChoice | null;
    minOrderAmount?: number;
    sustainablePackaging?: boolean;
    packagingDescription?: string | null;
    deliveryOptions?: Array<{
      id?: string;
      name: string;
      description?: string | null;
      price: number;
      estimatedDaysValue: number;
      estimatedDaysUnit: DeliveryTimeUnit;
    }>;
    shippingZones?: Array<{
      id?: string;
      type: 'PROVINCE' | 'POSTAL' | 'CUSTOM';
      value: string;
      label: string;
      isExcluded?: boolean;
    }>;
  } | null;
  pickupAssignment?: {
    id: string;
    state: 'ACTIVE' | 'PENDING_CHOICE';
    routeName: string | null;
    warehouseName: string | null;
  } | null;
  onboarding?: {
    currentStep?: number;
    completedSteps?: number[];
    completedAt?: string | null;
  } | null;
}

// ─── Paso 1: Ubicación e identidad legal ──────────────────────────────────────

/**
 * Body de `POST /producers/onboarding/step/1` (SaveStep1Dto).
 *
 * `locationImageKeys`: si se envía (incluso `[]`) REEMPLAZA la lista; si se
 * omite no se toca. Por eso es opcional: quien no gestione las fotos (p. ej.
 * la pantalla de datos personales) no debe pasar `[]` o borraría las del local.
 * `foundedYear`/`teamSize` ya no se envían aquí (se editan en Perfil comercial).
 */
export function buildStep1Body(data: LocationData, locationImageKeys?: string[]) {
  const billingAddress = data.billingAddressSameAsProduction || !data.billingAddress
    ? undefined
    : {
        street: data.billingAddress.street,
        streetNumber: data.billingAddress.streetNumber,
        streetComplement: data.billingAddress.streetComplement || undefined,
        city: data.billingAddress.city,
        province: data.billingAddress.province,
        postalCode: data.billingAddress.postalCode,
      };

  return {
    entityType: data.entityType,
    legalRepresentativeName: data.legalRepresentativeName || undefined,
    businessPhone: data.businessPhone,
    taxId: data.taxId,
    street: data.street,
    streetNumber: data.streetNumber,
    streetComplement: data.streetComplement || undefined,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    billingAddress,
    categories: data.categories,
    ...(locationImageKeys !== undefined && { locationImageKeys }),
  };
}

export async function saveStep1(
  data: LocationData,
  locationImageKeys?: string[],
): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/1', buildStep1Body(data, locationImageKeys));
}

// ─── Paso 2: Perfil visual ────────────────────────────────────────────────────

export interface Step2Keys {
  logoKey?: string;
  bannerKey?: string;
  teamPhotoKeys: string[];
  introVideoUrl?: string;
}

/** `null` borra (banner/vídeo); `teamPhotoKeys` reemplaza la lista completa. */
export function buildStep2Body(keys: Step2Keys) {
  return {
    logoKey: keys.logoKey,
    bannerKey: keys.bannerKey ?? null,
    teamPhotoKeys: keys.teamPhotoKeys,
    introVideoUrl: keys.introVideoUrl?.trim() || null,
  };
}

export async function saveStep2(keys: Step2Keys): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/2', buildStep2Body(keys));
}

// ─── Paso 3: Envíos (también lo usa /dashboard/configuracion/envios) ─────────

const toApiZone = (z: ShippingZone) => ({
  type: z.type.toUpperCase() as 'PROVINCE' | 'POSTAL' | 'CUSTOM',
  value: z.value,
  label: z.label,
});

/**
 * Body de `POST /producers/onboarding/step/3` (SaveStep3Dto).
 * `isInOriginRoute` ya no se envía (se deriva de `deliveryChoice` y el backend
 * lo rechaza). Con `delegated` no se piden opciones, pero se reenvían las ya
 * guardadas y completas para no borrarlas (ADR-020 §4.2 / §12.1).
 */
export function buildStep3Body(data: ShippingData & { deliveryChoice: DeliveryChoice }) {
  return {
    deliveryChoice: data.deliveryChoice,
    minOrderAmount: data.minOrderAmount,
    sustainablePackaging: data.sustainablePackaging,
    packagingDescription: data.sustainablePackaging ? data.packagingDescription.trim() || undefined : undefined,
    deliveryOptions: data.deliveryOptions.filter(isDeliveryOptionComplete).map((opt) => ({
      name: opt.name.trim(),
      description: opt.description.trim(),
      price: opt.price,
      estimatedDaysValue: opt.estimatedDaysValue ?? 0,
      estimatedDaysUnit: opt.estimatedDaysUnit,
    })),
    includedZones: data.includedZones.map(toApiZone),
    excludedZones: data.excludedZones.length > 0 ? data.excludedZones.map(toApiZone) : undefined,
  };
}

export interface SaveStep3Response extends StepSaveResponse {
  pickupRoute?: { id: string; name: string; warehouseName: string | null; availableForDelegation: boolean } | null;
  deliveryChoice?: DeliveryChoice;
}

export async function saveStep3(
  data: ShippingData & { deliveryChoice: DeliveryChoice },
): Promise<SaveStep3Response> {
  return gatewayClient.post('/producers/onboarding/step/3', buildStep3Body(data));
}

/**
 * Cobertura de Origen para el CP de producción guardado en el paso 1
 * (`GET /producers/onboarding/shipping-coverage`). Decide si el productor
 * puede delegar el envío en Origen o tiene que gestionarlo él.
 */
export async function getShippingCoverage(): Promise<ShippingCoverage> {
  const res = await gatewayClient.get<{ success: boolean; data: ShippingCoverage }>(
    '/producers/onboarding/shipping-coverage',
  );
  return res.data;
}

// ─── Paso 4: Documentación y certificaciones ──────────────────────────────────

export interface Step4Keys {
  cifKey?: string;
  /** Reverso del CIF/NIF. Obligatorio en el servidor en cuanto se envía `cifKey`. */
  cifBackKey?: string;
  seguroRcKey?: string;
  manipuladorAlimentosKey?: string;
  /** Lista completa de certificaciones declaradas (reemplaza la del servidor). */
  certifications: Array<{ certificationId: string; documentKey?: string; expiresAt?: string }>;
}

/** Fecha a enviar: la ISO original si el día no ha cambiado (no-op en servidor), si no `YYYY-MM-DD`. */
export function resolveExpiresAt(slot: Pick<DocumentSlot, 'expiresAt' | 'originalExpiresAt'>): string | undefined {
  if (!slot.expiresAt) return undefined;
  if (slot.originalExpiresAt && slot.originalExpiresAt.slice(0, 10) === slot.expiresAt) {
    return slot.originalExpiresAt;
  }
  return slot.expiresAt;
}

export function buildStep4Body(data: DocumentsData, keys: Step4Keys) {
  return {
    cifKey: keys.cifKey,
    cifBackKey: keys.cifBackKey,
    cifExpiresAt: resolveExpiresAt(data.cif),
    seguroRcKey: keys.seguroRcKey,
    seguroRcExpiresAt: resolveExpiresAt(data.seguroRc),
    manipuladorAlimentosKey: keys.manipuladorAlimentosKey,
    manipuladorAlimentosExpiresAt: resolveExpiresAt(data.manipulador),
    certifications: keys.certifications,
  };
}

export async function saveStep4(data: DocumentsData, keys: Step4Keys): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/4', buildStep4Body(data, keys));
}

// ─── Paso 5: Pagos ────────────────────────────────────────────────────────────

/** `stripeConnected` no se envía: solo lo escribe el webhook de Stripe (el backend lo rechaza con 400). */
export function buildStep5Body(data: Pick<StripeData, 'stripeAccountId' | 'acceptTerms'>) {
  return {
    stripeAccountId: data.stripeAccountId,
    acceptTerms: data.acceptTerms,
  };
}

export async function saveStep5(data: Pick<StripeData, 'stripeAccountId' | 'acceptTerms'>): Promise<StepSaveResponse> {
  return gatewayClient.post('/producers/onboarding/step/5', buildStep5Body(data));
}

// ─── Completar onboarding ─────────────────────────────────────────────────────

export async function completeOnboarding(): Promise<{ success: boolean; onboardingCompleted: boolean }> {
  return gatewayClient.post('/producers/onboarding/complete');
}

// ─── Cargar datos guardados (wizard de onboarding) ────────────────────────────

export async function loadOnboardingData(): Promise<OnboardingDataResponse> {
  return gatewayClient.get('/producers/onboarding/data');
}

// ─── Cargar perfil del productor (páginas de edición del dashboard) ────────────
// Endpoint ligero: sin logistics, certifications ni onboarding progress.
// Usar esto en business/page.tsx, personal/page.tsx y cobros/page.tsx.

export async function loadProducerProfile(): Promise<OnboardingDataResponse> {
  return gatewayClient.get('/producers/profile');
}

// ─── Gestión de documentos post-onboarding ─────────────────────────────────────

/**
 * Reemplaza o sube un documento legal desde el dashboard post-onboarding.
 * Usa el nuevo endpoint PATCH /producers/me/documents/:type (Sprint 2 backend).
 */
export async function updateProducerDocument(
  type: 'CIF' | 'SEGURO_RC' | 'MANIPULADOR_ALIMENTOS',
  documentKey: string,
  expiresAt?: string,
  /** Reverso del documento. Solo aplica a CIF (anverso + reverso). */
  documentBackKey?: string,
): Promise<{ success: boolean }> {
  return gatewayClient.patch(`/producers/me/documents/${type}`, {
    documentKey,
    documentBackKey,
    expiresAt: expiresAt ?? null,
  });
}

/**
 * Reemplaza el documento de una certificación desde el dashboard post-onboarding.
 * Usa el nuevo endpoint PATCH /producers/me/certifications/:certificationId (Sprint 2 backend).
 */
export async function updateProducerCertification(
  certificationId: string,
  documentKey: string,
  expiresAt?: string,
): Promise<{ success: boolean }> {
  return gatewayClient.patch(`/producers/me/certifications/${certificationId}`, {
    documentKey,
    expiresAt: expiresAt ?? null,
  });
}

// ─── Readiness (ADR-007) ──────────────────────────────────────────────────────

export interface PaymentReadinessStatus {
  status: 'NOT_CONNECTED' | 'PENDING_VERIFICATION' | 'ACTION_REQUIRED' | 'RESTRICTED' | 'OK';
  requirementsDue: string[];
  deadline: string | null;
}

export interface ProducerReadinessReport {
  canSubmitProducts: boolean;
  producerStatus: string;
  profileChecks: {
    taxId:           { passed: boolean; blocker?: string };
    businessName:    { passed: boolean; blocker?: string };
    entityType:      { passed: boolean; blocker?: string };
    categories:      { passed: boolean; blocker?: string };
    location:        { passed: boolean; blocker?: string };
    logo:            { passed: boolean; blocker?: string };
    deliveryOption:  { passed: boolean; blocker?: string };
    stripeConnected: { passed: boolean; blocker?: string };
  };
  documentChecks: {
    CIF:                   string;
    SEGURO_RC:             string;
    MANIPULADOR_ALIMENTOS: string;
  };
  payment: PaymentReadinessStatus;
  blockers: string[];
}

/**
 * Obtiene el informe completo de requisitos mínimos de perfil del productor.
 * Usado por el UserMenu para mostrar el estado de visibilidad en el marketplace.
 */
export async function getMyReadiness(): Promise<ProducerReadinessReport> {
  return gatewayClient.get<ProducerReadinessReport>('/producers/me/readiness');
}

/**
 * Responde a una asignación pendiente de ruta de recogida (PENDING_CHOICE).
 * El productor elige si delegar en Origen o gestionar su propio envío.
 */
export async function respondPickupAssignmentChoice(
  assignmentId: string,
  choice: 'delegated' | 'own',
): Promise<{ success: boolean }> {
  return gatewayClient.patch(`/producers/me/pickup-assignment/${assignmentId}/choice`, { choice });
}
