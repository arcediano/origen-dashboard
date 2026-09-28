import { describe, it, expect } from 'vitest';
import {
  buildTextDraft,
  hasDraftContent,
  overwrittenFields,
} from '@/lib/ai-assist/text-proposal';

describe('text-proposal', () => {
  it('buildTextDraft quita claves vacías o en blanco y recorta', () => {
    expect(
      buildTextDraft({ name: '  Miel  ', categoryName: '', shortDescription: '   ', notes: undefined }),
    ).toEqual({ name: 'Miel' });
  });

  it('hasDraftContent exige nombre, notas o descripción corta (no basta la categoría)', () => {
    expect(hasDraftContent({ categoryName: 'Quesos' })).toBe(false);
    expect(hasDraftContent({ fullDescription: 'algo' })).toBe(false);
    expect(hasDraftContent({ name: 'Miel' })).toBe(true);
    expect(hasDraftContent({ notes: 'de azahar' })).toBe(true);
  });

  it('overwrittenFields lista solo los campos que ya tienen texto', () => {
    expect(
      overwrittenFields({ name: 'Miel', shortDescription: '  ', fullDescription: 'x' }),
    ).toEqual(['name', 'fullDescription']);
  });
});
