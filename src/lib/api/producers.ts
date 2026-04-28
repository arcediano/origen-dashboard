/**
 * @file producers.ts
 * @description Capa de acceso a datos del perfil del productor autenticado.
 *
 * Endpoint:
 *   GET /api/v1/producers/me — perfil del productor autenticado
 */

import { gatewayClient, GatewayError } from './client';
import type { ApiResponse } from './products';
import type { ProducerProfile } from '@/components/features/dashboard/types';

type ProducerProfileApi = Omit<ProducerProfile, 'profileCompletenessPercent' | 'profileCompletenessRatio' | 'profileCompletenessMeta'> & {
  profileCompletenessScore?: number;
  profileCompletenessRatio?: number;
  profileCompletenessPercent?: number;
  profileCompletenessMeta?: ProducerProfile['profileCompletenessMeta'];
};

function normalizeProducerProfile(data: ProducerProfileApi): ProducerProfile {
  const ratio = data.profileCompletenessRatio ?? data.profileCompletenessScore ?? 0;
  const percent = data.profileCompletenessPercent ?? Math.round(Math.min(1, Math.max(0, ratio)) * 100);

  return {
    ...data,
    profileCompletenessScore: data.profileCompletenessScore,
    profileCompletenessRatio: Math.min(1, Math.max(0, ratio)),
    profileCompletenessPercent: Math.min(100, Math.max(0, percent)),
    profileCompletenessMeta: data.profileCompletenessMeta ?? {
      completedSteps: 0,
      totalSteps: 6,
      version: 'legacy',
    },
  };
}

export interface ProfileViewStats {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface ProducerProfileVisual {
  logoUrl: string | null;
  bannerUrl: string | null;
  logoKey: string | null;
  bannerKey: string | null;
}

export interface ProducerProfileData {
  fiscal: {
    businessName?: string;
    legalName?: string;
    taxId?: string;
    businessPhone?: string;
    categories?: string[];
    entityType?: string;
    legalRepresentativeName?: string;
    billingAddress?: {
      street?: string;
      streetNumber?: string;
      streetComplement?: string | null;
      city?: string;
      province?: string;
      postalCode?: string;
    } | null;
  } | null;
  location: {
    street?: string;
    streetNumber?: string;
    streetComplement?: string | null;
    city?: string;
    province?: string;
    postalCode?: string;
    foundedYear?: number | null;
    teamSize?: string | null;
  } | null;
  story: {
    businessName?: string;
    tagline?: string | null;
    description?: string | null;
    productionPhilosophy?: string | null;
    values?: string[];
    website?: string | null;
    instagramHandle?: string | null;
  } | null;
  visual: ProducerProfileVisual | null;
  payment?: {
    stripeConnected?: boolean;
    stripeAccountId?: string | null;
    acceptedTermsAt?: string | null;
  } | null;
}

export interface ProducerProfileResponse {
  success: boolean;
  data: ProducerProfileData;
}

export interface UpdateProducerProfilePayload {
  businessName?: string;
  legalName?: string;
  taxId?: string;
  entityType?: string;
  legalRepresentativeName?: string;
  businessPhone?: string;
  street?: string;
  streetNumber?: string;
  streetComplement?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  foundedYear?: number;
  teamSize?: string;
  billingAddressSameAsProduction?: boolean;
  billingAddress?: {
    street: string;
    streetNumber: string;
    streetComplement?: string;
    city: string;
    province: string;
    postalCode: string;
  };
  tagline?: string;
  description?: string;
  productionPhilosophy?: string;
  values?: string[];
  website?: string;
  instagramHandle?: string;
  categories?: string[];
  logoKey?: string;
  bannerKey?: string;
}

/**
 * Obtiene estadísticas de visitas al perfil público del productor autenticado.
 * GET /api/v1/producers/me/profile-views
 */
export async function fetchProfileViewStats(): Promise<ApiResponse<ProfileViewStats>> {
  try {
    const data = await gatewayClient.get<ProfileViewStats>('/producers/me/profile-views');
    return { data, status: 200 };
  } catch (err) {
    console.error('[producers] fetchProfileViewStats error');
    const message =
      err instanceof GatewayError ? err.message : 'Error al cargar visitas al perfil';
    return {
      error: message,
      status: err instanceof GatewayError ? err.status : 500,
    };
  }
}

/**
 * Obtiene el perfil del productor autenticado.
 * GET /api/v1/producers/me
 */
export async function fetchMyProfile(): Promise<ApiResponse<ProducerProfile>> {
  try {
    const data = await gatewayClient.get<ProducerProfileApi>('/producers/me');
    return { data: normalizeProducerProfile(data), status: 200 };
  } catch (err) {
    console.error('[producers] fetchMyProfile error');
    const message =
      err instanceof GatewayError
        ? err.message
        : 'Error al cargar el perfil del productor';
    return {
      error: message,
      status: err instanceof GatewayError ? err.status : 500,
    };
  }
}

export async function getProducerProfile(): Promise<ProducerProfileResponse> {
  return gatewayClient.get('/producers/profile');
}

export async function updateProducerProfile(
  payload: UpdateProducerProfilePayload,
): Promise<ProducerProfileResponse> {
  return gatewayClient.patch('/producers/profile', payload);
}
