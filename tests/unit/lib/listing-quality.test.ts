import { describe, it, expect } from 'vitest';
import { getListingQuality } from '@/lib/products/listing-quality';

const img = (id: string, main = false) => ({ id, url: `u/${id}`, isMain: main, sortOrder: 0 });
const full = {
  fullDescription: 'x'.repeat(700),
  mainImage: img('1', true),
  gallery: [img('1', true), img('2'), img('3')],
  nutritionalInfo: {} as never,
  productionInfo: { story: 'Historia', productionMethod: '' } as never,
  certifications: [{ id: 'c' }] as never,
};

describe('getListingQuality', () => {
  it('ficha completa: 100 % y sin consejos', () => {
    expect(getListingQuality(full)).toEqual({ score: 100, tips: [] });
  });
  it('ficha mínima: lista qué falta y puntúa por lo que sí hay', () => {
    const q = getListingQuality({ ...full, fullDescription: 'corta', gallery: [img('1', true)], nutritionalInfo: undefined, certifications: [] });
    expect(q.tips.map((t) => t.id)).toEqual(['photos', 'description', 'nutrition', 'certifications']);
    expect(q.score).toBe(20);
  });
  it('la foto principal no cuenta dos veces', () => {
    const q = getListingQuality({ ...full, gallery: [img('1', true), img('2')] });
    expect(q.tips.map((t) => t.id)).toContain('photos');
  });
});
