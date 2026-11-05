/**
 * Tipos, pasos y validación del asistente de IA "Origen Assist" en su versión
 * de formulario guiado (2026-11-05): el productor responde por pasos y, al
 * final, `POST /ai-assist/assisted-product` lee las etiquetas, redacta los
 * textos comerciales y crea el producto en borrador. Sustituye al chat.
 */
import type { LabelImagePayload } from './resize-label-image';
import type { NetContentUnit } from '@/types/product';

export const ASSISTED_CERTIFICATIONS = ['Orgánico', 'Vegano', 'Sin gluten'] as const;
export type AssistedCertification = (typeof ASSISTED_CERTIFICATIONS)[number];

/** Cuerpo de `POST /ai-assist/assisted-product`. */
export interface CreateAssistedProductInput {
  images: {
    product: LabelImagePayload;
    nutrition?: LabelImagePayload;
    ingredients?: LabelImagePayload;
    conservation?: LabelImagePayload;
  };
  name?: string;
  productDescription: string;
  originStory?: string;
  productionProcess?: string;
  extraInfo?: string;
  certifications?: AssistedCertification[];
  netContent?: { value: number; unit: NetContentUnit };
}

export interface AssistedProductResponse {
  productId: string;
  charged: true;
  /** `usda`: valores nutricionales orientativos de un alimento genérico (no de la etiqueta); hay que revisarlos. */
  nutritionSource: 'label' | 'usda' | null;
}

export const WIZARD_STEP_IDS = [
  'intro',
  'photo',
  'product',
  'origin',
  'production',
  'labels',
  'details',
  'review',
] as const;
export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

/** Pasos con pregunta (sin la introducción): los que cuentan en la barra de progreso. */
export const QUESTION_STEP_IDS: readonly WizardStepId[] = WIZARD_STEP_IDS.filter((id) => id !== 'intro');

export const WIZARD_STEP_LABELS: Record<WizardStepId, string> = {
  intro: 'Cómo funciona',
  photo: 'Foto y nombre',
  product: 'Tu producto',
  origin: 'Origen',
  production: 'Elaboración',
  labels: 'Etiquetas',
  details: 'Detalles de venta',
  review: 'Resumen',
};

/** Longitud mínima de la descripción del producto (el backend exige 10). */
export const MIN_PRODUCT_DESCRIPTION = 10;
export const MAX_ANSWER_LENGTH = 1500;
export const MAX_NAME_LENGTH = 80;

/** Estado de texto del formulario (las fotos viven aparte: no se serializan). */
export interface AssistedTextState {
  name: string;
  productDescription: string;
  originStory: string;
  productionProcess: string;
  extraInfo: string;
  certifications: AssistedCertification[];
  netContent?: number;
  netContentUnit?: NetContentUnit;
}

export const EMPTY_TEXT_STATE: AssistedTextState = {
  name: '',
  productDescription: '',
  originStory: '',
  productionProcess: '',
  extraInfo: '',
  certifications: [],
  netContent: undefined,
  netContentUnit: undefined,
};

export interface StepValidationInput extends AssistedTextState {
  hasProductPhoto: boolean;
}

/** Mensaje de error del paso, o `null` si se puede avanzar. */
export function validateStep(step: WizardStepId, state: StepValidationInput): string | null {
  switch (step) {
    case 'photo':
      return state.hasProductPhoto ? null : 'Sube una foto del producto para continuar.';
    case 'product':
      return state.productDescription.trim().length >= MIN_PRODUCT_DESCRIPTION
        ? null
        : 'Cuéntanos al menos en una frase qué es tu producto.';
    case 'details':
      return state.netContent !== undefined && !(state.netContent > 0)
        ? 'La cantidad del formato de venta debe ser mayor que 0.'
        : null;
    default:
      return null;
  }
}

/** Primer paso con error (para mandar al productor a corregirlo desde el resumen), o `null`. */
export function firstInvalidStep(state: StepValidationInput): WizardStepId | null {
  return WIZARD_STEP_IDS.find((id) => validateStep(id, state) !== null) ?? null;
}

/** Cuerpo de la petición a partir del estado de texto y las imágenes ya redimensionadas. */
export function buildAssistedProductInput(
  state: AssistedTextState,
  images: CreateAssistedProductInput['images'],
): CreateAssistedProductInput {
  const optional = (value: string) => value.trim() || undefined;
  return {
    images,
    name: optional(state.name),
    productDescription: state.productDescription.trim(),
    originStory: optional(state.originStory),
    productionProcess: optional(state.productionProcess),
    extraInfo: optional(state.extraInfo),
    certifications: state.certifications.length ? state.certifications : undefined,
    netContent:
      state.netContent && state.netContent > 0
        ? { value: state.netContent, unit: state.netContentUnit ?? 'g' }
        : undefined,
  };
}
