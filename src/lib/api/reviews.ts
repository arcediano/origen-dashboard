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
    targetName: api.product?.name ?? api.productId ?? '',
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
    images: api.imageIds?.length ? api.imageIds : undefined,
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

    const result = await gatewayClient.get<ApiProducerReviewsResponse>('/reviews/mine', {
      params: {
        page,
        limit,
        status: filters?.status?.toUpperCase(),
        rating: filters?.rating,
        search: filters?.search,
      },
    });

    const reviews = result.data.map(mapApiReview);

    // Apply client-side filters not supported by the endpoint
    const filtered = reviews.filter((r) => {
      if (filters?.verifiedOnly && !r.verifiedPurchase) return false;
      if (filters?.hasResponse && !r.response) return false;
      if (filters?.hasImages && (!r.images || r.images.length === 0)) return false;
      if (filters?.dateFrom && r.createdAt < filters.dateFrom) return false;
      if (filters?.dateTo && r.createdAt > filters.dateTo) return false;
      return true;
    });

    const stats = result.stats;
    const byRating: ReviewStats['byRating'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of filtered) {
      const rating = r.rating as keyof typeof byRating;
      byRating[rating] = (byRating[rating] ?? 0) + 1;
    }

    return {
      data: {
        reviews: filtered,
        stats: {
          total: stats.total,
          pending: stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          flagged: stats.flagged,
          averageRating: stats.averageRating,
          byRating,
          helpful: filtered.reduce((s, r) => s + r.helpful, 0),
          notHelpful: filtered.reduce((s, r) => s + r.notHelpful, 0),
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

/** Alias: reseñas con status pending */
export async function fetchPendingReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<ReviewsResponse>> {
  return fetchReviews({ ...params, filters: { status: 'pending' } });
}

/** Reseñas por tipo — el productor solo tiene producto reviews */
export async function fetchReviewsByType(
  type: 'product' | 'producer',
  _targetId?: string,
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<ReviewsResponse>> {
  return fetchReviews({ ...params, filters: { type } });
}

/** Aprueba una reseña (acción de admin — no disponible para el productor) */
export async function approveReview(_id: string): Promise<ApiResponse<Review>> {
  return { error: 'Solo el administrador puede aprobar reseñas', status: 403 };
}

/** Rechaza una reseña (acción de admin) */
export async function rejectReview(_id: string, _reason?: string): Promise<ApiResponse<Review>> {
  return { error: 'Solo el administrador puede rechazar reseñas', status: 403 };
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
export async function markReviewHelpful(id: string, _helpful: boolean): Promise<ApiResponse<Review>> {
  try {
    await gatewayClient.post(`/reviews/${id}/helpful`);
    return { data: undefined as unknown as Review, status: 200 };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al marcar reseña';
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}

/** Elimina una reseña (acción de admin — no disponible para el productor) */
export async function deleteReview(_id: string): Promise<ApiResponse<null>> {
  return { error: 'Solo el administrador puede eliminar reseñas', status: 403 };
}

/** Obtiene solo las estadísticas de reseñas del productor */
export async function fetchReviewStats(): Promise<ApiResponse<ReviewStats>> {
  try {
    const result = await gatewayClient.get<ApiProducerReviewsResponse>('/reviews/mine', {
      params: { page: 1, limit: 1 },
    });

    const byRating: ReviewStats['byRating'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    return {
      data: {
        ...result.stats,
        byRating,
        helpful: 0,
        notHelpful: 0,
      },
      status: 200,
    };
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Error al obtener estadísticas';
    return { error: msg, status: error instanceof GatewayError ? error.status : 500 };
  }
}
