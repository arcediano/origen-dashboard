export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageQualityRequirement {
  minDimensions: ImageDimensions;
  recommendedDimensions?: ImageDimensions;
  usageLabel: string;
  /** Proporción ancho/alto permitida (p. ej. cabeceras panorámicas: no se aceptan imágenes cuadradas). */
  aspectRatio?: { min: number; max: number };
}

export const IMAGE_QUALITY_PRESETS = {
  businessLogo: {
    minDimensions: { width: 400, height: 400 },
    recommendedDimensions: { width: 800, height: 800 },
    usageLabel: 'el perfil publico del productor',
  },
  profileBanner: {
    minDimensions: { width: 1600, height: 600 },
    recommendedDimensions: { width: 2400, height: 900 },
    usageLabel: 'la cabecera publica del perfil',
    aspectRatio: { min: 2, max: 4 },
  },
  profileGallery: {
    minDimensions: { width: 1600, height: 900 },
    recommendedDimensions: { width: 2400, height: 1350 },
    usageLabel: 'las galerias publicas del perfil',
  },
  productImage: {
    minDimensions: { width: 1200, height: 1200 },
    recommendedDimensions: { width: 2000, height: 2000 },
    usageLabel: 'la ficha publica del producto y los listados',
    // Tolerancia +/-10% sobre 1:1 (petición del humano, 2026-10-17, guía
    // de imágenes A.1): la foto de producto es siempre un lienzo cuadrado
    // en el catálogo (FLUX 2000x2000, ver ProductCard.tsx en origen-web) —
    // una subida manual claramente rectangular queda mal con el relleno
    // `object-contain` + degradado pastel. No se exige 1:1 exacto porque
    // un recorte perfecto a mano es poco realista para el productor.
    aspectRatio: { min: 0.9, max: 1.1 },
  },
  productionGallery: {
    minDimensions: { width: 1600, height: 900 },
    recommendedDimensions: { width: 2400, height: 1350 },
    usageLabel: 'la galeria publica del proceso de elaboracion',
  },
} as const satisfies Record<string, ImageQualityRequirement>;

export function formatImageDimensions(dimensions: ImageDimensions): string {
  return `${dimensions.width}x${dimensions.height} px`;
}

/**
 * Hallazgo (2026-10-17, al añadir `aspectRatio` a `productImage`): esta
 * función tenía el texto "Panorámica (entre 2:1 y 4:1)" escrito a mano,
 * acoplado a los valores concretos de `profileBanner` — el único preset
 * que usaba `aspectRatio` hasta ahora. Con un segundo preset de
 * proporción distinta (cuadrada) el texto quedaba simplemente falso.
 * Se generaliza a partir del rango real de cada requirement.
 */
function isSquareishRange(range: { min: number; max: number }): boolean {
  return range.min <= 1 && range.max >= 1 && range.max - range.min <= 0.3;
}

function describeAspectRatioRange(range: { min: number; max: number }): string {
  return isSquareishRange(range)
    ? 'Cuadrada (proporción 1:1)'
    : `Panorámica (entre ${range.min}:1 y ${range.max}:1)`;
}

export function getImageQualityHint(requirement: ImageQualityRequirement): string {
  const minimum = `Min. ${formatImageDimensions(requirement.minDimensions)}${requirement.aspectRatio ? ` · ${describeAspectRatioRange(requirement.aspectRatio)}` : ''}`;

  if (!requirement.recommendedDimensions) {
    return minimum;
  }

  return `${minimum} · Ideal ${formatImageDimensions(requirement.recommendedDimensions)}`;
}

export function buildImageResolutionError(
  fileName: string,
  actualDimensions: ImageDimensions,
  requirement: ImageQualityRequirement
): string {
  const minimum = formatImageDimensions(requirement.minDimensions);
  const actual = formatImageDimensions(actualDimensions);
  const recommended = requirement.recommendedDimensions
    ? ` Te recomendamos preparar una version de al menos ${formatImageDimensions(requirement.recommendedDimensions)}.`
    : '';

  return `La imagen "${fileName}" mide ${actual} y no alcanza el minimo exigido de ${minimum}. Si la subes asi, se vera borrosa o pixelada en ${requirement.usageLabel}.${recommended}`;
}

/** Describe la forma real de una imagen (vertical/cuadrada/horizontal), independiente del target. */
function describeActualShape(ratio: number): string {
  if (ratio < 0.9) return 'vertical';
  if (ratio > 1.1) return 'horizontal (apaisada)';
  return 'cuadrada';
}

/** Describe la forma exigida por un rango de aspectRatio, para el mensaje de error. */
function describeTargetShape(range: { min: number; max: number }): string {
  return isSquareishRange(range)
    ? 'cuadrada, con proporción 1:1 (por ejemplo 2000x2000 px)'
    : `panorámica (horizontal), con proporción entre ${range.min}:1 y ${range.max}:1 (por ejemplo 2400x900 px)`;
}

/** Devuelve un mensaje claro si la proporción de la imagen no encaja con la requerida; si no, `null`. */
export function buildImageAspectRatioError(
  fileName: string,
  actualDimensions: ImageDimensions,
  requirement: ImageQualityRequirement
): string | null {
  const range = requirement.aspectRatio;
  if (!range) return null;
  const ratio = actualDimensions.width / actualDimensions.height;
  if (ratio >= range.min && ratio <= range.max) return null;
  const actual = formatImageDimensions(actualDimensions);
  return `La imagen "${fileName}" mide ${actual} y es ${describeActualShape(ratio)}. Para ${requirement.usageLabel} necesitamos una imagen ${describeTargetShape(range)}. Recórtala y vuelve a subirla.`;
}

export const isImageFile = (type: string): boolean => type.startsWith('image/');

export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = url;
  });
};