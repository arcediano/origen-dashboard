/**
 * Tests unitarios para los esquemas Zod de seller.ts
 *
 * Cubre: initialRegistrationSchema, onboardingStep1Schema,
 *        onboardingStep2Schema, onboardingStep4Schema
 */

import { describe, it, expect } from 'vitest';
import {
  initialRegistrationSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep4Schema,
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

// ─── onboardingStep1Schema ────────────────────────────────────────────────────

describe('onboardingStep1Schema', () => {
  const validStep1 = {
    street: 'Calle Mayor',
    number: '15',
    postalCode: '40001',
    city: 'Segovia',
    province: 'Segovia',
    autonomousCommunity: 'Castilla y León',
  };

  it('acepta datos válidos', () => {
    expect(onboardingStep1Schema.safeParse(validStep1).success).toBe(true);
  });

  it('acepta datos con touristicRegionId opcional', () => {
    const result = onboardingStep1Schema.safeParse({
      ...validStep1,
      touristicRegionId: 'region-123',
      touristicRegionName: 'Rutas del Duero',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza código postal con 4 dígitos', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, postalCode: '4000' });
    expect(result.success).toBe(false);
  });

  it('rechaza ciudad con menos de 2 caracteres', () => {
    const result = onboardingStep1Schema.safeParse({ ...validStep1, city: 'A' });
    expect(result.success).toBe(false);
  });
});

// ─── onboardingStep2Schema ────────────────────────────────────────────────────

describe('onboardingStep2Schema', () => {
  const validStep2 = {
    businessStory: 'A'.repeat(200),
    philosophy: 'A'.repeat(100),
    sustainabilityPractices: ['uso_agua_responsable'],
    hasOrganicCertification: false,
    hasDopIgpCertification: false,
  };

  it('acepta datos válidos', () => {
    expect(onboardingStep2Schema.safeParse(validStep2).success).toBe(true);
  });

  it('rechaza historia menor de 200 caracteres', () => {
    const result = onboardingStep2Schema.safeParse({ ...validStep2, businessStory: 'Corta' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.businessStory).toBeDefined();
    }
  });

  it('rechaza filosofía menor de 100 caracteres', () => {
    const result = onboardingStep2Schema.safeParse({ ...validStep2, philosophy: 'Muy corta' });
    expect(result.success).toBe(false);
  });

  it('rechaza sustainabilityPractices vacío', () => {
    const result = onboardingStep2Schema.safeParse({ ...validStep2, sustainabilityPractices: [] });
    expect(result.success).toBe(false);
  });

  it('acepta con certificationDetails opcional', () => {
    const result = onboardingStep2Schema.safeParse({
      ...validStep2,
      hasOrganicCertification: true,
      certificationDetails: 'Certificado CAAE nº 12345',
    });
    expect(result.success).toBe(true);
  });
});

// ─── onboardingStep4Schema ────────────────────────────────────────────────────

describe('onboardingStep4Schema', () => {
  const validStep4 = {
    monthlyCapacity: 500,
    capacityUnit: 'kg' as const,
    deliveryRadius: 50,
    availableDeliveryDays: ['lunes', 'miercoles', 'viernes'],
  };

  it('acepta datos válidos', () => {
    expect(onboardingStep4Schema.safeParse(validStep4).success).toBe(true);
  });

  it('rechaza capacidad mensual de 0', () => {
    const result = onboardingStep4Schema.safeParse({ ...validStep4, monthlyCapacity: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza radio de entrega superior a 200', () => {
    const result = onboardingStep4Schema.safeParse({ ...validStep4, deliveryRadius: 201 });
    expect(result.success).toBe(false);
  });

  it('rechaza días de entrega vacíos', () => {
    const result = onboardingStep4Schema.safeParse({ ...validStep4, availableDeliveryDays: [] });
    expect(result.success).toBe(false);
  });

  it.each(['kg', 'litros', 'unidades'] as const)('acepta capacityUnit "%s"', (unit) => {
    const result = onboardingStep4Schema.safeParse({ ...validStep4, capacityUnit: unit });
    expect(result.success).toBe(true);
  });

  it('rechaza capacityUnit fuera del enum', () => {
    const result = onboardingStep4Schema.safeParse({ ...validStep4, capacityUnit: 'toneladas' });
    expect(result.success).toBe(false);
  });
});
