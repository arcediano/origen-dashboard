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

export function getImageQualityHint(requirement: ImageQualityRequirement): string {
  const minimum = `Min. ${formatImageDimensions(requirement.minDimensions)}${requirement.aspectRatio ? ' · Panorámica (entre 2:1 y 4:1)' : ''}`;

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
  const shape = ratio < range.min
    ? (ratio < 1.1 ? 'cuadrada o vertical' : 'demasiado cuadrada')
    : 'demasiado alargada';
  return `La imagen "${fileName}" mide ${actual} y es ${shape}. Para ${requirement.usageLabel} necesitamos una imagen panorámica (horizontal) con proporción entre ${range.min}:1 y ${range.max}:1, por ejemplo 2400x900 px. Recórtala y vuelve a subirla.`;
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