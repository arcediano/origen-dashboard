/**
 * Tests unitarios para los esquemas Zod de seller.ts
 *
 * Cubre: initialRegistrationSchema
 */

import { describe, it, expect } from 'vitest';
import {
  initialRegistrationSchema,
} from '@/lib/validations/seller';
import { validRegistrationData } from '../../factories/user.factory';

// ─── initialRegistrationSchema ────────────────────────────────────────────────

describe('initialRegistrationSchema', () => {
  it('acepta datos válidos y completos', () => {
    const result = initialRegistrationSchema.safeParse(validRegistrationData);
    expect(result.success).toBe(true);
  });

  it('normaliza el email a minúsculas', () => {
    const result = initialRegistrationSchema.safeParse({
      ...validRegistrationData,
      email: 'Maria.GARCIA@Test.ES',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('maria.garcia@test.es');
    }
  });

  // contactName
  describe('contactName', () => {
    it('rechaza si tiene menos de 2 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, contactName: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.contactName).toBeDefined();
      }
    });

    it('rechaza si supera los 50 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        contactName: 'A'.repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  // email
  describe('email', () => {
    it('rechaza email sin @', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, email: 'notanemail' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('rechaza email vacío', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, email: '' });
      expect(result.success).toBe(false);
    });
  });

  // phone
  describe('phone', () => {
    it('acepta número español sin prefijo', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, phone: '612345678' });
      expect(result.success).toBe(true);
    });

    it('acepta número español con +34', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, phone: '+34612345678' });
      expect(result.success).toBe(true);
    });

    it('rechaza número de otro país', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, phone: '+1234567890' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it('rechaza número de 8 dígitos (faltan dígitos)', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, phone: '61234567' });
      expect(result.success).toBe(false);
    });

    it('rechaza número que empieza por 5 (no es móvil/fijo español)', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, phone: '512345678' });
      expect(result.success).toBe(false);
    });
  });

  // password
  describe('password', () => {
    it('rechaza contraseña de menos de 8 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, password: 'Ab1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });

    it('rechaza contraseña sin mayúsculas', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        password: 'password1',
        confirmPassword: 'password1',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza contraseña sin dígitos', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        password: 'PasswordSinNumero',
        confirmPassword: 'PasswordSinNumero',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza contraseña sin minúsculas', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        password: 'PASSWORD1',
        confirmPassword: 'PASSWORD1',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza contraseñas que no coinciden', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        password: 'Password1',
        confirmPassword: 'Password2',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
      }
    });

    it('acepta contraseña que cumple todos los requisitos', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        password: 'SecurePass42',
        confirmPassword: 'SecurePass42',
      });
      expect(result.success).toBe(true);
    });
  });

  // postalCode
  describe('postalCode', () => {
    it('acepta código postal de 5 dígitos', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, postalCode: '28001' });
      expect(result.success).toBe(true);
    });

    it('rechaza código postal de 4 dígitos', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, postalCode: '2800' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.postalCode).toBeDefined();
      }
    });

    it('rechaza código postal con letras', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, postalCode: '2800A' });
      expect(result.success).toBe(false);
    });
  });

  // businessName
  describe('businessName', () => {
    it('rechaza nombre de negocio menor de 3 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, businessName: 'AB' });
      expect(result.success).toBe(false);
    });

    it('rechaza nombre de negocio superior a 200 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        businessName: 'A'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  // businessType
  describe('businessType', () => {
    it('acepta individual', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, businessType: 'individual' });
      expect(result.success).toBe(true);
    });

    it('acepta company', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, businessType: 'company' });
      expect(result.success).toBe(true);
    });

    it('rechaza valor fuera del enum', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, businessType: 'freelance' });
      expect(result.success).toBe(false);
    });
  });

  // producerCategory
  describe('producerCategory', () => {
    const validCategories = ['agricola', 'ganadero', 'artesano', 'apicultor', 'viticultor', 'especializado'];

    it.each(validCategories)('acepta la categoría "%s"', (category) => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        producerCategory: category,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza categoría no definida', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        producerCategory: 'panadero',
      });
      expect(result.success).toBe(false);
    });
  });

  // whyOrigin
  describe('whyOrigin', () => {
    it('rechaza texto inferior a 50 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        whyOrigin: 'Texto corto',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.whyOrigin).toBeDefined();
      }
    });

    it('rechaza texto superior a 300 caracteres', () => {
      const result = initialRegistrationSchema.safeParse({
        ...validRegistrationData,
        whyOrigin: 'A'.repeat(301),
      });
      expect(result.success).toBe(false);
    });
  });

  // checkboxes
  describe('acceptsTerms y acceptsPrivacy', () => {
    it('rechaza cuando acceptsTerms es false', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, acceptsTerms: false });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.acceptsTerms).toBeDefined();
      }
    });

    it('rechaza cuando acceptsPrivacy es false', () => {
      const result = initialRegistrationSchema.safeParse({ ...validRegistrationData, acceptsPrivacy: false });
      expect(result.success).toBe(false);
    });
  });
});
