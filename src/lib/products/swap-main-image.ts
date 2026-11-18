import type { ProductImage } from '@/types/product';

/**
 * Pone `photo` como imagen principal (sortOrder 0) y la deja también como primer elemento de la
 * galería (el backend guarda la principal dentro de `gallery`). El resto de la galería se conserva.
 */
export function swapMainImage(
  current: { mainImage?: ProductImage | null; gallery?: ProductImage[] | null },
  photo: { key: string; url: string; /** Foto elegida en el equipo: se sube al guardar. */ file?: File },
): { mainImage: ProductImage; gallery: ProductImage[] } {
  const next: ProductImage = {
    id: photo.key,
    url: photo.url,
    isMain: true,
    sortOrder: 0,
    focusX: 50,
    focusY: 50,
    ...(photo.file ? { file: photo.file } : {}),
  };
  const rest = (current.gallery ?? [])
    .filter((img) => !img.isMain && img.id !== current.mainImage?.id)
    .map((img, i) => ({ ...img, sortOrder: i + 1 }));
  return { mainImage: next, gallery: [next, ...rest] };
}
