/**
 * @file profile-review.ts
 * @description Tipos de "Mejorar con IA" del perfil comercial ("Mi negocio",
 * petición del humano, 2026-11-08, ampliado a fotos 2026-11-09): revisión de
 * texto campo a campo y, opcionalmente, de hasta 3 fotos (la primera de cada
 * galería: equipo, entorno, proceso) -- nunca recreación completa del
 * perfil. Misma bolsa de créditos que la creación de producto asistida, y la
 * revisión completa (texto + fotos) cuesta 1 crédito en total, nunca 1 por
 * foto.
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

export type ProfilePhotoCollection = 'galleryImages' | 'locationImages' | 'teamPhotos';

/** Una foto candidata a mejorar: la primera foto activa y ya guardada de una galería no vacía. */
export interface ProfilePhotoCandidate {
  collection: ProfilePhotoCollection;
  /** Id de la imagen en la galería del formulario (para aplicar la sugerencia con `replaceWithFile`). */
  itemId: string;
  key: string;
  url: string;
}

export interface ProfilePhotoSuggestion {
  collection: ProfilePhotoCollection;
  key: string;
  /** Foto mejorada, como data URL lista para previsualizar y, si se acepta, convertir a `File`. */
  after: string;
}

export interface ProfileReviewResult {
  suggestions: ProfileReviewSuggestion[];
  photoSuggestions: ProfilePhotoSuggestion[];
}

export const PROFILE_REVIEW_FIELD_LABELS: Record<ProfileReviewFieldKey, string> = {
  tagline: 'Eslogan',
  description: 'Historia',
  productionPhilosophy: 'Filosofía de producción',
  animalWelfare: 'Bienestar animal',
};

export const PROFILE_PHOTO_COLLECTION_LABELS: Record<ProfilePhotoCollection, string> = {
  galleryImages: 'Proceso de elaboración',
  locationImages: 'Entorno y obrador',
  teamPhotos: 'Equipo',
};
