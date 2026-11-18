import { getImageDimensions } from '@/lib/validations/image-quality';

/** Lo que la IA exige de la foto principal (mismo criterio que el servidor: 800 px, 4:5 a 5:4). */
export const MAIN_PHOTO_MIN_SIDE_PX = 800;
export const MAIN_PHOTO_MIN_RATIO = 0.8; // 4:5
export const MAIN_PHOTO_MAX_RATIO = 1.25; // 5:4
export const MAIN_PHOTO_MAX_MB = 10;

/** Requisitos en lenguaje llano, para mostrarlos antes de elegir el archivo. */
export const MAIN_PHOTO_REQUIREMENTS: string[] = [
  'Solo el producto, completo y centrado, sin manos ni otros objetos',
  'Fondo blanco liso (sin mesas, estanterías ni estancias)',
  'Cuadrada o casi cuadrada (entre 4:5 y 5:4)',
  `Mínimo ${MAIN_PHOTO_MIN_SIDE_PX} px por el lado menor`,
  'Nítida, bien iluminada y con margen alrededor',
];

/** Comprueba lo objetivo (tipo, peso, tamaño y proporción) antes de subirla. `null` = válida. */
export async function validateMainPhoto(file: File): Promise<string | null> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'El archivo debe ser una imagen JPG, PNG o WebP.';
  }
  if (file.size > MAIN_PHOTO_MAX_MB * 1024 * 1024) {
    return `La imagen pesa demasiado (máximo ${MAIN_PHOTO_MAX_MB} MB).`;
  }
  let width: number;
  let height: number;
  try {
    ({ width, height } = await getImageDimensions(file));
  } catch {
    return 'No hemos podido leer la imagen. Prueba con otra.';
  }
  if (Math.min(width, height) < MAIN_PHOTO_MIN_SIDE_PX) {
    return `La imagen es demasiado pequeña (${width}×${height} px): el lado menor debe medir al menos ${MAIN_PHOTO_MIN_SIDE_PX} px.`;
  }
  const ratio = width / height;
  if (ratio < MAIN_PHOTO_MIN_RATIO || ratio > MAIN_PHOTO_MAX_RATIO) {
    return `La imagen no es cuadrada (${width}×${height} px): debe ser cuadrada o casi cuadrada, entre 4:5 y 5:4.`;
  }
  return null;
}
