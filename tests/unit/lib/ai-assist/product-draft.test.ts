import { describe, it, expect } from 'vitest';
import {
  buildFollowUpNotes,
  draftToPatches,
  summarizeDraft,
  type DraftCategory,
  type ProductDraftResponse,
} from '@/lib/ai-assist/product-draft';

const categories: DraftCategory[] = [
  { id: 'c1', name: 'Quesos', children: [{ id: 's1', name: 'Curados' }] },
  { id: 'c2', name: 'Conservas', children: [] },
];

const emptyNutrition = {
  ingredients: null,
  allergens: null,
  mayContain: null,
  servingSizeValue: null,
  servingSizeUnit: null,
  calories: null,
  protein: null,
  totalFat: null,
  saturatedFat: null,
  carbohydrates: null,
  sugars: null,
  dietaryFiber: null,
  sodium: null,
  isGlutenFree: null,
  isVegan: null,
  isVegetarian: null,
};

const response = (over: Partial<ProductDraftResponse['proposal']> = {}, rest: Partial<ProductDraftResponse> = {}): ProductDraftResponse => ({
  proposal: {
    name: 'Queso curado',
    fullDescription: 'Queso artesano.',
    categoryId: 'c1',
    subcategoryId: 's1',
    nutritionalInfo: emptyNutrition,
    productionInfo: { origin: null, productionMethod: null },
    ...over,
  },
  labelLegible: null,
  unreadableFields: [],
  producerMustComplete: ['Precio', 'Stock'],
  notes: null,
  followUpQuestions: [],
  nutritionSource: null,
  allergenSource: null,
  externalSourceNote: null,
  quota: { used: 1, total: 5 },
  mainImage: { key: 'products/foto.jpg', url: 'https://cdn.example.com/products/foto.jpg' },
  ...rest,
});

const serving = { servingSizeValue: 100, servingSizeUnit: 'g' as const };

describe('draftToPatches', () => {
  it('aplica nombre, descripción y categoría/subcategoría con sus nombres', () => {
    const patches = draftToPatches(response(), categories, serving);
    expect(patches).toEqual(
      expect.arrayContaining([
        { kind: 'field', field: 'name', value: 'Queso curado' },
        { kind: 'field', field: 'fullDescription', value: 'Queso artesano.' },
        { kind: 'field', field: 'categoryId', value: 'c1' },
        { kind: 'field', field: 'categoryName', value: 'Quesos' },
        { kind: 'field', field: 'subcategoryId', value: 's1' },
        { kind: 'field', field: 'subcategoryName', value: 'Curados' },
      ]),
    );
  });

  it('nunca propone precio ni stock', () => {
    const fields = draftToPatches(response(), categories, serving)
      .filter((p) => p.kind === 'field')
      .map((p) => p.field);
    expect(fields).not.toContain('basePrice');
    expect(fields).not.toContain('stock');
  });

  it('sin subcategoría válida la deja vacía; sin categoría conocida no toca la categoría', () => {
    const noSub = draftToPatches(response({ categoryId: 'c2', subcategoryId: null }), categories, serving);
    expect(noSub).toContainEqual({ kind: 'field', field: 'subcategoryId', value: '' });
    const unknown = draftToPatches(response({ categoryId: 'zz' }), categories, serving);
    expect(unknown.some((p) => p.kind === 'field' && p.field === 'categoryId')).toBe(false);
  });

  it('solo aplica lo leído de la etiqueta y las marcas dietéticas true', () => {
    const patches = draftToPatches(
      response({
        nutritionalInfo: {
          ...emptyNutrition,
          ingredients: ['Leche'],
          allergens: ['Lácteos'],
          calories: 120,
          isVegan: null,
          isGlutenFree: true,
        },
      }),
      categories,
      serving,
    );
    const nested = patches.filter((p) => p.kind === 'nested');
    expect(nested).toEqual(
      expect.arrayContaining([
        { kind: 'nested', section: 'nutritionalInfo', field: 'ingredients', value: ['Leche'] },
        { kind: 'nested', section: 'nutritionalInfo', field: 'allergens', value: ['Lácteos'] },
        { kind: 'nested', section: 'nutritionalInfo', field: 'calories', value: 120 },
        { kind: 'nested', section: 'nutritionalInfo', field: 'isGlutenFree', value: true },
      ]),
    );
    expect(nested.some((p) => p.field === 'protein')).toBe(false);
    expect(nested.some((p) => p.field === 'isVegan')).toBe(false);
  });

  it('aplica origen y método solo si vienen informados', () => {
    const patches = draftToPatches(
      response({ productionInfo: { origin: 'Soria', productionMethod: null } }),
      categories,
      serving,
    );
    expect(patches).toContainEqual({ kind: 'nested', section: 'productionInfo', field: 'origin', value: 'Soria' });
    expect(patches.some((p) => p.kind === 'nested' && p.field === 'productionMethod')).toBe(false);
  });
});

describe('summarizeDraft', () => {
  it('lista lo rellenado y lo que debe completar el productor', () => {
    const s = summarizeDraft(response());
    expect(s.filled).toEqual(['Nombre', 'Descripción', 'Categoría']);
    expect(s.toComplete).toEqual(['Precio', 'Stock']);
    expect(s.toReview).toEqual([]);
  });

  it('avisa de una etiqueta ilegible y de campos que no se pudieron leer', () => {
    expect(summarizeDraft(response({}, { labelLegible: false })).toReview[0]).toMatch(/no se pudo leer/i);
    const partial = summarizeDraft(
      response(
        { nutritionalInfo: { ...emptyNutrition, ingredients: ['Leche'], allergens: [], calories: 100 } },
        { labelLegible: true, unreadableFields: ['sodium'] },
      ),
    );
    expect(partial.filled).toEqual(expect.arrayContaining(['Ingredientes', 'Alérgenos', 'Información nutricional']));
    expect(partial.toReview.join(' ')).toContain('sodio');
  });

  it('avisa cuando ingredientes/alérgenos vienen de un código de barras', () => {
    const s = summarizeDraft(
      response(
        {},
        {
          allergenSource: 'barcode',
          nutritionSource: 'barcode',
          externalSourceNote: 'Open Food Facts: Queso X (código de barras 8412345678901)',
        },
      ),
    );
    expect(s.toReview.join(' ')).toContain('Open Food Facts');
    expect(s.toReview.join(' ')).toContain('código de barras');
  });

  it('avisa de que la nutrición es una estimación, no un dato exacto', () => {
    const s = summarizeDraft(
      response(
        {},
        { nutritionSource: 'estimated', externalSourceNote: 'BEDCA: queso curado de oveja' },
      ),
    );
    expect(s.toReview.join(' ')).toMatch(/ESTIMADA/);
    expect(s.toReview.join(' ')).toContain('BEDCA');
  });
});

describe('buildFollowUpNotes', () => {
  it('null si no se respondió nada', () => {
    expect(buildFollowUpNotes({})).toBeNull();
  });

  it('construye una línea legible por cada respuesta, con su etiqueta', () => {
    const notes = buildFollowUpNotes({
      'productionInfo.origin': 'Soria',
      'nutritionalInfo.isVegan': 'Sí',
    });
    expect(notes).toContain('Origen: Soria');
    expect(notes).toContain('¿Vegano?: Sí');
  });

  it('ignora respuestas vacías (saltadas)', () => {
    const notes = buildFollowUpNotes({
      'productionInfo.origin': 'Soria',
      'productionInfo.productionMethod': '',
    });
    expect(notes).toContain('Origen: Soria');
    expect(notes).not.toContain('Método de producción');
  });
});
