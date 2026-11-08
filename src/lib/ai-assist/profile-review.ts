/**
 * @file profile-review.ts
 * @description Tipos de "Mejorar con IA" del perfil comercial ("Mi negocio",
 * petición del humano, 2026-11-08): revisión de texto campo a campo, nunca
 * imágenes ni recreación completa del perfil. Misma bolsa de créditos que la
 * creación de producto asistida.
 */

export type ProfileReviewFieldKey =
  | 'tagline'
  | 'description'
  | 'productionPhilosophy'
  | 'animalWelfare';

export interface ProfileReviewFields {
  tagline?: string;
  description?: string;
  productionPhilosophy?: string;
  animalWelfare?: string;
}

export interface ProfileReviewSuggestion {
  field: ProfileReviewFieldKey;
  current: string;
  suggested: string;
  reason: string;
}

export interface ProfileReviewResult {
  suggestions: ProfileReviewSuggestion[];
}

export const PROFILE_REVIEW_FIELD_LABELS: Record<ProfileReviewFieldKey, string> = {
  tagline: 'Eslogan',
  description: 'Historia',
  productionPhilosophy: 'Filosofía de producción',
  animalWelfare: 'Bienestar animal',
};
