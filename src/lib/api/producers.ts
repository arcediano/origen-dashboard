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

/**
 * Obtiene el perfil del productor autenticado.
 * GET /api/v1/producers/me
 */
export async function fetchMyProfile(): Promise<ApiResponse<ProducerProfile>> {
  try {
    const data = await gatewayClient.get<ProducerProfile>('/producers/me');
    return { data, status: 200 };
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
