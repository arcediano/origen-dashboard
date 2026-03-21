/**
 * @hook useStepTips
 * @description Tips y datos clave por paso del formulario de producto.
 * Compartido entre create/page.tsx y [id]/edit/page.tsx.
 */

export const KEY_FACTS_BY_STEP: Record<number, string> = {
  1: 'Los productos con descripción completa tienen un 30% más de conversión',
  2: 'Los productos con 3+ imágenes tienen un 40% más de ventas',
  3: 'Las ofertas 3x2 aumentan el ticket medio un 25%',
  4: 'Los productos con información nutricional completa tienen un 40% más de confianza',
  5: 'Los productos con historia tienen un 50% más de reseñas positivas',
  6: 'El 15% de los pedidos cancelados son por falta de stock',
  7: 'Los productos con certificaciones tienen un 35% más de confianza',
};

export function useStepTips(
  step: number,
  formData: any,
): Array<{ description: string; category?: string }> {
  switch (step) {
    case 1:
      return [
        { description: 'Usa palabras clave que tus clientes buscarían' },
        { description: 'Incluye variedad, tiempo de curación o características únicas' },
        {
          description:
            formData?.shortDescription && formData.shortDescription.length < 100
              ? 'La descripción corta es lo primero que ven en búsquedas. La tuya es demasiado corta.'
              : 'La descripción corta es lo primero que ven en búsquedas',
        },
        { description: 'Las categorías ayudan a los clientes a encontrarte' },
      ];
    case 2:
      return [
        { description: 'Usa fondo blanco o neutro para la imagen principal' },
        { description: 'Muestra diferentes ángulos del producto' },
        { description: 'Incluye una foto del producto empaquetado' },
        { description: 'Las imágenes de alta calidad generan más confianza' },
      ];
    case 3:
      return [
        { description: 'El precio base debe incluir tu margen de beneficio' },
        { description: 'Las ofertas por cantidad animan a comprar más' },
        { description: 'El precio de referencia (tachado) crea sensación de ahorro' },
        { description: 'Revisa los precios de productos similares' },
      ];
    case 4:
      return [
        { description: 'Indica siempre los alérgenos principales' },
        { description: 'Los valores por 100g/ml son el estándar' },
        { description: 'Incluye ingredientes en orden descendente' },
        { description: 'La información completa genera confianza' },
      ];
    case 5:
      return [
        { description: 'Comparte tu historia: conecta emocionalmente' },
        { description: 'Las fotos del proceso generan transparencia' },
        { description: 'Los vídeos cortos (30s) funcionan muy bien' },
        { description: 'Destaca métodos tradicionales o certificaciones' },
      ];
    case 6:
      return [
        { description: 'Mantén el stock actualizado para evitar cancelaciones' },
        { description: 'El SKU te ayuda a organizar tu inventario interno' },
        { description: 'Activa el control de stock para recibir alertas' },
        { description: 'Pesa tus productos para calcular envíos correctamente' },
      ];
    case 7:
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
