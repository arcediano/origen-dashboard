/**
 * Copia de los textos fijos de cada paso de "Origen Assist" (rediseño v2,
 * 2026-10-26) -- debe reflejar exactamente
 * `ai-assist-step-flow.schema.ts` (`STEP_PROMPTS`) de
 * `origen-master-microservices`. Se usa solo para reconstruir la pantalla al
 * reanudar una conversación tras recargar (ver `AiAssistChat.tsx`); el texto
 * real de cada turno siempre lo manda el backend.
 */
export const STEP_ORDER = [
  'PRODUCT_PHOTO',
  'LABEL_PHOTO',
  'NUTRITION_PHOTO',
  'INGREDIENTS_PHOTO',
  'ORIGIN',
  'CERTIFICATIONS',
  'FORMAT',
] as const;
export type AiAssistUserStep = (typeof STEP_ORDER)[number];
export const TOTAL_STEPS = STEP_ORDER.length;

export function stepIndexOf(step: string): number {
  const i = STEP_ORDER.indexOf(step as AiAssistUserStep);
  return i >= 0 ? i + 1 : TOTAL_STEPS;
}

export const STEP_PROMPTS: Record<
  AiAssistUserStep,
  { text: string; imageDropzoneLabel?: string; chips?: string[] }
> = {
  PRODUCT_PHOTO: {
    text: '📸 Sube una foto del producto. ¿La tienes?',
    imageDropzoneLabel: 'Arrastra la foto del producto aquí',
  },
  LABEL_PHOTO: {
    text: '📸 Ahora la etiqueta frontal (marca y nombre). ¿La subes?',
    imageDropzoneLabel: 'Arrastra la foto de la etiqueta frontal aquí',
    chips: ['No tengo foto'],
  },
  NUTRITION_PHOTO: {
    text: '📸 ¿Tienes la tabla nutricional? Súbela.',
    imageDropzoneLabel: 'Arrastra la foto de la tabla nutricional aquí',
    chips: ['No tengo foto'],
  },
  INGREDIENTS_PHOTO: {
    text: '📸 ¿Y los ingredientes y alérgenos? Súbelos.',
    imageDropzoneLabel: 'Arrastra la foto de ingredientes/sellos aquí',
    chips: ['No tengo foto'],
  },
  ORIGIN: {
    text: '¿Este producto es local o importado?',
    chips: ['Local', 'Importado', 'No sé'],
  },
  CERTIFICATIONS: {
    text: '¿Tiene algún certificado?',
    chips: ['Orgánico', 'Vegano', 'Sin gluten', 'Ninguno'],
  },
  FORMAT: {
    text: '¿Cuál es el formato de venta? (unidad, pack, peso)',
  },
};
