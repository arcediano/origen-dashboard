/**
 * Tests unitarios para onboardingStep3Schema (Perfil visual)
 * Todos los campos son opcionales — el schema solo falla si hay un tipo incorrecto.
 */

import { describe, it, expect } from 'vitest';
import { onboardingStep3Schema } from '@/lib/validations/seller';

describe('onboardingStep3Schema — Perfil visual', () => {
  it('pasa con objeto vacío (todos los campos son opcionales)', () => {
    const result = onboardingStep3Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('pasa con bannerFile como File', () => {
    const result = onboardingStep3Schema.safeParse({
      bannerFile: new File([''], 'banner.jpg', { type: 'image/jpeg' }),
    });
    expect(result.success).toBe(true);
  });

  it('pasa con bannerFile como undefined', () => {
    const result = onboardingStep3Schema.safeParse({ bannerFile: undefined });
    expect(result.success).toBe(true);
  });

  it('pasa con logoFile como File', () => {
    const result = onboardingStep3Schema.safeParse({
      logoFile: new File([''], 'logo.png', { type: 'image/png' }),
    });
    expect(result.success).toBe(true);
  });

  it('pasa con logoFile como undefined', () => {
    const result = onboardingStep3Schema.safeParse({ logoFile: undefined });
    expect(result.success).toBe(true);
  });

  it('pasa con galleryFiles como array vacío', () => {
    const result = onboardingStep3Schema.safeParse({ galleryFiles: [] });
    expect(result.success).toBe(true);
  });

  it('pasa con galleryFiles con un archivo', () => {
    const result = onboardingStep3Schema.safeParse({
      galleryFiles: [new File([''], 'img1.jpg', { type: 'image/jpeg' })],
    });
    expect(result.success).toBe(true);
  });

  it('pasa con galleryFiles con múltiples archivos', () => {
    const result = onboardingStep3Schema.safeParse({
      galleryFiles: [
        new File([''], 'img1.jpg', { type: 'image/jpeg' }),
        new File([''], 'img2.jpg', { type: 'image/jpeg' }),
        new File([''], 'img3.jpg', { type: 'image/jpeg' }),
      ],
    });
    expect(result.success).toBe(true);
  });

  it('pasa con todos los campos definidos', () => {
    const result = onboardingStep3Schema.safeParse({
      bannerFile: new File([''], 'banner.jpg', { type: 'image/jpeg' }),
      logoFile: new File([''], 'logo.png', { type: 'image/png' }),
      galleryFiles: [
        new File([''], 'img1.jpg', { type: 'image/jpeg' }),
        new File([''], 'img2.jpg', { type: 'image/jpeg' }),
      ],
    });
    expect(result.success).toBe(true);
  });

  it('pasa con galleryFiles undefined', () => {
    const result = onboardingStep3Schema.safeParse({ galleryFiles: undefined });
    expect(result.success).toBe(true);
  });

  it('los campos parseados mantienen los valores originales', () => {
    const file = new File([''], 'logo.png', { type: 'image/png' });
    const result = onboardingStep3Schema.safeParse({ logoFile: file });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoFile).toBe(file);
    }
  });
});
