/**
 * Lógica pura del onboarding de producto asistido por IA.
 *
 * La IA solo PROPONE un borrador (foto + texto + etiqueta → ficha): el productor
 * lo revisa y confirma siempre. Aquí se traduce la respuesta del backend a
 * cambios sobre el formulario de producto; lo que la IA no rellenó no se toca.
 */

import type { NutritionalInfo } from '@/types/product';
import { proposalToPatches, unreadableFieldNames, type LabelProposal } from './label-proposal';

/** Forma de la respuesta de `POST /ai-assist/product-draft`. */
export interface ProductDraftResponse {
  proposal: {
    name: string;
    fullDescription: string;
    categoryId: string;
    subcategoryId: string | null;
    nutritionalInfo: LabelProposal & {
      isGlutenFree: boolean | null;
      isVegan: boolean | null;
      isVegetarian: boolean | null;
    };
    productionInfo: { origin: string | null; productionMethod: string | null };
  };
  /** `null` si no se enviaron fotos de etiqueta. */
  labelLegible: boolean | null;
  unreadableFields: string[];
  /** Lo que la IA nunca propone y el productor debe completar. */
  producerMustComplete: string[];
  notes: string | null;
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

  const toReview: string[] = [];
  if (response.labelLegible === true) toReview.push('Alérgenos y valores nutricionales leídos de la etiqueta');
  if (response.labelLegible === false) toReview.push('La etiqueta no se pudo leer: completa la información nutricional');
  const unreadable = unreadableFieldNames(response.unreadableFields);
  if (response.labelLegible === true && unreadable.length > 0) {
    toReview.push(`No se pudo leer: ${unreadable.join(', ')}`);
  }

  return { filled, toReview, toComplete: response.producerMustComplete };
}
