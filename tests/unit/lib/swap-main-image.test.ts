import { describe, expect, it } from 'vitest';
import { swapMainImage } from '@/lib/products/swap-main-image';

const img = (id: string, isMain = false, sortOrder = 0) => ({
  id,
  url: `u/${id}`,
  isMain,
  sortOrder,
  focusX: 50,
  focusY: 50,
});

describe('swapMainImage', () => {
  it('pone la foto nueva como principal y primera de la galería, conservando el resto', () => {
    const old = img('old', true, 0);
    const r = swapMainImage({ mainImage: old, gallery: [old, img('b', false, 1), img('c', false, 2)] }, { key: 'new', url: 'u/new' });
    expect(r.mainImage.id).toBe('new');
    expect(r.gallery.map((g) => g.id)).toEqual(['new', 'b', 'c']);
    expect(r.gallery.map((g) => g.sortOrder)).toEqual([0, 1, 2]);
  });

  it('funciona sin galería previa', () => {
    expect(swapMainImage({}, { key: 'n', url: 'u' }).gallery).toHaveLength(1);
  });

  it('conserva el archivo elegido en el equipo para subirlo al guardar', () => {
    const file = new File(['x'], 'f.jpg', { type: 'image/jpeg' });
    const r = swapMainImage({}, { key: 'temp-1', url: 'blob:x', file });
    expect(r.mainImage.file).toBe(file);
    expect(r.gallery[0].file).toBe(file);
  });
});
