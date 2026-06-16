/**
 * @file reviews.ts
 * @description Llamadas a la API del gateway para el sistema de reseñas del productor.
 * Sprint 31 HU-04: reemplaza todos los datos mock con llamadas reales a /api/v1/reviews/mine.
 *
 * Endpoints del microservicio usados:
 *   GET  /reviews/mine           — Reseñas de los productos del productor (con filtros)
 *   GET  /reviews/can-review/:id — Verificar elegibilidad de valoración
 *   POST /reviews/:id/respond    — Responder a una reseña
 *   POST /reviews/:id/flag       — Reportar reseña
 *   POST /reviews/:id/helpful    — Marcar como útil
 */

import type { Review, ReviewStats, ReviewsResponse, ReviewFilters } from '@/types/review';
import type { ApiResponse } from './products';
import { gatewayClient, GatewayError } from './client';

// ─── TIPOS DE RESPUESTA DEL BACKEND ──────────────────────────────────────────

interface ApiReviewResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorType: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiReviewFlag {
  id: string;
  reason: string;
  description?: string;
  reportedBy: string;
  createdAt: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface ApiReview {
  id: string;
  type: string;
  productId?: string;
  producerId?: string;
  authorId: string;
  authorName: string;
  authorAvatarId?: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  status: string;
  imageIds?: string[];
  response?: ApiReviewResponse | null;
  flags?: ApiReviewFlag[];
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ApiProducerReviewsResponse {
  data: ApiReview[];
  total: number;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    averageRating: number;
  };
  hasMore: boolean;
}

// ─── MAPPER ───────────────────────────────────────────────────────────────────

function mapApiReview(api: ApiReview): Review {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL ?? '';
  const avatarUrl = api.authorAvatarId
    ? (cdnBase ? `${cdnBase}/${api.authorAvatarId}` : undefined)
    : undefined;

  return {
    id: api.id,
    type: api.productId ? 'product' : 'producer',
    targetId: api.productId ?? api.producerId ?? '',
    targetName: api.product?.name ?? api.productId ?? '(productor)',
    authorId: api.authorId,
    authorName: api.authorName,
    authorAvatar: avatarUrl,
    rating: api.rating as Review['rating'],
    title: api.title,
    content: api.content,
    status: api.status.toLowerCase() as Review['status'],
    helpful: api.helpful,
    notHelpful: api.notHelpful,
    verifiedPurchase: api.verifiedPurchase,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
    images: api.imageIds?.length
      ? api.imageIds.map((id: string) => `${cdnBase}/${id}`)
      : undefined,
    response: api.response
      ? {
          id: api.response.id,
          authorId: api.response.authorId,
          authorName: api.response.authorName,
          authorType: api.response.authorType as 'producer' | 'admin',
          content: api.response.content,
          createdAt: new Date(api.response.createdAt),
          updatedAt: api.response.updatedAt ? new Date(api.response.updatedAt) : undefined,
        }
      : undefined,
    flags: (api.flags ?? []).map((f) => ({
      id: f.id,
      reason: f.reason.toLowerCase() as 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'other',
      description: f.description,
      reportedBy: f.reportedBy,
      createdAt: new Date(f.createdAt),
      resolved: f.resolved,
      resolvedBy: f.resolvedBy,
      resolvedAt: f.resolvedAt ? new Date(f.resolvedAt) : undefined,
    })),
  };
}

// ─── FUNCIONES PÚBLICAS ───────────────────────────────────────────────────────

/**
 * Obtiene las reseñas recibidas por el productor autenticado.
 * Soporta filtros de estado, valoración y búsqueda textual.
 */
export async function fetchReviews(params?: {
  page?: number;
  limit?: number;
  filters?: ReviewFilters;
}): Promise<ApiResponse<ReviewsResponse>> {
  try {
    const { page = 1, limit = 10, filters } = params ?? {};

    const result = await gatewayClient.get<any>('/reviews/mine', {
      params: {
        page,
        limit,
        status: filters?.status?.toUpperCase(),
        rating: filters?.rating,
        search: filters?.search,
        verifiedOnly: filters?.verifiedOnly ? 'true' : undefined,
        hasResponse: filters?.hasResponse ? 'true' : undefined,
        hasImages: filters?.hasImages ? 'true' : undefined,
        dateFrom: filters?.dateFrom ? filters.dateFrom.toISOString() : undefined,
        dateTo: filters?.dateTo ? filters.dateTo.toISOString() : undefined,
      },
    });

    const reviews = result.data.map(mapApiReview);
    const stats = result.stats;

    return {
      data: {
        reviews,
        meta: result.meta,
        stats: {
          total: stats.total,
          pending: stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          flagged: stats.flagged,
          averageRating: stats.averageRating,
          byRating: stats.byRating,
          helpful: stats.helpful ?? 0,
          notHelpful: stats.notHelpful ?? 0,
        },
        hasMore: result.hasMore,
      },
      status: 200,
    };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al cargar reseñas';
    console.error('Error en fetchReviews:', error);
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}


/** Añade una respuesta del productor a una reseña */
export async function addReviewResponse(
  reviewId: string,
  response: { authorId: string; authorName: string; content: string },
): Promise<ApiResponse<Review>> {
  try {
    const result = await gatewayClient.post<ApiReview>(`/reviews/${reviewId}/respond`, {
      content: response.content,
    });
    return { data: mapApiReview(result), status: 200 };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al añadir respuesta';
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}

/** Reporta una reseña inapropiada */
export async function flagReview(
  reviewId: string,
  reason: 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'other',
  description?: string,
): Promise<ApiResponse<Review>> {
  try {
    await gatewayClient.post(`/reviews/${reviewId}/flag`, { reason: reason.toUpperCase(), description });
    // Backend returns no body on flag — refetch not needed for dashboard
    return { data: undefined as unknown as Review, status: 200 };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al reportar reseña';
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}

/** Marca una reseña como útil/no útil */
export async function markReviewHelpful(id: string, isHelpful: boolean): Promise<ApiResponse<Review>> {
  try {
    await gatewayClient.post(`/reviews/${id}/helpful`, { isHelpful });
    return { data: undefined as unknown as Review, status: 200 };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al marcar reseña';
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}

