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

const BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000');
const API_PATHS = ['/api/v1/media/upload', '/api/media/upload', '/media/upload'] as const;

function resolveEntityType(category: string): 'products' | 'producers' | 'certifications' {
  if (category.startsWith('products/')) {
    return 'products';
  }

  if (category.startsWith('documents/certifications/')) {
    return 'certifications';
  }

  return 'producers';
}

function shouldRetryWithNextPath(response: Response): boolean {
  return response.status === 404 || response.status === 405;
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

  let response: Response | null = null;
  let networkError = false;

  for (const apiPath of API_PATHS) {
    try {
      response = await fetch(`${BASE_URL}${apiPath}`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
    } catch {
      networkError = true;
      continue;
    }

    if (response.ok || !shouldRetryWithNextPath(response)) {
      break;
    }
  }

  if (!response) {
    if (networkError) {
      throw new Error('No se pudo conectar al servidor de archivos. Comprueba tu conexión e inténtalo de nuevo.');
    }

    throw new Error('No se encontro una ruta valida de subida de archivos.');
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
    const message = (data as any)?.message ?? `Error al subir el archivo. Inténtalo de nuevo.`;
    throw new Error(message);
  }

  const result = await response.json();
  return (result.data ?? result) as UploadResult;
}
