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

const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';
const API_PATH = '/api/v1/media/upload';

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

  const response = await fetch(`${BASE_URL}${API_PATH}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as any)?.message ?? `Error ${response.status} al subir archivo`;
    throw new Error(message);
  }

  const result = await response.json();
  return (result.data ?? result) as UploadResult;
}
