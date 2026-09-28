/**
 * Redimensiona una foto de etiqueta en el navegador antes de enviarla al
 * asistente de IA: lado máximo 1568 px (más no aporta a la lectura) y JPEG, para
 * quedar muy por debajo del límite del backend (~2 MB en base64 por imagen) y
 * contener el coste en tokens.
 */

const MAX_SIDE = 1568;
const JPEG_QUALITY = 0.85;
/** Límite del backend (`MAX_LABEL_IMAGE_BASE64_LENGTH`). */
const MAX_BASE64_LENGTH = 2_000_000;

export interface LabelImagePayload {
  mediaType: 'image/jpeg';
  /** Base64 sin prefijo `data:`. */
  data: string;
}

/** Dimensiones de salida manteniendo la proporción, sin ampliar nunca. */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number = MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se ha podido abrir la imagen.'));
    };
    img.src = url;
  });
}

export async function resizeLabelImage(file: File): Promise<LabelImagePayload> {
  const img = await loadImage(file);
  let { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);

  // Si aun así supera el límite (foto muy detallada), reducir por pasos.
  for (let attempt = 0; attempt < 4; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se ha podido procesar la imagen.');
    ctx.fillStyle = '#fff'; // PNG con transparencia → fondo blanco en JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const data = dataUrl.slice(dataUrl.indexOf(',') + 1);
    if (data.length <= MAX_BASE64_LENGTH) return { mediaType: 'image/jpeg', data };

    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
  }
  throw new Error('La imagen es demasiado grande. Prueba con otra foto.');
}
