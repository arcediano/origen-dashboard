/**
 * Cliente para subida de archivos a S3.
 *
 * Estrategia principal: Presigned PUT URLs.
 *   1. GET /api/v1/media/presigned-upload → { key, uploadUrl, publicUrl }
 *   2. PUT ${uploadUrl} directamente a S3 desde el browser (cero bytes por tu servidor)
 *
 * Fallback: ruta proxy /api/upload para compatibilidad con uploads de documentos
 * y otros contextos que no son imágenes de producto.
 */

const UPLOAD_PATH = '/api/upload';
// Server-side route que lee la cookie HttpOnly y llama al gateway con Bearer token.
// Evita problemas de cookie-forwarding en rewrites de Next.js y expone la sesión al cliente.
const PRESIGNED_PATH = '/api/presigned-upload';

function guessMimeType(filename: string | undefined | null): string {
  if (!filename) return 'image/jpeg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}

function resolveEntityType(category: string): 'products' | 'producers' | 'certifications' {
  if (category.startsWith('products/')) return 'products';
  if (category.startsWith('documents/certifications/')) return 'certifications';
  return 'producers';
}

export interface UploadFileOptions {
  entityType?: 'products' | 'producers' | 'certifications';
  entityId?: string;
}

export interface UploadResult {
  key: string;
  url: string | null;
}

// ─── PRESIGNED URL UPLOAD ─────────────────────────────────────────────────────

/**
 * Solicita una URL prefirmada de S3 al backend y sube el fichero directamente
 * desde el browser sin que los bytes pasen por ningún servidor propio.
 *
 * @param file     - Objeto File del input/drop zone
 * @param category - Ruta lógica de destino (ej: 'products/drafts/images')
 * @param options  - entityType, entityId
 */
export async function uploadFile(
  file: File,
  category: string,
  options: UploadFileOptions = {},
): Promise<UploadResult> {
  const entityType = options.entityType ?? resolveEntityType(category);

  // ── Paso 1: obtener presigned PUT URL del backend ──────────────────────────
  const rawType = (file as any)?.type;
  const rawName = (file as any)?.name;
  const resolvedMimeType =
    rawType && rawType !== 'undefined' ? rawType : guessMimeType(rawName);
  const params = new URLSearchParams({ mimeType: resolvedMimeType, entityType, category });
  if (options.entityId) params.set('entityId', options.entityId);

  let presignedRes: Response;
  try {
    presignedRes = await fetch(`${PRESIGNED_PATH}?${params}`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch {
    // Conectividad: caer al proxy clásico
    return uploadFileViaProxy(file, category, options);
  }

  // Endpoint no disponible aún (despliegue pendiente en backend) → fallback al proxy
  if (presignedRes.status === 404 || presignedRes.status === 502 || presignedRes.status === 503) {
    return uploadFileViaProxy(file, category, options);
  }

  if (!presignedRes.ok) {
    if (presignedRes.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
      throw new Error('Tu sesión ha expirado.');
    }
    const data = await presignedRes.json().catch(() => ({}));
    throw new Error((data as any)?.message ?? 'Error al preparar la subida del archivo.');
  }

  const { key, uploadUrl, publicUrl } = await presignedRes.json();

  if (!uploadUrl) {
    // Respuesta inesperada del backend → fallback al proxy
    return uploadFileViaProxy(file, category, options);
  }

  // ── Paso 2: subir directamente a S3 con PUT binario ───────────────────────
  let s3Res: Response;
  try {
    s3Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  } catch {
    // S3 inaccesible desde el browser → fallback al proxy (server-side puede alcanzarlo)
    return uploadFileViaProxy(file, category, options);
  }

  if (!s3Res.ok) {
    // CORS o credenciales S3 aún no configuradas → fallback al proxy
    if (s3Res.status === 403 || s3Res.status === 0) {
      return uploadFileViaProxy(file, category, options);
    }
    // 404 puede ocurrir si S3 redirige la petición PUT a otra región (301) y el
    // navegador la reenvía como GET (comportamiento estándar para 301): la clave
    // no existe aún → S3 devuelve NoSuchKey. Fallback al proxy server-side.
    if (s3Res.status === 404) {
      return uploadFileViaProxy(file, category, options);
    }
    if (s3Res.status === 413) {
      throw new Error('El archivo supera el tamaño máximo permitido.');
    }
    throw new Error(`Error al subir el archivo (${s3Res.status}). Inténtalo de nuevo.`);
  }

  return { key, url: publicUrl };
}

// ─── PROXY UPLOAD (fallback para documentos y flujos legacy) ─────────────────

/**
 * Sube un fichero a través del proxy Next.js → gateway → media-service.
 * Usar solo para documentos privados o contextos donde no sea posible el PUT directo a S3.
 */
export async function uploadFileViaProxy(
  file: File,
  category: string,
  options: UploadFileOptions = {},
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  form.append('entityType', options.entityType ?? resolveEntityType(category));
  if (options.entityId) form.append('entityId', options.entityId);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${UPLOAD_PATH}`
    : `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000'}${UPLOAD_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', body: form });
  } catch {
    throw new Error('No se pudo conectar al servidor de archivos. Comprueba tu conexión.');
  }

  if (!response.ok) {
    if (response.status === 413) throw new Error('El archivo supera el tamaño máximo permitido.');
    if (response.status === 415) throw new Error('Formato de archivo no permitido.');
    if (response.status === 401) {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('session:expired'));
      throw new Error('Tu sesión ha expirado.');
    }
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.message ?? 'Error al subir el archivo. Inténtalo de nuevo.');
  }

  const result = await response.json();
  return (result.data ?? result) as UploadResult;
}
