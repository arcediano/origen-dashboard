import { describe, it, expect } from 'vitest';
import {
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
  quota: { used: 1, total: 5 },
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
});
