/**
 * Rehidratación del formulario del onboarding desde `GET onboarding/data`
 * (ADR-020 §7). Función pura: recibe la respuesta y el estado previo y
 * devuelve el nuevo estado, sin perder lo que el productor haya escrito en
 * campos que el servidor no devuelva.
 */

import type { UploadedFile } from '@/components/shared/upload/file-upload';
import type { ApiDocumentStatus, OnboardingData } from '@/lib/api/onboarding';
import type {
  CertificationSlot,
  DeliveryOption,
  DocumentSlot,
  DocumentStatus,
  EntityType,
  OnboardingFormData,
  ShippingZone,
} from './types';

const FALLBACK_IMAGE_TYPE = 'image/jpeg';

function fileFromKey(key: string, url: string | null | undefined, fallbackName: string, type = FALLBACK_IMAGE_TYPE): UploadedFile {
  return {
    id: key,
    key,
    name: key.split('/').pop() || fallbackName,
    size: 0,
    type,
    url: url ?? undefined,
    preview: url ?? undefined,
  };
}

/** Lista `{ key, url }` → archivos hidratados (inline `visual.*Urls` o, si no, `visualUrls.*`). */
function imageList(
  inline: Array<{ key: string; url: string }> | undefined | null,
  separate: Array<{ key: string; url: string }> | undefined | null,
  fallbackName: string,
): UploadedFile[] {
  const list = inline && inline.length > 0 ? inline : separate && separate.length > 0 ? separate : [];
  return list.map((img) => fileFromKey(img.key, img.url, fallbackName));
}

function docType(key: string): string {
  return key.toLowerCase().endsWith('.pdf') ? 'application/pdf' : FALLBACK_IMAGE_TYPE;
}

/**
 * Un documento "vigente" para el formulario: si hay una sustitución pendiente
 * de revisión (ADR-009) se muestra esa. Un documento RECHAZADO o CADUCADO
 * obliga a subir uno nuevo, así que no se precarga como archivo válido.
 */
function slotFromApi(doc: {
  status: ApiDocumentStatus;
  documentKey?: string | null;
  documentKeyBack?: string | null;
  expiresAt?: string | null;
  rejectedReason?: string | null;
  pendingDocumentKey?: string | null;
  pendingDocumentKeyBack?: string | null;
  pendingExpiresAt?: string | null;
} | undefined): DocumentSlot {
  if (!doc) return {};
  const key = doc.pendingDocumentKey ?? doc.documentKey ?? null;
  // Reverso (solo CIF): sigue la misma sustitución pendiente (ADR-009) que el anverso.
  const keyBack = doc.pendingDocumentKey ? doc.pendingDocumentKeyBack ?? doc.documentKeyBack : doc.documentKeyBack;
  const expires = doc.pendingDocumentKey ? doc.pendingExpiresAt ?? doc.expiresAt : doc.expiresAt;
  const status: DocumentStatus = doc.pendingDocumentKey ? 'PENDING' : doc.status;
  const reusable = Boolean(key) && (status === 'PENDING' || status === 'VERIFIED');
  return {
    status,
    rejectedReason: doc.rejectedReason ?? null,
    file: reusable && key
      ? { ...fileFromKey(key, null, 'documento', docType(key)), status: status.toLowerCase() }
      : undefined,
    fileBack: reusable && keyBack
      ? { ...fileFromKey(keyBack, null, 'documento', docType(keyBack)), status: status.toLowerCase() }
      : undefined,
    expiresAt: reusable && expires ? expires.slice(0, 10) : undefined,
    originalExpiresAt: reusable ? expires ?? null : null,
  };
}

const zoneFromApi = (z: NonNullable<NonNullable<OnboardingData['logistics']>['shippingZones']>[number], i: number): ShippingZone => ({
  id: z.id ?? `zone-${i}`,
  type: z.type.toLowerCase() as ShippingZone['type'],
  value: z.value,
  label: z.label,
});

export function hydrateOnboardingForm(d: OnboardingData, prev: OnboardingFormData): OnboardingFormData {
  const loc = d.location;
  const fiscal = d.fiscal;
  const story = d.story;
  const visual = d.visual;
  const visualUrls = d.visualUrls;
  const logistics = d.logistics;

  const logoKey = visual?.logoDocId ?? visualUrls?.logoKey ?? null;
  const logoUrl = visual?.logoUrl ?? visualUrls?.logoUrl ?? null;
  const bannerKey = visual?.bannerDocId ?? visualUrls?.bannerKey ?? null;
  const bannerUrl = visual?.bannerUrl ?? visualUrls?.bannerUrl ?? null;

  const locationImages = imageList(visual?.locationImageUrls, visualUrls?.locationImages, 'location-image');
  const teamPhotos = imageList(visual?.teamPhotoUrls, visualUrls?.teamPhotos, 'team-photo');

  const options: DeliveryOption[] = (logistics?.deliveryOptions ?? []).map((o, i) => ({
    id: o.id ?? `option-${i}`,
    name: o.name,
    description: o.description ?? '',
    price: Number(o.price),
    estimatedDaysValue: o.estimatedDaysValue ?? null,
    estimatedDaysUnit: o.estimatedDaysUnit ?? 'DAYS',
  }));
  const zones = logistics?.shippingZones ?? [];

  const certifications: CertificationSlot[] = (d.certifications ?? []).map((c) => ({
    certificationId: c.certificationId,
    ...slotFromApi(c),
  }));
  const docByType = (type: 'CIF' | 'SEGURO_RC' | 'MANIPULADOR_ALIMENTOS') => d.documents?.find((x) => x.type === type);

  const billing = fiscal?.billingAddress;

  return {
    step1: {
      ...prev.step1,
      entityType: (fiscal?.entityType as EntityType | undefined) ?? prev.step1.entityType,
      legalRepresentativeName: fiscal?.legalRepresentativeName ?? prev.step1.legalRepresentativeName,
      businessPhone: fiscal?.businessPhone ?? prev.step1.businessPhone,
      taxId: fiscal?.taxId ?? prev.step1.taxId,
      street: loc?.street ?? prev.step1.street,
      streetNumber: loc?.streetNumber ?? prev.step1.streetNumber,
      streetComplement: loc?.streetComplement ?? prev.step1.streetComplement,
      city: loc?.city ?? prev.step1.city,
      province: loc?.province ?? fiscal?.legalProvince ?? prev.step1.province,
      postalCode: loc?.postalCode ?? prev.step1.postalCode,
      categories: fiscal?.categories?.length ? fiscal.categories : prev.step1.categories,
      billingAddressSameAsProduction: billing == null,
      billingAddress: billing
        ? {
            street: billing.street ?? '',
            streetNumber: billing.streetNumber ?? '',
            streetComplement: billing.streetComplement ?? '',
            city: billing.city ?? '',
            province: billing.province ?? '',
            postalCode: billing.postalCode ?? '',
          }
        : prev.step1.billingAddress,
      locationImages: locationImages.length > 0 ? locationImages : prev.step1.locationImages,
    },
    step2: {
      ...prev.step2,
      logo: logoKey && logoUrl ? fileFromKey(logoKey, logoUrl, 'logo') : prev.step2.logo,
      banner: bannerKey && bannerUrl ? fileFromKey(bannerKey, bannerUrl, 'banner') : prev.step2.banner,
      teamPhotos: teamPhotos.length > 0 ? teamPhotos : prev.step2.teamPhotos,
      introVideo: story?.introVideoUrl ?? prev.step2.introVideo,
    },
    step3: logistics
      ? {
          ...prev.step3,
          deliveryChoice: logistics.deliveryChoice ?? prev.step3.deliveryChoice,
          minOrderAmount: Number.isFinite(Number(logistics.minOrderAmount))
            ? Number(logistics.minOrderAmount)
            : prev.step3.minOrderAmount,
          sustainablePackaging: Boolean(logistics.sustainablePackaging),
          packagingDescription: logistics.packagingDescription ?? '',
          deliveryOptions: options,
          includedZones: zones.filter((z) => !z.isExcluded).map(zoneFromApi),
          excludedZones: zones.filter((z) => z.isExcluded).map(zoneFromApi),
        }
      : prev.step3,
    step4: {
      cif: slotFromApi(docByType('CIF')),
      seguroRc: slotFromApi(docByType('SEGURO_RC')),
      manipulador: slotFromApi(docByType('MANIPULADOR_ALIMENTOS')),
      certifications,
    },
    step5: d.payment
      ? {
          stripeConnected: Boolean(d.payment.stripeConnected),
          // Necesario para que el polling del paso 5 sepa que hay una cuenta que vigilar tras recargar.
          stripeAccountId: d.payment.stripeAccountId ?? undefined,
          acceptTerms: !!d.payment.acceptedTermsAt,
        }
      : prev.step5,
    meta: {
      businessName: fiscal?.businessName ?? story?.businessName ?? prev.meta.businessName,
      website: story?.website ?? prev.meta.website,
    },
  };
}
