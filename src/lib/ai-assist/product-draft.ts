/**
 * Lógica pura del onboarding de producto asistido por IA.
 *
 * La IA solo PROPONE un borrador (foto + texto + etiqueta → ficha): el productor
 * lo revisa y confirma siempre. Aquí se traduce la respuesta del backend a
 * cambios sobre el formulario de producto; lo que la IA no rellenó no se toca.
 */

import type { DynamicAttribute, NetContentUnit, NutritionalInfo } from '@/types/product';
import { proposalToPatches, unreadableFieldNames, type LabelProposal } from './label-proposal';

/**
 * Campos sobre los que el asistente puede proponer una pregunta de
 * seguimiento (ver `product-draft.schema.ts` en el backend — misma lista
 * cerrada). Nunca ingredientes/alérgenos/nutrición.
 */
export type FollowUpField =
  | 'productionInfo.origin'
  | 'productionInfo.productionMethod'
  | 'nutritionalInfo.isGlutenFree'
  | 'nutritionalInfo.isVegan'
  | 'nutritionalInfo.isVegetarian'
  // Preguntas de elaboración (texto libre) para redactar "Historia y producción":
  | 'productionInfo.artisanProcess'
  | 'productionInfo.maturationTime'
  | 'productionInfo.story';

export interface FollowUpQuestion {
  field: FollowUpField;
  question: string;
  type: 'text' | 'single_choice';
  options: string[] | null;
}

/** Forma de la respuesta de `POST /ai-assist/product-draft`. */
export interface ProductDraftResponse {
  proposal: {
    name: string;
    fullDescription: string;
    categoryId: string;
    subcategoryId: string | null;
    nutritionalInfo: LabelProposal & {
      /** Conservación leída de la etiqueta o dicha por el productor. */
      storageInstructions?: string | null;
      isGlutenFree: boolean | null;
      isVegan: boolean | null;
      isVegetarian: boolean | null;
    };
    productionInfo: {
      origin: string | null;
      productionMethod: string | null;
      /** YYYY-MM-DD, solo si se leyó en las fotos o lo dijo el productor. */
      harvestDate?: string | null;
      productionDate?: string | null;
      expiryDate?: string | null;
    };
    /** Contenido neto de una unidad de venta (a qué cantidad corresponde el precio). */
    netContent?: { value: number; unit: NetContentUnit } | null;
    /** Atributos destacados según el tipo de producto (tipo de leche, curación…). */
    attributes?: Array<{ name: string; value: string }>;
  };
  /** `null` si no se enviaron fotos de etiqueta. */
  labelLegible: boolean | null;
  unreadableFields: string[];
  /** Lo que la IA nunca propone y el productor debe completar. */
  producerMustComplete: string[];
  notes: string | null;
  /** Preguntas dinámicas para completar lo que la IA no pudo determinar. */
  followUpQuestions: FollowUpQuestion[];
  /**
   * De dónde vienen ingredientes/alérgenos/nutrición cuando no son de la
   * etiqueta leída por IA: código de barras real (Open Food Facts), búsqueda
   * web del producto exacto (`web`, incluye ingredientes/alérgenos) o
   * estimación de un producto/tipo parecido (`estimated`, solo nutrición).
   * `null` si no aplica ninguna (viene de la etiqueta o no hay datos).
   */
  nutritionSource: 'barcode' | 'estimated' | 'web' | null;
  allergenSource: 'barcode' | 'web' | null;
  /** Nota de la fuente externa, para mostrarla al productor. */
  externalSourceNote: string | null;
  /** Páginas consultadas por la búsqueda web (puede faltar en respuestas antiguas). */
  externalSourceUrls?: string[];
  quota: { used: number; total: number };
}

export interface DraftCategory {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

/** Un cambio a aplicar sobre `formData` (campo raíz o campo de una sección anidada). */
export type DraftPatch =
  | { kind: 'field'; field: string; value: unknown }
  | { kind: 'nested'; section: 'nutritionalInfo' | 'productionInfo'; field: string; value: unknown };

/** Marcas dietéticas que la IA solo propone cuando la etiqueta o el texto las declaran. */
const DIETARY_FLAGS = ['isGlutenFree', 'isVegan', 'isVegetarian'] as const;

export function draftToPatches(
  response: ProductDraftResponse,
  categories: DraftCategory[],
  currentServing: Pick<NutritionalInfo, 'servingSizeValue' | 'servingSizeUnit'>,
): DraftPatch[] {
  const { proposal } = response;
  const patches: DraftPatch[] = [];
  const field = (name: string, value: unknown) => patches.push({ kind: 'field', field: name, value });

  field('name', proposal.name);
  field('fullDescription', proposal.fullDescription);

  const category = categories.find((c) => c.id === proposal.categoryId);
  if (category) {
    const sub = category.children.find((c) => c.id === proposal.subcategoryId);
    field('categoryId', category.id);
    field('categoryName', category.name);
    field('subcategoryId', sub?.id ?? '');
    field('subcategoryName', sub?.name ?? '');
  }

  for (const { field: f, value } of proposalToPatches(proposal.nutritionalInfo, currentServing)) {
    patches.push({ kind: 'nested', section: 'nutritionalInfo', field: f, value });
  }
  for (const flag of DIETARY_FLAGS) {
    if (proposal.nutritionalInfo[flag] === true) {
      patches.push({ kind: 'nested', section: 'nutritionalInfo', field: flag, value: true });
    }
  }

  const { origin, productionMethod } = proposal.productionInfo;
  for (const key of ['harvestDate', 'productionDate', 'expiryDate'] as const) {
    const iso = proposal.productionInfo[key];
    const date = iso ? new Date(iso) : null;
    if (date && !Number.isNaN(date.getTime())) {
      patches.push({ kind: 'nested', section: 'productionInfo', field: key, value: date });
    }
  }
  if (proposal.nutritionalInfo.storageInstructions) {
    patches.push({
      kind: 'nested',
      section: 'nutritionalInfo',
      field: 'storageInstructions',
      value: proposal.nutritionalInfo.storageInstructions,
    });
  }
  if (proposal.netContent) {
    field('netContent', proposal.netContent.value);
    field('netContentUnit', proposal.netContent.unit);
  }
  if (proposal.attributes?.length) {
    field(
      'attributes',
      proposal.attributes.map((a, i): DynamicAttribute => ({
        id: `ai-attr-${i}-${Date.now()}`,
        name: a.name,
        type: 'text',
        value: a.value,
        visible: true,
      })),
    );
  }
  if (origin) patches.push({ kind: 'nested', section: 'productionInfo', field: 'origin', value: origin });
  if (productionMethod) {
    patches.push({ kind: 'nested', section: 'productionInfo', field: 'productionMethod', value: productionMethod });
  }

  return patches;
}

/** Resumen legible de qué ha rellenado la IA y qué debe completar el productor. */
export function summarizeDraft(response: ProductDraftResponse): {
  filled: string[];
  toReview: string[];
  toComplete: string[];
} {
  const { proposal } = response;
  const filled = ['Nombre', 'Descripción', 'Categoría'];
  if (proposal.nutritionalInfo.ingredients?.length) filled.push('Ingredientes');
  if (proposal.nutritionalInfo.allergens !== null) filled.push('Alérgenos');
  if (proposal.nutritionalInfo.calories !== null) filled.push('Información nutricional');
  if (proposal.productionInfo.origin) filled.push('Origen');
  if (proposal.productionInfo.productionMethod) filled.push('Elaboración');
  if (proposal.netContent) filled.push('Formato de venta');
  if (proposal.productionInfo.expiryDate || proposal.productionInfo.harvestDate || proposal.productionInfo.productionDate) {
    filled.push('Fechas');
  }
  if (proposal.nutritionalInfo.storageInstructions) filled.push('Conservación');
  if (proposal.attributes?.length) filled.push('Atributos');

  const toReview: string[] = [];
  if (response.labelLegible === true) toReview.push('Alérgenos y valores nutricionales leídos de la etiqueta');
  if (response.labelLegible === false) toReview.push('La etiqueta no se pudo leer: completa la información nutricional');
  const unreadable = unreadableFieldNames(response.unreadableFields);
  if (response.labelLegible === true && unreadable.length > 0) {
    toReview.push(`No se pudo leer: ${unreadable.join(', ')}`);
  }
  if (response.allergenSource === 'barcode') {
    toReview.push(
      `Ingredientes y alérgenos de Open Food Facts por el código de barras: confirma que coinciden con tu producto${response.externalSourceNote ? ` (${response.externalSourceNote})` : ''}.`,
    );
  }
  if (response.allergenSource === 'web' || response.nutritionSource === 'web') {
    const urls = response.externalSourceUrls?.length ? ` Fuentes: ${response.externalSourceUrls.join(', ')}` : '';
    toReview.push(
      `Información encontrada en internet para tu producto${response.externalSourceNote ? ` (${response.externalSourceNote})` : ''}.${urls} Revisa ingredientes, alérgenos y valores nutricionales y confirma que coinciden con tu producto antes de guardar.`,
    );
  }
  if (response.nutritionSource === 'estimated') {
    toReview.push(
      `Información nutricional ESTIMADA (no es de tu producto exacto)${response.externalSourceNote ? `: ${response.externalSourceNote}` : ''}. Corrígela si tienes el dato real.`,
    );
  } else if (response.nutritionSource === 'barcode' && response.allergenSource !== 'barcode') {
    toReview.push(
      `Información nutricional de Open Food Facts por el código de barras: confirma que coincide con tu producto${response.externalSourceNote ? ` (${response.externalSourceNote})` : ''}.`,
    );
  }

  return { filled, toReview, toComplete: response.producerMustComplete };
}

/** Etiquetas legibles de `FollowUpField`, para construir las notas que se le pasan a la IA al reescribir la descripción. */
export const FOLLOW_UP_FIELD_LABELS: Record<FollowUpField, string> = {
  'productionInfo.origin': 'Origen',
  'productionInfo.productionMethod': 'Método de producción',
  'nutritionalInfo.isGlutenFree': '¿Sin gluten?',
  'nutritionalInfo.isVegan': '¿Vegano?',
  'nutritionalInfo.isVegetarian': '¿Vegetariano?',
  'productionInfo.artisanProcess': 'Técnicas de elaboración',
  'productionInfo.maturationTime': 'Tiempo de maduración',
  'productionInfo.story': 'Historia del producto',
};

/**
 * Notas para `POST /ai-assist/text-improvement` tras responder las preguntas
 * de seguimiento: así la IA incorpora las respuestas en una descripción
 * coherente, en vez de quedar solo en campos estructurados sueltos. `null`
 * si no se respondió nada (no hay nada que reescribir).
 */
export function buildFollowUpNotes(answers: Partial<Record<FollowUpField, string>>): string | null {
  const lines = (Object.entries(answers) as [FollowUpField, string][])
    .filter(([, value]) => value.trim().length > 0)
    .map(([field, value]) => `${FOLLOW_UP_FIELD_LABELS[field]}: ${value}`);
  if (lines.length === 0) return null;
  return `Datos que el productor acaba de confirmar — incorpóralos de forma natural en la descripción:\n${lines.join('\n')}`;
}
