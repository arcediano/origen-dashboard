/**
 * Validaciones con Zod para formularios de vendedor
 * @module lib/validations/seller
 */

import { z } from 'zod';

/** Validación del formulario de registro inicial */
export const initialRegistrationSchema = z.object({
  contactName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  contactSurname: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  phone: z.string().regex(/^(\+34|0034|34)?[6789]\d{8}$/, 'Teléfono español inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  businessName: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  businessType: z.enum(['individual', 'company']),
  province: z.string().min(2, 'Selecciona una provincia'),
  municipio: z.string().min(2, 'Introduce el municipio'),
  postalCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  producerCategory: z.enum(['agricola', 'ganadero', 'artesano', 'apicultor', 'viticultor', 'especializado']),
  whyOrigin: z.string()
    .min(50, 'Cuéntanos un poco más (mínimo 50 caracteres)')
    .max(300, 'Máximo 300 caracteres'),
  acceptsTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
  acceptsPrivacy: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar la política de privacidad',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/** Paso 1: Ubicación y región turística */
export const onboardingStep1Schema = z.object({
  street: z.string().min(3, 'Introduce tu calle'),
  number: z.string().min(1, 'Introduce el número'),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  city: z.string().min(2, 'Introduce tu ciudad'),
  province: z.string().min(2, 'Selecciona tu provincia'),
  autonomousCommunity: z.string().min(2, 'Selecciona tu comunidad autónoma'),
  touristicRegionId: z.string().optional(),
  touristicRegionName: z.string().optional(),
});

/** Paso 2: Historia y valores */
export const onboardingStep2Schema = z.object({
  businessStory: z.string().min(200, 'Cuéntanos más sobre tu historia (mínimo 200 caracteres)').max(1000),
  philosophy: z.string().min(100, 'Describe tu filosofía (mínimo 100 caracteres)').max(500),
  sustainabilityPractices: z.array(z.string()).min(1, 'Selecciona al menos una práctica'),
  hasOrganicCertification: z.boolean(),
  hasDopIgpCertification: z.boolean(),
  certificationDetails: z.string().optional(),
});

/** Paso 3: Perfil visual */
export const onboardingStep3Schema = z.object({
  bannerFile: z.any().optional(),
  logoFile: z.any().optional(),
  galleryFiles: z.array(z.any()).optional(),
});

/** Paso 4: Capacidad y entregas */
export const onboardingStep4Schema = z.object({
  monthlyCapacity: z.number().min(1, 'Introduce tu capacidad mensual'),
  capacityUnit: z.enum(['kg', 'litros', 'unidades']),
  deliveryRadius: z.number().min(1, 'Introduce tu radio de entrega').max(200),
  availableDeliveryDays: z.array(z.string()).min(1, 'Selecciona al menos un día'),
  workingHours: z.string().optional(),
});

export type InitialRegistrationFormData = z.infer<typeof initialRegistrationSchema>;
export type OnboardingStep1FormData = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2FormData = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep4FormData = z.infer<typeof onboardingStep4Schema>;
