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
  street: z.string().min(3, 'Introduce el nombre de la vía'),
  streetNumber: z.string().min(1, 'Introduce el número'),
  streetComplement: z.string().optional(),
  municipio: z.string().min(2, 'Introduce el municipio'),
  postalCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  province: z.string().min(2, 'Selecciona una provincia'),
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

export type InitialRegistrationFormData = z.infer<typeof initialRegistrationSchema>;
