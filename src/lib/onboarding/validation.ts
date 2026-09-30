/**
 * Validación por paso del onboarding. Cada incidencia lleva el `fieldId` del
 * control afectado para poder (a) pintar el error junto al campo y (b) llevar
 * el foco al primero pendiente desde el resumen del paso.
 */

import { validateSpanishTaxId } from '@/lib/utils/tax-id';
import { isDeliveryOptionComplete } from './shipping';
import { isValidVideoUrl } from './video';
import type {
  DocumentSlot,
  OnboardingFormData,
  ShippingCoverage,
} from './types';

export interface StepIssue {
  message: string;
  /** `id` del control asociado (los controles de cada paso usan el prefijo `onb-`). */
  fieldId?: string;
}

export interface ValidationContext {
  /** Cobertura de Origen (paso 3). `null` mientras no se haya podido comprobar. */
  coverage: ShippingCoverage | null;
  /** Hoy en formato `YYYY-MM-DD` (inyectable para tests). */
  today?: string;
}

const PHONE_RE = /^[6789]\d{8}$/;
const POSTAL_RE = /^\d{5}$/;

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

function validateDocumentSlot(
  slot: DocumentSlot,
  label: string,
  idBase: string,
  today: string,
  out: StepIssue[],
) {
  if (!slot.file) {
    out.push({ message: `Sube el documento: ${label}.`, fieldId: idBase });
    return;
  }
  if (slot.status === 'VERIFIED') return; // verificado: no se toca
  if (!slot.expiresAt) {
    out.push({ message: `Indica la fecha de caducidad: ${label}.`, fieldId: `${idBase}-expires` });
  } else if (slot.expiresAt <= today) {
    out.push({ message: `La fecha de caducidad debe ser posterior a hoy: ${label}.`, fieldId: `${idBase}-expires` });
  }
}

export function validateStep(stepIndex: number, form: OnboardingFormData, ctx: ValidationContext): StepIssue[] {
  const issues: StepIssue[] = [];
  const today = ctx.today ?? todayISO();

  switch (stepIndex) {
    case 0: {
      const s = form.step1;
      if (!s.entityType) issues.push({ message: 'Selecciona la forma jurídica.', fieldId: 'onb-entity-type' });
      if (!validateSpanishTaxId(s.taxId ?? '').valid) issues.push({ message: 'Introduce un NIF/CIF/NIE válido.', fieldId: 'onb-tax-id' });
      if (!PHONE_RE.test(s.businessPhone ?? '')) issues.push({ message: 'Introduce un teléfono válido (9 dígitos, empieza por 6, 7, 8 o 9).', fieldId: 'onb-phone' });
      if (!s.street.trim()) issues.push({ message: 'Completa el nombre de la vía.', fieldId: 'onb-street' });
      if (!s.streetNumber.trim()) issues.push({ message: 'Completa el número.', fieldId: 'onb-street-number' });
      if (!POSTAL_RE.test(s.postalCode)) issues.push({ message: 'El código postal debe tener 5 dígitos.', fieldId: 'onb-postal-code' });
      else if (!s.province) issues.push({ message: 'No reconocemos ese código postal. Revísalo.', fieldId: 'onb-postal-code' });
      if (!s.city.trim()) issues.push({ message: 'Completa la ciudad o municipio.', fieldId: 'onb-city' });
      if (s.categories.length < 1) issues.push({ message: 'Selecciona al menos una categoría de productos.', fieldId: 'onb-categories' });
      if (!s.billingAddressSameAsProduction) {
        const b = s.billingAddress;
        if (!b?.street.trim()) issues.push({ message: 'Completa la vía de facturación.', fieldId: 'onb-billing-street' });
        if (!b?.streetNumber.trim()) issues.push({ message: 'Completa el número de facturación.', fieldId: 'onb-billing-street-number' });
        if (!POSTAL_RE.test(b?.postalCode ?? '')) issues.push({ message: 'El código postal de facturación debe tener 5 dígitos.', fieldId: 'onb-billing-postal-code' });
        if (!b?.city.trim()) issues.push({ message: 'Completa la ciudad de facturación.', fieldId: 'onb-billing-city' });
      }
      break;
    }
    case 1: {
      if (!form.step2.logo) issues.push({ message: 'Sube el logo de tu negocio.', fieldId: 'onb-logo' });
      const video = form.step2.introVideo?.trim();
      if (video && !isValidVideoUrl(video)) issues.push({ message: 'El vídeo debe ser un enlace válido de YouTube o Vimeo.', fieldId: 'onb-video' });
      break;
    }
    case 2: {
      const s = form.step3;
      const cov = ctx.coverage;
      if (!cov) {
        issues.push({ message: 'Estamos comprobando la cobertura de Origen en tu código postal.', fieldId: 'onb-delivery-choice' });
        break;
      }
      if (cov.status === 'MISSING_POSTAL_CODE') {
        issues.push({ message: 'Completa primero la ubicación (paso 1) para poder configurar los envíos.', fieldId: 'onb-delivery-choice' });
        break;
      }
      if (!s.deliveryChoice) {
        issues.push({ message: 'Elige cómo vas a gestionar el envío.', fieldId: 'onb-delivery-choice' });
      } else if (s.deliveryChoice === 'delegated' && !cov.canDelegate) {
        issues.push({ message: 'Origen no cubre tu código postal: gestiona tú el envío.', fieldId: 'onb-delivery-choice' });
      }
      if (s.deliveryChoice === 'own') {
        if (s.deliveryOptions.length < 1) {
          issues.push({ message: 'Añade al menos un método de envío.', fieldId: 'onb-delivery-options' });
        } else if (!s.deliveryOptions.every(isDeliveryOptionComplete)) {
          issues.push({ message: 'Completa nombre, descripción, precio (mayor que 0 €) y plazo de todos tus métodos de envío.', fieldId: 'onb-delivery-options' });
        }
      }
      if (s.includedZones.length < 1) issues.push({ message: 'Añade al menos una zona de entrega.', fieldId: 'onb-zone-value' });
      if (!s.minOrderAmount || s.minOrderAmount <= 0) issues.push({ message: 'El pedido mínimo debe ser mayor que 0 €.', fieldId: 'onb-min-order' });
      if (s.sustainablePackaging && !s.packagingDescription.trim()) issues.push({ message: 'Describe tu packaging sostenible.', fieldId: 'onb-packaging-description' });
      break;
    }
    case 3: {
      const d = form.step4;
      validateDocumentSlot(d.cif, 'CIF / NIF', 'onb-doc-cif', today, issues);
      validateDocumentSlot(d.seguroRc, 'seguro de responsabilidad civil', 'onb-doc-seguroRc', today, issues);
      validateDocumentSlot(d.manipulador, 'manipulador de alimentos', 'onb-doc-manipulador', today, issues);
      for (const cert of d.certifications) {
        if (!cert.file || cert.status === 'VERIFIED') continue; // documento opcional por certificación
        const id = `onb-cert-${cert.certificationId}`;
        if (!cert.expiresAt) issues.push({ message: 'Indica la fecha de caducidad de cada certificación con documento.', fieldId: `${id}-expires` });
        else if (cert.expiresAt <= today) issues.push({ message: 'La caducidad de las certificaciones debe ser posterior a hoy.', fieldId: `${id}-expires` });
      }
      break;
    }
    case 4: {
      if (!form.step5.acceptTerms) {
        issues.push({ message: 'Acepta los términos para finalizar (conectar Stripe puedes dejarlo para después).', fieldId: 'accept-terms' });
      }
      break;
    }
  }
  return issues;
}

/** `fieldId → mensaje` (primer mensaje por campo), para pintar errores junto a cada control. */
export function issuesToFieldErrors(issues: StepIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const i of issues) if (i.fieldId && !map[i.fieldId]) map[i.fieldId] = i.message;
  return map;
}
