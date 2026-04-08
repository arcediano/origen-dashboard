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

/**
 * Obtiene el perfil del productor autenticado.
 * GET /api/v1/producers/me
 */
export async function fetchMyProfile(): Promise<ApiResponse<ProducerProfile>> {
  try {
    const data = await gatewayClient.get<ProducerProfileApi>('/producers/me');
    return { data: normalizeProducerProfile(data), status: 200 };
  } catch (err) {
    console.error('[producers] fetchMyProfile', err);
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
