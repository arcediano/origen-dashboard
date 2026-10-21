/**
 * @file image-list.ts
 * @description Lógica pura (sin React ni red) de las galerías de imágenes del perfil
 * comercial: añadir, sustituir, ordenar, marcar para eliminar y calcular qué enviar
 * al guardar. Las imágenes nuevas viven en el navegador (`file`) hasta que el
 * productor pulsa «Guardar»; entonces se suben y se envían sus claves en el orden
 * elegido (`PATCH /producers/profile`, ver `UpdateProducerProfilePayload`).
 */

import type { ProducerProfileImage, UpdateProducerProfilePayload } from '@/lib/api/producers';

export type ProfileImageCollection = 'teamPhotos' | 'locationImages' | 'galleryImages';

export interface ProfileImageItem {
  /** Estable en la UI: la clave S3 si está guardada, `new-…` si es nueva. */
  id: string;
  /** Clave S3 persistida (solo imágenes ya guardadas). */
  key?: string;
  /** URL de previsualización (CDN para las guardadas, `blob:` para las nuevas). */
  url: string;
  /** Fichero local aún no persistido. Su presencia = «sin guardar». */
  file?: File;
  /** Clave de una subida ya hecha en un guardado fallido (evita volver a subir). */
  uploadedKey?: string;
  /** Imagen guardada marcada para eliminarse al guardar (reversible hasta entonces). */
  removed?: boolean;
}

export interface ProfileImageCollectionConfig {
  /** Campo del payload de `PATCH /producers/profile`. */
  payloadKey: keyof Pick<
    UpdateProducerProfilePayload,
    'teamPhotoKeys' | 'locationImageKeys' | 'galleryImageKeys'
  >;
  /** Categoría de subida (el backend solo admite el prefijo `visual/` para productores). */
  uploadCategory: string;
  /** Máximo de imágenes. Equipo (3) y entorno (10) = límites del backend/onboarding; galería (10) = propuesto. */
  max: number;
}

export const PROFILE_IMAGE_COLLECTIONS: Record<ProfileImageCollection, ProfileImageCollectionConfig> = {
  teamPhotos: { payloadKey: 'teamPhotoKeys', uploadCategory: 'visual/team', max: 3 },
  locationImages: { payloadKey: 'locationImageKeys', uploadCategory: 'visual/location', max: 10 },
  galleryImages: { payloadKey: 'galleryImageKeys', uploadCategory: 'visual/gallery', max: 10 },
};

/** Formatos y tamaño que ya exige el onboarding del productor para fotos del perfil. */
export const PROFILE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PROFILE_IMAGE_MAX_SIZE_MB = 5;

type UrlFactory = (file: File) => string;
type UrlRevoker = (url: string) => void;

const defaultCreateUrl: UrlFactory = (file) => URL.createObjectURL(file);
const defaultRevokeUrl: UrlRevoker = (url) => URL.revokeObjectURL(url);

let idCounter = 0;
const newId = () => `new-${Date.now().toString(36)}-${(idCounter += 1)}`;

export const isPending = (item: ProfileImageItem): boolean => Boolean(item.file);

/** Imágenes que forman la galería tal y como quedaría al guardar. */
export const activeItems = (items: ProfileImageItem[]): ProfileImageItem[] =>
  items.filter((item) => !item.removed);

export const fileSignature = (file: File): string => `${file.name}:${file.size}:${file.lastModified}`;

export function itemsFromApi(
  images: ProducerProfileImage[] | undefined | null,
  resolveUrl: (image: ProducerProfileImage) => string | null = (image) => image.url,
): ProfileImageItem[] {
  return (images ?? []).map((image) => ({
    id: image.key,
    key: image.key,
    url: resolveUrl(image) ?? '',
  }));
}

/** Comprobación síncrona de formato y peso. Devuelve el motivo del rechazo o `null`. */
export function validateImageFileBasics(
  file: Pick<File, 'name' | 'type' | 'size'>,
  options: { maxSizeMb?: number; allowedTypes?: readonly string[] } = {},
): string | null {
  const maxSizeMb = options.maxSizeMb ?? PROFILE_IMAGE_MAX_SIZE_MB;
  const allowed = options.allowedTypes ?? PROFILE_IMAGE_ALLOWED_TYPES;
  if (!allowed.includes(file.type)) {
    return `"${file.name}" no tiene un formato válido. Usa JPG, PNG o WebP.`;
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `"${file.name}" supera el límite de ${maxSizeMb} MB.`;
  }
  return null;
}

export interface AppendResult {
  items: ProfileImageItem[];
  /** Nombres de los ficheros descartados por estar ya añadidos y sin guardar. */
  duplicates: string[];
  /** Ficheros que no caben por el límite de la galería. */
  overflow: number;
}

/** Añade ficheros nuevos al final, sin superar `max` ni repetir ficheros ya pendientes. */
export function appendFiles(
  items: ProfileImageItem[],
  files: File[],
  max: number,
  createUrl: UrlFactory = defaultCreateUrl,
): AppendResult {
  const seen = new Set(
    activeItems(items)
      .filter(isPending)
      .map((item) => fileSignature(item.file as File)),
  );
  const duplicates: string[] = [];
  const accepted: File[] = [];
  for (const file of files) {
    const signature = fileSignature(file);
    if (seen.has(signature)) {
      duplicates.push(file.name);
      continue;
    }
    seen.add(signature);
    accepted.push(file);
  }

  const slots = Math.max(0, max - activeItems(items).length);
  const toAdd = accepted.slice(0, slots);
  const added: ProfileImageItem[] = toAdd.map((file) => ({ id: newId(), url: createUrl(file), file }));

  return {
    items: [...items, ...added],
    duplicates,
    overflow: accepted.length - toAdd.length,
  };
}

/** Sustituye una imagen por un fichero nuevo manteniendo su posición. */
export function replaceWithFile(
  items: ProfileImageItem[],
  id: string,
  file: File,
  createUrl: UrlFactory = defaultCreateUrl,
  revokeUrl: UrlRevoker = defaultRevokeUrl,
): ProfileImageItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    if (isPending(item)) revokeUrl(item.url);
    return { id: newId(), url: createUrl(file), file };
  });
}

/**
 * Elimina una imagen. Las guardadas solo se marcan (se borran al guardar y se
 * pueden recuperar); las nuevas aún no existen en el servidor y se descartan.
 */
export function removeItem(
  items: ProfileImageItem[],
  id: string,
  revokeUrl: UrlRevoker = defaultRevokeUrl,
): ProfileImageItem[] {
  const target = items.find((item) => item.id === id);
  if (!target) return items;
  if (isPending(target)) {
    revokeUrl(target.url);
    return items.filter((item) => item.id !== id);
  }
  return items.map((item) => (item.id === id ? { ...item, removed: true } : item));
}

export function restoreItem(items: ProfileImageItem[], id: string): ProfileImageItem[] {
  return items.map((item) => (item.id === id ? { ...item, removed: false } : item));
}

/** Intercambia la imagen con su vecina visible anterior (-1) o siguiente (1). */
export function moveItem(items: ProfileImageItem[], id: string, direction: -1 | 1): ProfileImageItem[] {
  const from = items.findIndex((item) => item.id === id);
  if (from === -1 || items[from].removed) return items;

  let to = from + direction;
  while (to >= 0 && to < items.length && items[to].removed) to += direction;
  if (to < 0 || to >= items.length) return items;

  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

const sameOrder = (a: Array<string | undefined>, b: Array<string | undefined>): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/** ¿Difiere la galería de la guardada? (nuevas, eliminadas, sustituidas o reordenadas) */
export function hasImageChanges(current: ProfileImageItem[], initial: ProfileImageItem[]): boolean {
  const active = activeItems(current);
  if (active.some(isPending)) return true;
  return !sameOrder(
    active.map((item) => item.key),
    activeItems(initial).map((item) => item.key),
  );
}

/** Claves a enviar, en orden. Exige que todas las nuevas ya estén subidas. */
export function toKeys(items: ProfileImageItem[]): string[] {
  return activeItems(items).map((item) => {
    const key = item.key ?? item.uploadedKey;
    if (!key) throw new Error('Hay imágenes pendientes de subir.');
    return key;
  });
}

/** Libera las previsualizaciones `blob:` de las imágenes nuevas (al cancelar o tras guardar). */
export function releasePendingUrls(items: ProfileImageItem[], revokeUrl: UrlRevoker = defaultRevokeUrl): void {
  items.filter(isPending).forEach((item) => revokeUrl(item.url));
}

export interface UploadHooks {
  onStart?: (id: string) => void;
  onDone?: (id: string, key: string) => void;
  onError?: (id: string, message: string) => void;
}

export interface UploadOutcome {
  items: ProfileImageItem[];
  failed: Array<{ id: string; message: string }>;
}

/**
 * Sube las imágenes nuevas (con un máximo de `concurrency` a la vez) y devuelve la lista
 * con `uploadedKey` en las que se subieron bien: si el guardado falla y se reintenta,
 * no se vuelven a subir.
 */
export async function uploadPendingItems(
  items: ProfileImageItem[],
  upload: (file: File) => Promise<{ key: string }>,
  hooks: UploadHooks = {},
  concurrency = 3,
): Promise<UploadOutcome> {
  const queue = activeItems(items).filter((item) => isPending(item) && !item.uploadedKey);
  const uploaded = new Map<string, string>();
  const failed: UploadOutcome['failed'] = [];

  let cursor = 0;
  const worker = async () => {
    while (cursor < queue.length) {
      const item = queue[cursor];
      cursor += 1;
      hooks.onStart?.(item.id);
      try {
        const { key } = await upload(item.file as File);
        uploaded.set(item.id, key);
        hooks.onDone?.(item.id, key);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo subir la imagen.';
        failed.push({ id: item.id, message });
        hooks.onError?.(item.id, message);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

  return {
    items: items.map((item) => (uploaded.has(item.id) ? { ...item, uploadedKey: uploaded.get(item.id) } : item)),
    failed,
  };
}
