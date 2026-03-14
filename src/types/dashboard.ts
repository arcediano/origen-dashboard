/**
 * @file Tipos para el Dashboard del Productor
 * @version 1.0.0
 */

export interface ProducerProfile {
  // Datos del onboarding
  businessName: string;
  tagline?: string;
  foundedYear?: number;
  teamSize?: '1-2' | '3-5' | '6-10' | '11+';
  province: string;
  city: string;
  description?: string;
  values: string[];
  certifications: Certification[];
  
  // Imágenes
  logo?: string;
  banner?: string;
  productImages: number;
  introVideo?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  verified: boolean;
  document?: string;
  expiryDate?: Date;
}

export interface DashboardStats {
  visitsToday: number;
  visitsTrend: string;
  ordersToday: number;
  ordersTrend: string;
  rating: number;
  totalReviews: number;
  monthlyRevenue: number;
  revenueTrend: string;
  monthlyOrders: number;
  pendingOrders: number;
}

export interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  date: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  images: number;
  category: string;
}

export interface Alert {
  id: number;
  type: 'stock' | 'certification' | 'order' | 'payment';
  message: string;
  severity: 'info' | 'warning' | 'error';
  link?: string;
}