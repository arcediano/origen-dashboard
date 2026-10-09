/**
 * @hook useStepTips
 * @description Tips y datos clave por paso del formulario de producto.
 * Compartido entre create/page.tsx y [id]/edit/page.tsx.
 *
 * Indexados por `FormStepId` (no por posición numérica, petición del humano
 * 2026-10-08): FORM_STEPS se reordenó para mover "Variantes" justo después
 * de "Precios" (ver types/product.ts), y una indexación por número habría
 * desincronizado estos tips silenciosamente con el paso que el productor
 * tiene delante. Indexar por id hace que un futuro reordenamiento no
 * requiera tocar este fichero.
 */

import type { FormStepId } from '@/types/product';

export const KEY_FACTS_BY_STEP: Record<FormStepId, string> = {
  basic: 'Los productos con descripción completa tienen un 30% más de conversión',
  images: 'Los productos con 3+ imágenes tienen un 40% más de ventas',
  // Precios + variantes + inventario unificados en un solo paso (petición
  // del humano, 2026-10-09) -- dato clave del propio paso, no de un
  // sub-bloque concreto.
  pricing: 'El 15% de los pedidos cancelados son por falta de stock',
  nutritional: 'Los productos con información nutricional completa tienen un 40% más de confianza',
  production: 'Los productos con historia tienen un 50% más de reseñas positivas',
  certifications: 'Los productos con certificaciones tienen un 35% más de confianza',
};

/**
 * Último consejo de cada paso (petición del humano, 2026-10-08): en el alta
 * manual (sin asistente de IA) se le recuerda al productor que puede usar el
 * asistente completo para rehacer el producto, con un acabado más
 * profesional — visible en cualquier paso, no solo al principio, porque el
 * productor puede decidir cambiarse a mitad de rellenar el formulario a mano.
 */
const AI_ASSIST_TIP = {
  description:
    '¿Vas con prisa? El asistente de IA puede rehacer este producto a partir de una foto y dejarlo con un acabado más profesional en segundos.',
};

export function useStepTips(
  step: FormStepId,
  formData: any,
): Array<{ description: string; category?: string }> {
  const tips = getStepTips(step, formData);
  return tips.length > 0 ? [...tips, AI_ASSIST_TIP] : tips;
}

function getStepTips(
  step: FormStepId,
  formData: any,
): Array<{ description: string; category?: string }> {
  switch (step) {
    case 'basic':
      return [
        { description: 'Usa palabras clave que tus clientes buscarían' },
        { description: 'Incluye variedad, tiempo de curación o características únicas' },
        {
          description:
            formData?.fullDescription && formData.fullDescription.length < 300
              ? 'Una descripción de al menos 300 caracteres convierte mejor. La tuya es todavía corta.'
              : 'Una descripción clara y completa mejora la conversión y el posicionamiento',
        },
        { description: 'Las categorías ayudan a los clientes a encontrarte' },
      ];
    case 'images':
      return [
        { description: 'Usa fondo blanco o neutro para la imagen principal' },
        { description: 'Muestra diferentes ángulos del producto' },
        { description: 'Incluye una foto del producto empaquetado' },
        { description: 'Las imágenes de alta calidad generan más confianza' },
      ];
    case 'pricing':
      return formData?.hasVariants
        ? [
            { description: 'Define primero las opciones (Tamaño, Formato…) y luego genera las combinaciones' },
            { description: 'Cada variante tiene su propio precio, stock y peso de envío — el SKU se genera solo' },
            { description: 'Las variantes se guardan una vez creado el producto' },
            { description: 'Mantén el stock de cada variante actualizado para evitar cancelaciones' },
          ]
        : [
            { description: 'El precio base debe incluir tu margen de beneficio' },
            { description: 'El precio de referencia (tachado) crea sensación de ahorro' },
            { description: 'Mantén el stock actualizado para evitar cancelaciones' },
            { description: 'Pesa tu producto con embalaje para calcular bien el envío' },
          ];
    case 'nutritional':
      return [
        { description: 'Indica siempre los alérgenos principales' },
        { description: 'Los valores por 100g/ml son el estándar' },
        { description: 'Incluye ingredientes en orden descendente' },
        { description: 'La información completa genera confianza' },
      ];
    case 'production':
      return [
        { description: 'Comparte tu historia: conecta emocionalmente' },
        { description: 'Las fotos del proceso generan transparencia' },
        { description: 'Los vídeos cortos (30s) funcionan muy bien' },
        { description: 'Destaca métodos tradicionales o certificaciones' },
      ];
    case 'certifications':
      return [
        { description: 'Las certificaciones ecológicas generan confianza' },
        { description: 'Añade atributos específicos de tu producto' },
        { description: 'Los sellos de calidad diferencian tu producto' },
        { description: 'Los atributos dinámicos permiten personalización total' },
      ];
    default:
      return [];
  }
}
