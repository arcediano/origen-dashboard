/**
 * @file useStepTips.test.ts
 * @description Petición del humano (2026-10-08): en la edición y creación
 * manual de productos (sin asistente de IA), los consejos útiles deben
 * incentivar el uso del asistente de IA para rehacer el producto con un
 * acabado más profesional.
 *
 * Indexado por `FormStepId` (no por posición numérica, mismo cambio y misma
 * fecha): ver useStepTips.ts.
 */
import { describe, it, expect } from 'vitest';
import { useStepTips } from '@/hooks/useStepTips';
import { FORM_STEPS } from '@/types/product';

describe('useStepTips — recuerdo del asistente de IA', () => {
  it.each(FORM_STEPS.map((s) => s.id))('añade el consejo del asistente de IA al final del paso %s', (step) => {
    const tips = useStepTips(step, {});
    expect(tips.length).toBeGreaterThan(0);
    const last = tips[tips.length - 1];
    expect(last.description).toContain('asistente de IA');
    expect(last.description).toContain('profesional');
  });

  it('no añade nada en un paso sin consejos (id desconocido)', () => {
    expect(useStepTips('unknown' as any, {})).toEqual([]);
  });

  it('mantiene los consejos propios del paso antes del de IA', () => {
    const tips = useStepTips('basic', {});
    expect(tips[0].description).toContain('palabras clave');
  });
});
