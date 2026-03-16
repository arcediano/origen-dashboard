/**
 * @file mock-producer.ts
 * @description Datos mock del productor
 */

import type { Producer } from '../types';

export const MOCK_PRODUCER: Producer = {
  id: 'prod_1',
  businessName: 'Quesería Artesana Valle del Tajo',
  tagline: 'El auténtico sabor de la tradición manchega desde 1985',
  city: 'Talavera de la Reina',
  province: 'Toledo',
  foundedYear: 1985,
  teamSize: '6-10',
  certifications: [
    { id: 'cert_1', name: 'Agricultura Ecológica', verified: true },
    { id: 'cert_2', name: 'DOP Queso Manchego', verified: true },
  ],
  verified: true,
  logoUrl: '',
};

export const getProducerInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export const getYearsOfExperience = (foundedYear: number): number => {
  return new Date().getFullYear() - foundedYear;
};
