/**
 * @file campaigns.ts
 * @description API client para gestión de campañas publicitarias del productor.
 * Endpoints: GET/POST /campaigns — seller campaigns CRUD
 */

import { gatewayClient, GatewayError } from './client';
import type { ApiResponse } from './products';

export type CampaignType = 'CPD' | 'CPC';
export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'REJECTED';

export interface Campaign {
  id: string;
  type: CampaignType;
  status: CampaignStatus;
  productSlug: string;
  placement: string;
  headline: string | null;
  tagline: string | null;
  ctaText: string | null;
  startsAt: string | null;
  endsAt: string | null;
  cpcBid: number | null;
  dailyBudget: number | null;
  remainingBudget: number | null;
  pricePerDay: number | null;
  producerCode: string | null;
  categorySlug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignList {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateCampaignPayload {
  type: CampaignType;
  productSlug: string;
  placement: string;
  // CPD
  pricePerDay?: number;
  startsAt?: string;
  endsAt?: string;
  categorySlug?: string;
  producerCode?: string;
  // CPC
  cpcBid?: number;
  dailyBudget?: number;
  // Creative
  headline?: string;
  tagline?: string;
  ctaText?: string;
}

export interface CampaignMetricDay {
  date: string;
  clicks: number;
  estimatedImpressions: number;
  spend: number;
}

export interface CampaignMetrics {
  campaignId: string;
  type: CampaignType;
  last7Days: CampaignMetricDay[];
  totals: {
    clicks: number;
    estimatedImpressions: number;
    spend: number;
  };
}

export async function fetchMyCampaigns(
  params: { page?: number; limit?: number; type?: CampaignType; status?: CampaignStatus } = {},
): Promise<ApiResponse<CampaignList>> {
  try {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    const suffix = qs.toString();
    const result = await gatewayClient.get<{ success: boolean; data: CampaignList }>(
      `/campaigns/seller${suffix ? `?${suffix}` : ''}`,
    );
    return { data: result.data, status: 200 };
  } catch (err) {
    const message = err instanceof GatewayError ? err.message : 'Error al cargar campañas';
    return { error: message, status: err instanceof GatewayError ? err.status : 500 };
  }
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<ApiResponse<Campaign>> {
  try {
    const result = await gatewayClient.post<{ success: boolean; data: Campaign }>(
      '/campaigns',
      payload,
    );
    return { data: result.data, status: 201 };
  } catch (err) {
    const message = err instanceof GatewayError ? err.message : 'Error al crear campaña';
    return { error: message, status: err instanceof GatewayError ? err.status : 500 };
  }
}

export async function fetchCampaignMetrics(id: string): Promise<ApiResponse<CampaignMetrics>> {
  try {
    const result = await gatewayClient.get<{ success: boolean; data: CampaignMetrics }>(
      `/campaigns/${id}/metrics`,
    );
    return { data: result.data, status: 200 };
  } catch (err) {
    const message = err instanceof GatewayError ? err.message : 'Error al cargar métricas';
    return { error: message, status: err instanceof GatewayError ? err.status : 500 };
  }
}

export async function deleteCampaign(id: string): Promise<ApiResponse<void>> {
  try {
    await gatewayClient.delete(`/campaigns/${id}`);
    return { status: 204 };
  } catch (err) {
    const message = err instanceof GatewayError ? err.message : 'Error al eliminar campaña';
    return { error: message, status: err instanceof GatewayError ? err.status : 500 };
  }
}
