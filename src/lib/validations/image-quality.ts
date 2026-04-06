export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageQualityRequirement {
  minDimensions: ImageDimensions;
  recommendedDimensions?: ImageDimensions;
  usageLabel: string;
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
  const minimum = `Min. ${formatImageDimensions(requirement.minDimensions)}`;

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