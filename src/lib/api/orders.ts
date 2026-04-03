/**
 * @file orders.ts
 * @description Llamadas a la API real para el sistema de pedidos del productor.
 * Sprint 16: reemplaza el mock en-memoria por fetch real al gateway.
 *
 * Endpoints reales (gateway → orders-service):
 *   GET   /api/v1/orders/seller          — lista pedidos del productor (paginado)
 *   GET   /api/v1/orders/seller/:id      — detalle de pedido
 *   PATCH /api/v1/orders/seller/:id/status — actualizar estado de pedido
 */

import { gatewayClient, GatewayError } from './client';
import type { Order, OrderStatus, OrderStats, OrdersResponse, OrderFilters } from '@/types/order';
import type { ApiResponse } from './products';

// ─── Tipos internos (forma real del backend) ─────────────────────────────────

interface BackendProductImage {
  id: string;
  url: string;
  alt: string;
}

interface BackendOrderItem {
  id: string;
  productId: string;
  productSlug?: string;
  productName: string;
  productImage?: BackendProductImage | null;
  sellerName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface BackendShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface BackendOrder {
  id: string;
  orderNumber: string;
  status: string;
  shippingAddress: BackendShippingAddress | null;
  paymentMethod: string;
  couponCode?: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  items: BackendOrderItem[];
}

interface BackendSellerListResponse {
  items: BackendOrder[];
  total: number;
  page: number;
  limit: number;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapPaymentMethod(method: string): Order['payment']['method'] {
  switch (method?.toLowerCase()) {
    case 'card':
    case 'tarjeta':
      return 'card';
    case 'transfer':
    case 'transferencia':
    case 'bank_transfer':
      return 'transfer';
    case 'paypal':
      return 'paypal';
    case 'cash':
    case 'efectivo':
      return 'cash';
    default:
      return 'other';
  }
}

function mapShippingStatus(orderStatus: string): Order['shipping']['status'] {
  switch (orderStatus) {
    case 'pending':
    case 'processing':
      return 'pending';
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
    case 'refunded':
      return 'returned';
    default:
      return 'pending';
  }
}

function mapOrderStatus(raw: string): OrderStatus {
  const valid: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];
  return valid.includes(raw as OrderStatus) ? (raw as OrderStatus) : 'pending';
}

function mapBackendOrder(o: BackendOrder): Order {
  const status = mapOrderStatus(o.status);
  const addr = o.shippingAddress ?? {};

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: '',
    customerName: addr.fullName ?? 'Cliente',
    customerEmail: addr.email ?? '',
    customerPhone: addr.phone,

    items: o.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage?.url ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.subtotal,
    })),

    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    discount: o.discountAmount > 0 ? o.discountAmount : undefined,
    total: o.total,

    status,

    payment: {
      method: mapPaymentMethod(o.paymentMethod),
      status: status === 'pending' ? 'pending' : 'paid',
      amount: o.total,
    },

    shipping: {
      method: '',
      status: mapShippingStatus(o.status),
      cost: o.shippingCost,
      estimatedDate: o.estimatedDelivery ? new Date(o.estimatedDelivery) : undefined,
      address: {
        fullName: addr.fullName ?? '',
        addressLine1: addr.addressLine1 ?? '',
        addressLine2: addr.addressLine2,
        city: addr.city ?? '',
        state: addr.state,
        postalCode: addr.postalCode ?? '',
        country: addr.country ?? 'España',
        phone: addr.phone,
        email: addr.email,
      },
    },

    // El backend no expone timeline para el vendedor
    timeline: [],

    createdAt: new Date(o.createdAt),
    updatedAt: new Date(o.updatedAt),
  };
}

function computeStats(orders: Order[]): OrderStats {
  const delivered = orders.filter((o) => o.status === 'delivered');
  const totalRevenue = delivered.reduce((acc, o) => acc + o.total, 0);
  const today = new Date().toDateString();

  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: delivered.length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    refunded: orders.filter((o) => o.status === 'refunded').length,
    totalRevenue,
    averageOrderValue: delivered.length > 0 ? totalRevenue / delivered.length : 0,
    todayOrders: orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today,
    ).length,
    todayRevenue: orders
      .filter(
        (o) =>
          o.status === 'delivered' &&
          new Date(o.createdAt).toDateString() === today,
      )
      .reduce((acc, o) => acc + o.total, 0),
  };
}

// ─── Params públicos ──────────────────────────────────────────────────────────

export interface SellerOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene los pedidos del productor autenticado (paginado).
 * GET /api/v1/orders/seller
 */
export async function fetchSellerOrders(
  params?: SellerOrdersParams,
): Promise<ApiResponse<{ orders: Order[]; total: number; page: number; limit: number }>> {
  try {
    const res = await gatewayClient.get<BackendSellerListResponse>('/orders/seller', {
      params: {
        ...(params?.page !== undefined ? { page: params.page } : {}),
        ...(params?.limit !== undefined ? { limit: params.limit } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
    });

    const orders = (res.items ?? []).map(mapBackendOrder);

    return {
      data: {
        orders,
        total: res.total,
        page: res.page,
        limit: res.limit,
      },
      status: 200,
    };
  } catch (err) {
    console.error('[orders] fetchSellerOrders', err);
    const message =
      err instanceof GatewayError ? err.message : 'Error al cargar pedidos';
    return {
      error: message,
      status: err instanceof GatewayError ? err.status : 500,
    };
  }
}

/**
 * Obtiene el detalle de un pedido del productor por ID.
 * GET /api/v1/orders/seller/:id
 */
export async function fetchSellerOrderById(
  id: string,
): Promise<ApiResponse<Order>> {
  try {
    const res = await gatewayClient.get<BackendOrder>(`/orders/seller/${id}`);
    return { data: mapBackendOrder(res), status: 200 };
  } catch (err) {
    console.error('[orders] fetchSellerOrderById', err);
    if (err instanceof GatewayError) {
      if (err.status === 404) {
        return { error: 'Pedido no encontrado', status: 404 };
      }
      if (err.status === 403) {
        return { error: 'Acceso denegado al pedido', status: 403 };
      }
      return { error: err.message, status: err.status };
    }
    return { error: 'Error al cargar el pedido', status: 500 };
  }
}

/**
 * Obtiene todos los pedidos con filtros y paginación.
 * Delega a fetchSellerOrders.
 */
export async function fetchOrders(params?: {
  page?: number;
  limit?: number;
  filters?: OrderFilters;
}): Promise<ApiResponse<OrdersResponse>> {
  try {
    const result = await fetchSellerOrders({
      page: params?.page,
      limit: params?.limit,
      status: params?.filters?.status,
      search: params?.filters?.search,
    });

    if (result.error || !result.data) {
      return {
        error: result.error ?? 'Error al cargar pedidos',
        status: result.status,
      };
    }

    const { orders, total, page, limit } = result.data;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      data: {
        orders,
        stats: computeStats(orders),
        total,
        page,
        limit,
        totalPages,
      },
      status: 200,
    };
  } catch (err) {
    console.error('[orders] fetchOrders', err);
    return { error: 'Error al cargar pedidos', status: 500 };
  }
}

/**
 * Obtiene un pedido por ID.
 * Delega a fetchSellerOrderById.
 */
export async function fetchOrderById(id: string): Promise<ApiResponse<Order>> {
  return fetchSellerOrderById(id);
}

/**
 * Actualiza el estado de un pedido del productor.
 * PATCH /api/v1/orders/seller/:id/status
 */
export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  comment?: string,
): Promise<ApiResponse<Order>> {
  try {
    const res = await gatewayClient.patch<BackendOrder>(
      `/orders/seller/${id}/status`,
      { status, ...(comment ? { comment } : {}) },
    );
    return { data: mapBackendOrder(res), status: 200 };
  } catch (err) {
    console.error('[orders] updateOrderStatus', err);
    if (err instanceof GatewayError) {
      if (err.status === 404) {
        return { error: 'Pedido no encontrado', status: 404 };
      }
      return { error: err.message, status: err.status };
    }
    return { error: 'Error al actualizar el pedido', status: 500 };
  }
}

/**
 * Obtiene estadísticas de pedidos.
 * Computa las estadísticas desde la primera página de la API (hasta 50 pedidos).
 */
export async function fetchOrderStats(): Promise<ApiResponse<OrderStats>> {
  try {
    const result = await fetchSellerOrders({ limit: 50 });
    if (result.error || !result.data) {
      return {
        error: result.error ?? 'Error al obtener estadísticas',
        status: result.status,
      };
    }
    return { data: computeStats(result.data.orders), status: 200 };
  } catch (err) {
    console.error('[orders] fetchOrderStats', err);
    return { error: 'Error al obtener estadísticas', status: 500 };
  }
}
