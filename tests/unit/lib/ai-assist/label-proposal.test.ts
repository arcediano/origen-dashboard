import { describe, it, expect } from 'vitest';
import {
  proposalToPatches,
  unreadableFieldNames,
  type LabelProposal,
} from '@/lib/ai-assist/label-proposal';
import { fitWithin } from '@/lib/ai-assist/resize-label-image';

const empty: LabelProposal = {
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
};
const current = { servingSizeValue: 100, servingSizeUnit: 'g' as const };

const byField = (patches: ReturnType<typeof proposalToPatches>) =>
  Object.fromEntries(patches.map((p) => [p.field, p.value]));

describe('proposalToPatches', () => {
  it('no toca ningún campo si la IA no leyó nada', () => {
    expect(proposalToPatches(empty, current)).toEqual([]);
  });

  it('solo incluye los campos leídos', () => {
    const patches = byField(
      proposalToPatches(
        { ...empty, ingredients: ['sal', 'agua'], calories: 120, sodium: 300 },
        current,
      ),
    );
    expect(patches).toEqual({
      ingredients: ['sal', 'agua'],
      calories: 120,
      sodium: 300,
    });
  });

  it('un array vacío de alérgenos es un dato válido (no declara alérgenos)', () => {
    const patches = byField(proposalToPatches({ ...empty, allergens: [] }, current));
    expect(patches).toEqual({ allergens: [] });
  });

  it('un 0 numérico se aplica (no se confunde con "no leído")', () => {
    const patches = byField(proposalToPatches({ ...empty, sugars: 0 }, current));
    expect(patches).toEqual({ sugars: 0 });
  });

  it('mantiene servingSize (texto) coherente con valor + unidad', () => {
    const patches = byField(
      proposalToPatches(
        { ...empty, servingSizeValue: 30, servingSizeUnit: 'ml' },
        current,
      ),
    );
    expect(patches).toEqual({
      servingSizeValue: 30,
      servingSizeUnit: 'ml',
      servingSize: '30ml',
    });
  });

  it('si solo se lee la unidad, conserva el valor actual en el texto', () => {
    const patches = byField(
      proposalToPatches({ ...empty, servingSizeUnit: 'ml' }, current),
    );
    expect(patches).toEqual({ servingSizeUnit: 'ml', servingSize: '100ml' });
  });
});

describe('unreadableFieldNames', () => {
  it('traduce los campos conocidos y deja el resto tal cual', () => {
    expect(unreadableFieldNames(['allergens', 'sodium', 'raro'])).toEqual([
      'alérgenos',
      'sodio',
      'raro',
    ]);
  });
});

describe('fitWithin', () => {
  it('reduce manteniendo la proporción', () => {
    expect(fitWithin(3136, 1568)).toEqual({ width: 1568, height: 784 });
  });
  it('nunca amplía', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('lado mínimo 1 px', () => {
    expect(fitWithin(100000, 1)).toEqual({ width: 1568, height: 1 });
  });
});
