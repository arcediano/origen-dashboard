/**
 * Lógica pura de la lectura de etiqueta con IA (asistente de IA, F1).
 *
 * La IA solo PROPONE: el productor revisa y confirma. Aquí se decide qué campos
 * del formulario se prerrellenan (solo los que la IA leyó; lo demás no se toca).
 */

import type { NutritionalInfo } from '@/types/product';

/** Forma de `proposal` en la respuesta de `POST /ai-assist/label-reading`. */
export interface LabelProposal {
  ingredients: string[] | null;
  allergens: string[] | null;
  mayContain: string[] | null;
  servingSizeValue: number | null;
  servingSizeUnit: 'g' | 'ml' | null;
  calories: number | null;
  protein: number | null;
  totalFat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  dietaryFiber: number | null;
  sodium: number | null;
}

export interface LabelReadingResponse {
  legible: boolean;
  proposal: LabelProposal;
  /** Campos que la IA no pudo leer (a rellenar a mano). */
  unreadableFields: string[];
  notes: string | null;
  quota: { used: number; total: number };
}

export interface AiAssistQuota {
  enabled: boolean;
  used: number;
  total: number;
}

/** Etiquetas en español de los campos, para el resumen "no se han podido leer…". */
export const LABEL_FIELD_NAMES: Record<string, string> = {
  ingredients: 'ingredientes',
  allergens: 'alérgenos',
  mayContain: 'trazas',
  servingSizeValue: 'tamaño de ración',
  calories: 'calorías',
  protein: 'proteínas',
  totalFat: 'grasas',
  saturatedFat: 'grasas saturadas',
  carbohydrates: 'hidratos',
  sugars: 'azúcares',
  dietaryFiber: 'fibra',
  sodium: 'sodio',
};

export interface FieldPatch {
  field: keyof NutritionalInfo;
  value: NutritionalInfo[keyof NutritionalInfo];
}

/**
 * Convierte la propuesta en cambios de campo del formulario. Solo incluye lo que
 * la IA leyó (no nulo). `servingSize` (texto, p. ej. "30g") se mantiene
 * coherente con valor + unidad.
 */
export function proposalToPatches(
  proposal: LabelProposal,
  current: Pick<NutritionalInfo, 'servingSizeValue' | 'servingSizeUnit'>,
): FieldPatch[] {
  const patches: FieldPatch[] = [];
  const push = <K extends keyof NutritionalInfo>(field: K, value: NutritionalInfo[K]) =>
    patches.push({ field, value });

  if (proposal.ingredients !== null) push('ingredients', proposal.ingredients);
  // `[]` es un dato válido: la etiqueta no declara alérgenos/trazas.
  if (proposal.allergens !== null) push('allergens', proposal.allergens);
  if (proposal.mayContain !== null) push('mayContain', proposal.mayContain);

  if (proposal.servingSizeValue !== null && proposal.servingSizeUnit !== null) {
    push('servingSizeValue', proposal.servingSizeValue);
    push('servingSizeUnit', proposal.servingSizeUnit);
    push('servingSize', `${proposal.servingSizeValue}${proposal.servingSizeUnit}`);
  } else if (proposal.servingSizeUnit !== null) {
    push('servingSizeUnit', proposal.servingSizeUnit);
    push('servingSize', `${current.servingSizeValue}${proposal.servingSizeUnit}`);
  }

  const numeric = [
    'calories',
    'protein',
    'totalFat',
    'saturatedFat',
    'carbohydrates',
    'sugars',
    'dietaryFiber',
    'sodium',
  ] as const;
  for (const key of numeric) {
    const value = proposal[key];
    if (value !== null) push(key, value);
  }

  return patches;
}

/** Nombres legibles de los campos que la IA no pudo leer. */
export function unreadableFieldNames(fields: string[]): string[] {
  return fields.map((f) => LABEL_FIELD_NAMES[f] ?? f);
}
