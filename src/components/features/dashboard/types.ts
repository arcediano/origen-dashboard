/**
 * @file types.ts
 * @description Tipos para el dashboard
 */

export interface DashboardStats {
  profileViews: { 
    today: number; 
    trend: { value: number; isPositive: boolean } 
  };
  orders: { 
    today: number; 
    trend: { value: number; isPositive: boolean } 
  };
  revenue: { 
    today: number; 
    trend: { value: number; isPositive: boolean } 
  };
  rating: { average: number; total: number };
}

export interface Order {
  id: string;
  date: Date;
  status: string;
  total: number;
  items: number;
  customer: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  rating: number;
}

export interface Producer {
  id: string;
  name: string;
  // Añade otros campos según sea necesario
}

export interface DashboardAlert {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
}