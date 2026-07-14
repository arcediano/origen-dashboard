/**
 * @file order.ts
 * @description Tipos para el sistema de pedidos
 */

export type OrderStatus = 
  | 'pending'      // Pendiente de pago/confirmación
  | 'processing'   // Procesando/preparando
  | 'shipped'      // Enviado
  | 'delivered'    // Entregado
  | 'cancelled'    // Cancelado
  | 'refunded';    // Reembolsado

export type PaymentStatus = 
  | 'pending'      // Pendiente de pago
  | 'paid'         // Pagado
  | 'failed'       // Falló el pago
  | 'refunded';    // Reembolsado

export type ShippingStatus = 
  | 'pending'      // Pendiente de envío
  | 'processing'   // Preparando envío
  | 'shipped'      // En tránsito
  | 'delivered'    // Entregado
  | 'returned';    // Devuelto

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  metadata?: Record<string, any>;
}

export interface OrderAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface OrderPayment {
  method: 'card' | 'transfer' | 'paypal' | 'cash' | 'other';
  status: PaymentStatus;
  transactionId?: string;
  amount: number;
  paidAt?: Date;
  metadata?: Record<string, any>;
}

export interface OrderShipping {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: ShippingStatus;
  estimatedDays?: number;
  estimatedDate?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cost: number;
  address: OrderAddress;
}

export interface OrderTimeline {
  id: string;
  status: OrderStatus;
  description: string;
  createdAt: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface OrderInvoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'cancelled';
  issuedAt?: Date;
  hasPdf: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shippingCost: number;
  tax?: number;
  total: number;
  
  status: OrderStatus;
  payment: OrderPayment;
  shipping: OrderShipping;
  
  timeline: OrderTimeline[];
  notes?: string;
  invoice?: OrderInvoice;
  /** true si el pedido incluye productos de más de un productor (calculado en servidor sobre los items sin filtrar). */
  isMultiSeller?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  metadata?: Record<string, any>;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface OrdersResponse {
  orders: Order[];
  stats: OrderStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  search?: string; // Buscar por número de pedido, cliente, email
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
}