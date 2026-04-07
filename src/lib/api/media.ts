/**
 * Cliente para subida de archivos a S3 a través del gateway.
 * El gateway proxy reenvía los archivos al producers-service / MediaController.
 *
 * Los archivos de tipo 'media' (imágenes) se guardan en el bucket público;
 * los de tipo 'document' (PDFs, certificados) en el bucket privado.
 *
 * @returns { key, url } — key es la ruta S3 (se almacena en BD); url es la URL
 * pública para imágenes o null para documentos.
 */

// Siempre usamos el Route Handler /api/upload del propio Next.js.
// Este handler lee el accessToken HttpOnly server-side y lo reenvía al gateway
// con Authorization: Bearer, evitando el problema de cookies no reenviadas
// en los rewrites de Next.js a orígenes externos.
const UPLOAD_PATH = '/api/upload';

function resolveEntityType(category: string): 'products' | 'producers' | 'certifications' {
  if (category.startsWith('products/')) {
    return 'products';
  }

  if (category.startsWith('documents/certifications/')) {
    return 'certifications';
  }

  return 'producers';
}


export interface UploadResult {
  key: string;
  url: string | null;
}

/**
 * Sube un archivo al bucket S3 correspondiente.
 *
 * @param file     - Objeto File del input/drop zone
 * @param category - Carpeta de destino dentro del bucket:
 *   'visual/logo' | 'visual/banner' | 'visual/products' | 'visual/location' |
 *   'visual/team' | 'documents/cif' | 'documents/seguro-rc' |
 *   'documents/manipulador-alimentos' | 'documents/certifications/{certId}'
 */
export async function uploadFile(file: File, category: string): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  form.append('entityType', resolveEntityType(category));

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${UPLOAD_PATH}`
    : `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000'}${UPLOAD_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error('No se pudo conectar al servidor de archivos. Comprueba tu conexión.');
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('El archivo supera el tamaño máximo permitido. Prueba con un archivo más pequeño.');
    }
    if (response.status === 415) {
      throw new Error('Formato de archivo no permitido. Comprueba que el tipo de archivo sea correcto.');
    }
    if (response.status === 401) {
      throw new Error('Tu sesión ha expirado. Recarga la página e inicia sesión de nuevo.');
    }
    const data = await response.json().catch(() => ({}));
    const message = (data as any)?.message ?? 'Error al subir el archivo. Inténtalo de nuevo.';
    throw new Error(message);
  }

  const result = await response.json();
  return (result.data ?? result) as UploadResult;
}
