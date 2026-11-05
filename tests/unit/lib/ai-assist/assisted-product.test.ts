import { describe, it, expect } from 'vitest';
import {
  EMPTY_TEXT_STATE,
  buildAssistedProductInput,
  firstInvalidStep,
  validateStep,
  type StepValidationInput,
} from '@/lib/ai-assist/assisted-product';

const valid: StepValidationInput = {
  ...EMPTY_TEXT_STATE,
  productDescription: 'Queso curado de oveja, intenso y cremoso',
  hasProductPhoto: true,
};

describe('assisted-product (formulario guiado de Origen Assist)', () => {
  it('exige la foto del producto en el paso de foto', () => {
    expect(validateStep('photo', { ...valid, hasProductPhoto: false })).toMatch(/foto del producto/);
    expect(validateStep('photo', valid)).toBeNull();
  });

  it('exige una descripción mínima del producto', () => {
    expect(validateStep('product', { ...valid, productDescription: '  corto ' })).toMatch(/qué es tu producto/);
    expect(validateStep('product', valid)).toBeNull();
  });

  it('origen, elaboración y etiquetas son opcionales', () => {
    expect(validateStep('origin', valid)).toBeNull();
    expect(validateStep('production', valid)).toBeNull();
    expect(validateStep('labels', valid)).toBeNull();
  });

  it('un formato de venta indicado debe ser mayor que 0', () => {
    expect(validateStep('details', { ...valid, netContent: 0 })).toMatch(/mayor que 0/);
    expect(validateStep('details', { ...valid, netContent: 250 })).toBeNull();
    expect(validateStep('details', valid)).toBeNull();
  });

  it('firstInvalidStep devuelve el primer paso que falla (o null)', () => {
    expect(firstInvalidStep(valid)).toBeNull();
    expect(firstInvalidStep({ ...valid, hasProductPhoto: false, productDescription: '' })).toBe('photo');
    expect(firstInvalidStep({ ...valid, productDescription: '' })).toBe('product');
  });

  it('buildAssistedProductInput recorta, omite lo vacío y estructura el formato de venta', () => {
    const images = { product: { mediaType: 'image/jpeg' as const, data: 'QUJD' } };
    const input = buildAssistedProductInput(
      {
        ...EMPTY_TEXT_STATE,
        name: '  Queso El Pastor ',
        productDescription: ' Queso curado de oveja ',
        originStory: '   ',
        productionProcess: 'Maduración lenta',
        certifications: ['Orgánico'],
        netContent: 250,
        netContentUnit: 'g',
        improvePhoto: true,
      },
      images,
    );
    expect(input).toEqual({
      images,
      name: 'Queso El Pastor',
      productDescription: 'Queso curado de oveja',
      originStory: undefined,
      productionProcess: 'Maduración lenta',
      extraInfo: undefined,
      certifications: ['Orgánico'],
      netContent: { value: 250, unit: 'g' },
      improvePhoto: true,
    });
  });

  it('sin certificados, formato ni mejora de foto no envía esos campos', () => {
    const input = buildAssistedProductInput(
      { ...EMPTY_TEXT_STATE, productDescription: 'Queso curado de oveja' },
      { product: { mediaType: 'image/jpeg', data: 'QUJD' } },
    );
    expect(input.certifications).toBeUndefined();
    expect(input.netContent).toBeUndefined();
    expect(input.improvePhoto).toBeUndefined();
  });
});
