import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_STEPS,
  getMaxReachableIndex,
  normalizeCompletedSteps,
  parseStepParam,
  resolveInitialStepIndex,
} from '@/lib/onboarding/steps';

describe('pasos del onboarding (ADR-020)', () => {
  it('son 5 y ya no existen Historia ni Productos', () => {
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
    const titles = ONBOARDING_STEPS.map((s) => s.title).join('|').toLowerCase();
    expect(titles).not.toContain('historia');
    expect(titles).not.toContain('productos');
    expect(titles).not.toContain('capacidad');
  });
});

describe('parseStepParam', () => {
  it.each([['1', 1], ['3', 3], ['5', 5]])('acepta %s', (raw, expected) => {
    expect(parseStepParam(raw)).toBe(expected);
  });
  it.each(['0', '6', '7', '-1', 'abc', '', '2.5', null, undefined])('rechaza %s', (raw) => {
    expect(parseStepParam(raw as string | null | undefined)).toBeNull();
  });
});

describe('normalizeCompletedSteps', () => {
  it('descarta valores fuera de 1..5 (numeración vieja), duplicados y ordena', () => {
    expect(normalizeCompletedSteps([5, 1, 1, 6, 7, 0, 3])).toEqual([1, 3, 5]);
    expect(normalizeCompletedSteps(undefined)).toEqual([]);
  });
});

describe('alcance y paso inicial', () => {
  it('máximo alcanzable: siguiente al último completado o currentStep del backend', () => {
    expect(getMaxReachableIndex([], null)).toBe(0);
    expect(getMaxReachableIndex([1, 2], 3)).toBe(2);
    expect(getMaxReachableIndex([1, 2, 3, 4, 5], 5)).toBe(4);
  });

  it('?step=N manda, pero no más allá de lo alcanzable', () => {
    expect(resolveInitialStepIndex({ urlStep: 2, currentStep: 4, completedSteps: [1, 2, 3] })).toBe(1);
    expect(resolveInitialStepIndex({ urlStep: 5, currentStep: 2, completedSteps: [1] })).toBe(1);
  });

  it('sin ?step= usa currentStep (máx. 5) y sin datos empieza en el 1', () => {
    expect(resolveInitialStepIndex({ urlStep: null, currentStep: 3, completedSteps: [1, 2] })).toBe(2);
    expect(resolveInitialStepIndex({ urlStep: null, currentStep: 9, completedSteps: [1, 2, 3, 4, 5] })).toBe(4);
    expect(resolveInitialStepIndex({ urlStep: null })).toBe(0);
  });
});
