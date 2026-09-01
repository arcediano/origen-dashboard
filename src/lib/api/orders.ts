/**
 * @file orders.ts
 * @description Llamadas a la API real para el sistema de pedidos del productor.
 * Sprint 16: reemplaza el mock en-memoria por fetch real al gateway.
 *
 * Endpoints reales (gateway → orders-service):
 *   GET   /api/v1/orders/seller          — lista pedidos del productor (paginado)
 *   GET   /api/v1/orders/seller/stats    — estadísticas agregadas del productor
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
  commissionRate?: number | null;
  commissionAmount?: number | null;
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
  /** Email de contacto capturado en el checkout, desacoplado del email de la cuenta (que puede cambiar). Fuente preferida para el email del comprador; shippingAddress.email puede venir ausente (p.ej. sanitizado en la respuesta de vendedor). */
  contactEmail?: string | null;
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
  paidAt?: string;
  deliveredAt?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'issued' | 'cancelled';
    issuedAt?: string;
    hasPdf: boolean;
  };
  /** true si el pedido incluye productos de más de un productor (calculado en servidor). */
  isMultiSeller?: boolean;
  items: BackendOrderItem[];
  /**
   * Historial real de transiciones de estado del pedido (order_status_history),
   * ordenado por createdAt descendente. Opcional por retrocompatibilidad con
   * respuestas antiguas del backend que aún no lo incluían.
   */
  timeline?: BackendTimelineEvent[];
}

interface BackendTimelineEvent {
  id: string;
  status: string;
  createdAt: string;
}

interface BackendInvoiceDownloadResponse {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'issued' | 'cancelled';
    issuedAt?: string;
    hasPdf: boolean;
  };
  downloadUrl: string | null;
  expiresIn: number;
}

interface BackendSellerListResponse {
  items: BackendOrder[];
  total: number;
  page: number;
  limit: number;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

// Simplificado (plan "eliminar-metodos-pago-no-stripe", 2026-08-03): el
// negocio opera exclusivamente con pagos online vía Stripe (card); el
// backend ya no acepta ni genera paypal/transfer/bank_transfer/cash. Se
// mantiene el caso 'other' de forma defensiva por si quedara algún dato
// legado no cubierto por la normalización de datos de esa misma tarea.
function mapPaymentMethod(method: string): Order['payment']['method'] {
  switch (method?.toLowerCase()) {
    case 'card':
    case 'tarjeta':
      return 'card';
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
    case 'returned':
      return 'returned';
    default:
      return 'pending';
  }
}

function mapOrderStatus(raw: string): OrderStatus {
  if (raw === 'confirmed') return 'processing';

  const valid: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'refunded',
  ];
  return valid.includes(raw as OrderStatus) ? (raw as OrderStatus) : 'pending';
}

/**
 * Etiquetas legibles en español para cada evento del timeline de un pedido.
 * La generación del texto se resuelve en el frontend (D5 del plan de
 * desarrollo "timeline-pedidos"): el backend solo expone el enum de estado
 * (status) como fuente única de verdad, y este diccionario traduce cada
 * estado del enum real (incluyendo 'confirmed' y 'returned', que no forman
 * parte de OrderStatus tras el colapso) a la descripción mostrada en la UI.
 */
const TIMELINE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido creado',
  confirmed: 'Pago confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
  refunded: 'Reembolsado',
};

function mapBackendOrder(o: BackendOrder): Order {
  const status = mapOrderStatus(o.status);
  const addr = o.shippingAddress ?? {};

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: '',
    customerName: addr.fullName ?? 'Cliente',
    customerEmail: o.contactEmail ?? addr.email ?? '',
    customerPhone: addr.phone,

    items: o.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage?.url ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.subtotal,
      commissionRate: item.commissionRate,
      commissionAmount: item.commissionAmount,
    })),

    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    discount: o.discountAmount > 0 ? o.discountAmount : undefined,
    total: o.total,
    couponCode: o.couponCode,

    status,

    payment: {
      method: mapPaymentMethod(o.paymentMethod),
      status: status === 'pending' ? 'pending' : status === 'refunded' ? 'refunded' : 'paid',
      amount: o.total,
      paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
    },

    shipping: {
      method: '',
      status: mapShippingStatus(o.status),
      cost: o.shippingCost,
      estimatedDate: o.estimatedDelivery ? new Date(o.estimatedDelivery) : undefined,
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
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

    timeline: (o.timeline ?? [])
      .map((event) => ({
        id: event.id,
        // Colapso de estados (igual que mapOrderStatus para el status principal
        // del pedido): 'confirmed' se muestra como 'processing' para que el
        // color/estilo del evento sea consistente con el badge de estado actual.
        status: mapOrderStatus(event.status),
        description: TIMELINE_STATUS_LABELS[event.status] ?? event.status,
        createdAt: new Date(event.createdAt),
      }))
      // Reordenado defensivo por createdAt descendente: no acoplar la UI al
      // orden en que el backend entregue la respuesta HTTP.
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),

    invoice: o.invoice
      ? {
          id: o.invoice.id,
          invoiceNumber: o.invoice.invoiceNumber,
          status: o.invoice.status,
          issuedAt: o.invoice.issuedAt ? new Date(o.invoice.issuedAt) : undefined,
          hasPdf: o.invoice.hasPdf,
        }
      : undefined,
    isMultiSeller: o.isMultiSeller,

    createdAt: new Date(o.createdAt),
    updatedAt: new Date(o.updatedAt),
  };
}

const EMPTY_STATS: OrderStats = {
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  refunded: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  todayOrders: 0,
  todayRevenue: 0,
};

// ─── Params públicos ──────────────────────────────────────────────────────────

export interface SellerOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'issued' | 'cancelled' | 'all';
  dateFrom?: string;
  dateTo?: string;
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
 * Obtiene las estadísticas agregadas de pedidos del productor autenticado
 * (todos los estados, no limitadas a la página actual).
 * GET /api/v1/orders/seller/stats
 */
export async function fetchSellerOrderStats(): Promise<ApiResponse<OrderStats>> {
  try {
    const res = await gatewayClient.get<OrderStats>('/orders/seller/stats');
    return { data: res, status: 200 };
  } catch (err) {
    console.error('[orders] fetchSellerOrderStats', err);
    const message =
      err instanceof GatewayError ? err.message : 'Error al obtener estadísticas';
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
    const [result, statsResult] = await Promise.all([
      fetchSellerOrders({
        page: params?.page,
        limit: params?.limit,
        status: params?.filters?.status,
        search: params?.filters?.search,
      }),
      fetchSellerOrderStats(),
    ]);

    if (result.error || !result.data) {
      return {
        error: result.error ?? 'Error al cargar pedidos',
        status: result.status,
      };
    }

    const { orders, total, page, limit } = result.data;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    // Si falla el endpoint de estadísticas, no debe romper la carga de
    // pedidos: se degrada a estadísticas en 0 y se loguea el error.
    if (statsResult.error || !statsResult.data) {
      console.error('[orders] fetchOrders: fetchSellerOrderStats falló', statsResult.error);
    }

    // `total` SIEMPRE se sobreescribe con el total de la paginación (fuente
    // única de verdad), nunca con el que devuelva el endpoint de stats.
    const stats: OrderStats = {
      ...(statsResult.data ?? EMPTY_STATS),
      total,
    };

    return {
      data: {
        orders,
        stats,
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
 * Obtiene URL de descarga prefirmada de la factura de un pedido del productor.
 * GET /api/v1/orders/seller/:id/invoice
 */
export async function fetchSellerOrderInvoice(
  id: string,
): Promise<ApiResponse<BackendInvoiceDownloadResponse>> {
  try {
    const res = await gatewayClient.get<BackendInvoiceDownloadResponse>(`/orders/seller/${id}/invoice`);
    return { data: res, status: 200 };
  } catch (err) {
    console.error('[orders] fetchSellerOrderInvoice', err);
    if (err instanceof GatewayError) {
      if (err.status === 404) {
        return { error: 'Factura no disponible para este pedido', status: 404 };
      }
      if (err.status === 403) {
        return { error: 'Acceso denegado a la factura', status: 403 };
      }
      return { error: err.message, status: err.status };
    }
    return { error: 'Error al obtener la factura del pedido', status: 500 };
  }
}

export interface OrderReturnItemInput {
  orderItemId: string;
  quantity: number;
}

/**
 * Actualiza el estado de un pedido del productor.
 * PATCH /api/v1/orders/seller/:id/status
 *
 * `items` es obligatorio en el backend cuando `status === 'returned'`
 * (decisión del humano, 2026-08-29: el productor marca ítems/cantidades
 * concretas, no un importe libre — ver SellerChangeStatusDto en
 * origen-master-microservices). Sin él, el backend responde 400.
 */
export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  comment?: string,
  items?: OrderReturnItemInput[],
): Promise<ApiResponse<Order>> {
  try {
    const res = await gatewayClient.patch<BackendOrder>(
      `/orders/seller/${id}/status`,
      { status, ...(comment ? { comment } : {}), ...(items ? { items } : {}) },
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
 * Obtiene estadísticas agregadas de pedidos del productor.
 * Usado por el Dashboard principal (use-dashboard-stats.ts).
 * Delega en fetchSellerOrderStats (endpoint de agregación del backend),
 * en vez de recalcular sobre un slice paginado de pedidos.
 */
export async function fetchOrderStats(): Promise<ApiResponse<OrderStats>> {
  return fetchSellerOrderStats();
}

// ─── FACTURAS ─────────────────────────────────────────────────────────────────

interface BackendInvoiceListItem {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'cancelled';
  issuedAt: string;
  hasPdf: boolean;
  total: number;
}

interface BackendInvoiceListResponse {
  items: BackendInvoiceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceListItem {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'cancelled';
  issuedAt?: string;
  hasPdf: boolean;
  total: number;
}

/**
 * Obtiene el listado paginado de facturas de venta del productor autenticado.
 * GET /api/v1/orders/seller/invoices
 *
 * Incluye tanto facturas de pedidos de un único vendedor como la factura
 * propia del productor en pedidos multi-vendedor (una fila por pedido,
 * con el importe/factura de este productor únicamente).
 */
export async function fetchSellerInvoices(
  params?: InvoiceFilterParams,
): Promise<ApiResponse<{ invoices: InvoiceListItem[]; total: number; page: number; limit: number }>> {
  try {
    const res = await gatewayClient.get<BackendInvoiceListResponse>('/orders/seller/invoices', {
      params: {
        ...(params?.page !== undefined ? { page: params.page } : {}),
        ...(params?.limit !== undefined ? { limit: params.limit } : {}),
        ...(params?.search !== undefined ? { search: params.search } : {}),
        ...(params?.status !== undefined ? { status: params.status } : {}),
        ...(params?.dateFrom !== undefined ? { dateFrom: params.dateFrom } : {}),
        ...(params?.dateTo !== undefined ? { dateTo: params.dateTo } : {}),
      },
    });

    const invoices = (res.items ?? []).map((item) => ({
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      invoiceNumber: item.invoiceNumber,
      status: item.status,
      issuedAt: item.issuedAt,
      hasPdf: item.hasPdf,
      total: item.total,
    }));

    return {
      data: {
        invoices,
        total: res.total,
        page: res.page,
        limit: res.limit,
      },
      status: 200,
    };
  } catch (err) {
    console.error('[orders] fetchSellerInvoices', err);
    const message =
      err instanceof GatewayError ? err.message : 'Error al cargar facturas';
    return {
      error: message,
      status: err instanceof GatewayError ? err.status : 500,
    };
  }
}
