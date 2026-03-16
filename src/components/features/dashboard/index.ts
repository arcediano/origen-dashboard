/**
 * @file index.ts
 * @description Exportaciones principales del módulo dashboard
 */

// Types
export * from './types';

// Data
export * from './data';

// Hooks
export * from './hooks';

// Layout
export { DashboardShell, itemVariants } from './components/layout';

// Header
export { WelcomeHeader } from './components/header';

// Profile
export { ProducerCard } from './components/profile';

// Stats
export { StatsCard, StatsGrid } from './components/stats';

// Quick Actions
export { QuickActionCard, QuickActionsGrid } from './components/quick-actions';

// Alerts
export { AlertList } from './components/alerts';

// Orders
export { OrdersSummary } from './components/orders';

// Products
export { TopProducts } from './components/products';

// Tabs
export { DashboardTabs } from './components/tabs';

// Recent items
export { OrderItem } from './components/recent/order-item';
export { ProductItem } from './components/recent/product-item';

// Charts (existentes)
export { SalesChart } from './components/charts/sales-chart';
export { VisitsChart } from './components/charts/visits-chart';
