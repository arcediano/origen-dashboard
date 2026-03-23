/**
 * Factories para datos de usuario/auth en tests.
 */

export interface MockAuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PRODUCER' | 'CUSTOMER';
  producerCode: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function buildProducerUser(overrides: Partial<MockAuthUser> = {}): MockAuthUser {
  return {
    id: 42,
    email: 'productor@test.es',
    firstName: 'Test',
    lastName: 'Productor',
    role: 'PRODUCER',
    producerCode: 'PROD-042',
    onboardingCompleted: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildNewProducerUser(overrides: Partial<MockAuthUser> = {}): MockAuthUser {
  return buildProducerUser({
    producerCode: null,
    onboardingCompleted: false,
    ...overrides,
  });
}

export function buildAdminUser(overrides: Partial<MockAuthUser> = {}): MockAuthUser {
  return {
    id: 1,
    email: 'admin@origen.es',
    firstName: 'Admin',
    lastName: 'Origen',
    role: 'ADMIN',
    producerCode: null,
    onboardingCompleted: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Datos válidos para el formulario de login */
export const validLoginCredentials = {
  email: 'productor@test.es',
  password: 'Password1',
};

/** Datos válidos para el formulario de registro */
export const validRegistrationData = {
  contactName: 'María',
  contactSurname: 'García López',
  email: 'maria.garcia@test.es',
  phone: '612345678',
  password: 'Password1',
  confirmPassword: 'Password1',
  businessName: 'Quesos Artesanos García',
  businessType: 'individual' as const,
  street: 'Calle Mayor',
  streetNumber: '12',
  streetComplement: 'Local A',
  municipio: 'Segovia',
  postalCode: '40001',
  province: 'Segovia',
  producerCategory: 'artesano' as const,
  whyOrigin: 'Quiero vender mis productos artesanales directamente a consumidores que valoran la calidad y la tradición local.',
  acceptsTerms: true as const,
  acceptsPrivacy: true as const,
};
