/**
 * @file review.ts
 * @description Tipos para el sistema de reseñas
 * 
 * FUNCIONALIDADES:
 * - Reseñas de productos
 * - Reseñas de productores
 * - Respuestas a reseñas
 * - Reportes de reseñas inapropiadas
 */

export type ReviewType = 'product' | 'producer';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  type: ReviewType;
  targetId: string;        // ID del producto o productor
  targetName: string;       // Nombre del producto o productor
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: ReviewRating;
  title: string;
  content: string;
  response?: ReviewResponse;
  status: ReviewStatus;
  flags?: ReviewFlag[];
  helpful: number;          // Votos de útil
  notHelpful: number;       // Votos de no útil
  createdAt: Date;
  updatedAt: Date;
  verifiedPurchase: boolean; // Si es de una compra verificada
  images?: string[];         // Imágenes adjuntas
}

export interface ReviewResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorType: 'producer' | 'admin';
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewFlag {
  id: string;
  reason: 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'other';
  description?: string;
  reportedBy: string;
  createdAt: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  averageRating: number;
  byRating: Record<ReviewRating, number>;
  helpful: number;
  notHelpful: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  meta: { total: number; page: number; limit: number };
  stats: ReviewStats;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  rating?: ReviewRating;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  verifiedOnly?: boolean;
  hasResponse?: boolean;
  hasImages?: boolean;
}