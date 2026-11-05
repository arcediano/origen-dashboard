/**
 * Copia de los textos fijos de cada paso de "Origen Assist" -- debe reflejar
 * exactamente `ai-assist-step-flow.schema.ts` (`STEP_PROMPTS`) de
 * `origen-master-microservices`. Se usa solo para reconstruir la pantalla al
 * reanudar una conversación tras recargar (ver `AiAssistChat.tsx`); el texto
 * real de cada turno siempre lo manda el backend.
 *
 * Ajuste (petición del humano, 2026-10-26): la foto de "marca" (antes
 * LABEL_PHOTO) se fusiona con la foto de producto -- una sola foto sirve
 * para ambas cosas. El paso ORIGIN se retira: el origen real (comunidad
 * autónoma + municipio) se rellena solo con los datos del perfil del
 * productor, nunca se pregunta.
 *
 * Rediseño v3 (petición del humano, 2026-11-03): añade CONSERVATION_PHOTO
 * (foto de instrucciones de conservación, antes nunca pedida) y
 * ADDITIONAL_INFO (texto libre del productor para cualquier información
 * extra), ver el mismo archivo en el backend para el detalle.
 */
export const STEP_ORDER = [
  'PRODUCT_PHOTO',
  'NUTRITION_PHOTO',
  'INGREDIENTS_PHOTO',
  'CONSERVATION_PHOTO',
  'CERTIFICATIONS',
  'ADDITIONAL_INFO',
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
    text: '📸 Sube una foto del producto donde se vea bien la marca y el nombre. ¿La tienes?',
    imageDropzoneLabel: 'Arrastra la foto del producto aquí',
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
  CONSERVATION_PHOTO: {
    text: '📸 ¿Tienes alguna instrucción de conservación en la etiqueta (frío, caducidad...)? Súbela.',
    imageDropzoneLabel: 'Arrastra la foto de conservación aquí',
    chips: ['No tengo foto'],
  },
  CERTIFICATIONS: {
    text: '¿Tiene algún certificado?',
    chips: ['Orgánico', 'Vegano', 'Sin gluten', 'Ninguno'],
  },
  ADDITIONAL_INFO: {
    text: '¿Algo más que quieras contar sobre tu producto? (elaboración artesanal, premios, historia...) Puedes dejarlo en blanco.',
    chips: ['Nada más'],
  },
  FORMAT: {
    text: '¿Cuál es el formato de venta? (unidad, pack, peso)',
  },
};
