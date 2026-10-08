/**
 * @file useStepTips.test.ts
 * @description Petición del humano (2026-10-08): en la edición y creación
 * manual de productos (sin asistente de IA), los consejos útiles deben
 * incentivar el uso del asistente de IA para rehacer el producto con un
 * acabado más profesional.
 */
import { describe, it, expect } from 'vitest';
import { useStepTips } from '@/hooks/useStepTips';

describe('useStepTips — recuerdo del asistente de IA', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('añade el consejo del asistente de IA al final del paso %i', (step) => {
    const tips = useStepTips(step, {});
    expect(tips.length).toBeGreaterThan(0);
    const last = tips[tips.length - 1];
    expect(last.description).toContain('asistente de IA');
    expect(last.description).toContain('profesional');
  });

  it('no añade nada en un paso sin consejos (fuera de rango)', () => {
    expect(useStepTips(99, {})).toEqual([]);
  });

  it('mantiene los consejos propios del paso antes del de IA', () => {
    const tips = useStepTips(1, {});
    expect(tips[0].description).toContain('palabras clave');
  });
});
