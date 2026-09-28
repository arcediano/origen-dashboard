/**
 * Lógica pura de la mejora de textos con IA (asistente de IA, F2).
 *
 * La IA solo PROPONE nombre y descripciones: el productor las revisa y decide
 * si aplicarlas al formulario.
 */

/** Borrador que se envía al backend (todo opcional salvo que haya algo que mejorar). */
export interface TextDraft {
  name?: string;
  categoryName?: string;
  subcategoryName?: string;
  shortDescription?: string;
  fullDescription?: string;
  notes?: string;
}

export interface TextProposal {
  name: string;
  shortDescription: string;
  fullDescription: string;
}

/** Forma de la respuesta de `POST /ai-assist/text-improvement`. */
export interface TextImprovementResponse {
  proposal: TextProposal;
  notes: string | null;
  quota: { used: number; total: number };
}

/** Campos del formulario que la propuesta sustituye al aplicarla. */
export const TEXT_FIELD_LABELS: Record<keyof TextProposal, string> = {
  name: 'Nombre',
  shortDescription: 'Descripción corta',
  fullDescription: 'Descripción detallada',
};

/** Quita claves vacías: el backend exige al menos nombre, notas o descripción corta. */
export function buildTextDraft(input: TextDraft): TextDraft {
  const draft: TextDraft = {};
  for (const [key, value] of Object.entries(input) as [keyof TextDraft, string | undefined][]) {
    const text = value?.trim();
    if (text) draft[key] = text;
  }
  return draft;
}

/** ¿Hay algo que mejorar? (mismo criterio que valida el backend). */
export function hasDraftContent(draft: TextDraft): boolean {
  return Boolean(draft.name || draft.notes || draft.shortDescription);
}

/** Campos que la propuesta va a sobrescribir porque ya tienen texto en el formulario. */
export function overwrittenFields(
  current: Partial<Record<keyof TextProposal, string | undefined>>,
): (keyof TextProposal)[] {
  return (Object.keys(TEXT_FIELD_LABELS) as (keyof TextProposal)[]).filter((k) =>
    Boolean(current[k]?.trim()),
  );
}
