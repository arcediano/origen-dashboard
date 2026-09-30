/**
 * Tipos del formulario del onboarding de productores (ADR-020, 5 pasos).
 *
 * Viven en `lib/` (no en los componentes de cada paso) para que el cliente de
 * API, la hidratación, la validación y los componentes compartan un único
 * contrato sin dependencias circulares.
 */

import type { UploadedFile } from '@/components/shared/upload/file-upload';
import type { DeliveryTimeUnit } from '@/lib/format-estimated-delivery';

// ─── Paso 1 — Ubicación e identidad legal ────────────────────────────────────

export type EntityType =
  | 'autonomo'
  | 'sl'
  | 'sa'
  | 'cooperativa'
  | 'comunidad_bienes'
  | 'asociacion'
  | 'otro';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  autonomo: 'Autónomo / Empresario individual',
  sl: 'Sociedad Limitada (SL)',
  sa: 'Sociedad Anónima (SA)',
  cooperativa: 'Cooperativa',
  comunidad_bienes: 'Comunidad de Bienes',
  asociacion: 'Asociación / Fundación',
  otro: 'Otra forma jurídica',
};

export interface AddressFields {
  street: string;
  streetNumber: string;
  streetComplement?: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface LocationData {
  entityType?: EntityType;
  legalRepresentativeName?: string;
  businessPhone?: string;
  taxId?: string;

  /** Dirección de producción (punto de recogida de pedidos). */
  street: string;
  streetNumber: string;
  streetComplement?: string;
  city: string;
  province: string;
  postalCode: string;

  billingAddressSameAsProduction: boolean;
  billingAddress?: AddressFields;

  categories: string[];
  /** Fotos del entorno (opcional). Las hidratadas traen `key`. */
  locationImages: UploadedFile[];
}

// ─── Paso 2 — Perfil visual ──────────────────────────────────────────────────

export interface VisualData {
  logo: UploadedFile | null;
  banner: UploadedFile | null;
  /** Fotos del equipo (antes en el paso de historia). */
  teamPhotos: UploadedFile[];
  introVideo?: string;
}

// ─── Paso 3 — Envíos ─────────────────────────────────────────────────────────

export type { DeliveryTimeUnit };
export type DeliveryChoice = 'delegated' | 'own';

export interface ShippingZone {
  id: string;
  type: 'province' | 'postal' | 'custom';
  /** Provincia, código postal (o patrón) o descripción. */
  value: string;
  label: string;
}

export interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Null = aún sin fijar. */
  estimatedDaysValue: number | null;
  estimatedDaysUnit: DeliveryTimeUnit;
}

export interface ShippingData {
  /** Elección explícita y obligatoria (delegar en Origen / gestión propia). */
  deliveryChoice?: DeliveryChoice;
  minOrderAmount: number;
  sustainablePackaging: boolean;
  packagingDescription: string;
  /** Solo se piden con `deliveryChoice === 'own'`; con `delegated` se conservan las ya guardadas. */
  deliveryOptions: DeliveryOption[];
  includedZones: ShippingZone[];
  /** No editables en el wizard: se conservan tal cual llegan del servidor. */
  excludedZones: ShippingZone[];
}

export type ShippingCoverageStatus = 'COVERED' | 'NOT_COVERED' | 'MISSING_POSTAL_CODE';

export interface ShippingCoverage {
  status: ShippingCoverageStatus;
  postalCode: string | null;
  canDelegate: boolean;
  /** Mensaje es-ES listo para mostrar (solo si `canDelegate` es false). */
  reason?: string;
  pickupRoute: { id: string; name: string; warehouseName: string | null } | null;
  currentChoice: DeliveryChoice | null;
}

// ─── Paso 4 — Documentación y certificaciones ────────────────────────────────

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface DocumentSlot {
  /** Archivo nuevo (con `file`) o ya subido/hidratado (con `key`). */
  file?: UploadedFile;
  /** Caducidad en formato `YYYY-MM-DD` (lo que edita el `DateInput`). */
  expiresAt?: string;
  /** Caducidad ISO tal como la devolvió el servidor (para reenviarla intacta si no cambia). */
  originalExpiresAt?: string | null;
  status?: DocumentStatus;
  rejectedReason?: string | null;
}

export interface CertificationSlot extends DocumentSlot {
  certificationId: string;
}

export type LegalDocumentKey = 'cif' | 'seguroRc' | 'manipulador';

export interface DocumentsData {
  cif: DocumentSlot;
  seguroRc: DocumentSlot;
  manipulador: DocumentSlot;
  /** Certificaciones declaradas (catálogo por `certificationId`). */
  certifications: CertificationSlot[];
}

// ─── Paso 5 — Pagos ──────────────────────────────────────────────────────────

export interface StripeData {
  /** Solo lo escribe el webhook de Stripe: nunca se envía al backend. */
  stripeConnected: boolean;
  stripeAccountId?: string;
  acceptTerms: boolean;
}

// ─── Estado global del wizard ────────────────────────────────────────────────

export interface OnboardingFormData {
  step1: LocationData;
  step2: VisualData;
  step3: ShippingData;
  step4: DocumentsData;
  step5: StripeData;
  /** Datos de solo lectura que precargan Stripe y el resumen (vienen del registro / perfil comercial). */
  meta: { businessName: string; website: string };
}

export const INITIAL_FORM_DATA: OnboardingFormData = {
  step1: {
    street: '',
    streetNumber: '',
    streetComplement: '',
    city: '',
    province: '',
    postalCode: '',
    categories: [],
    locationImages: [],
    taxId: '',
    entityType: undefined,
    legalRepresentativeName: '',
    businessPhone: '',
    billingAddressSameAsProduction: true,
    billingAddress: undefined,
  },
  step2: { logo: null, banner: null, teamPhotos: [], introVideo: '' },
  step3: {
    deliveryChoice: undefined,
    minOrderAmount: 0,
    sustainablePackaging: false,
    packagingDescription: '',
    deliveryOptions: [],
    includedZones: [],
    excludedZones: [],
  },
  step4: { cif: {}, seguroRc: {}, manipulador: {}, certifications: [] },
  step5: { stripeConnected: false, acceptTerms: false },
  meta: { businessName: '', website: '' },
};
