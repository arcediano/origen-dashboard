/**
 * @file dashboard.types.ts
 * @description Tipos TypeScript para el dashboard
 */

// ============================================================================
// PRODUCTOR
// ============================================================================

export interface Certification {
  id: string;
  name: string;
  verified: boolean;
  expiresAt?: string;
}

export interface Producer {
  id: string;
  businessName: string;
  tagline?: string;
  city: string;
  province: string;
  foundedYear: number;
  teamSize?: string;
  certifications: Certification[];
  verified: boolean;
  logoUrl?: string;
  email?: string;
  phone?: string;
}

export type AccountStatus = 'active' | 'pending' | 'suspended';

/**
 * Perfil del productor tal como lo devuelve GET /api/v1/producers/me (T16-BE4).
 */
export interface ProducerProfile {
  id: string;
  code?: string;
  name: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location: string;
  shortBio?: string;
  categories?: string[];
  profileCompletenessScore: number;
  accountStatus: AccountStatus;
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

export interface TrendData {
  value: number;
  isPositive: boolean;
}

export interface StatValue {
  today: number | string;
  trend?: TrendData;
}

export interface DashboardStats {
  profileViews: StatValue;
  orders: StatValue;
  revenue: StatValue;
  rating: {
    average: number;
    total: number;
  };
}

// ============================================================================
// PEDIDOS
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
}

// ============================================================================
// PRODUCTOS
// ============================================================================

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sales: number;
  trend?: number;
  imageUrl?: string;
}

// ============================================================================
// ALERTAS
// ============================================================================

export type AlertType = 'warning' | 'info' | 'success' | 'error' | 'accent';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  dismissible?: boolean;
  action?: {
    label: string;
    href: string;
  };
}

// ============================================================================
// ACCIONES RÁPIDAS
// ============================================================================

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  gradient?: string;
  badge?: number;
}

// ============================================================================
// PROPS DE COMPONENTES
// ============================================================================

export interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: TrendData;
  icon: React.ElementType;
  gradient?: string;
  className?: string;
}

export interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  gradient?: string;
  badge?: string | number;
  className?: string;
}

export interface OrderItemProps {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
}

export interface ProductItemProps {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sales: number;
  trend?: number;
}
