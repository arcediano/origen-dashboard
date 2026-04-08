import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { render, screen } from '../../helpers/render';
import DashboardHomePage from '@/app/dashboard/page';
import { DASHBOARD_SMOKE_ROUTES } from '../../shared/dashboard-smoke-routes';

vi.mock('@/app/dashboard/components/footer/DashboardFooter', () => ({
  DashboardFooter: () => <footer data-testid="dashboard-footer">Footer</footer>,
}));

vi.mock('@/components/features/dashboard/hooks', () => ({
  useDashboardStats: () => ({
    stats: [],
    isLoading: false,
    pendingOrders: 2,
    totalRevenue: 250,
  }),
  useRecentOrders: () => ({
    orders: [],
    isLoading: false,
  }),
  useTopProducts: () => ({
    products: [],
    isLoading: false,
  }),
  useProducerProfile: () => ({
    producer: {
      id: 'producer-1',
      name: 'Productor Test',
      location: 'Madrid',
      profileCompletenessScore: 0.65,
      profileCompletenessRatio: 0.65,
      profileCompletenessPercent: 65,
      profileCompletenessMeta: { completedSteps: 4, totalSteps: 6, version: 'v1' },
      accountStatus: 'active',
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/components/features/dashboard', () => ({
  AlertList: () => <section data-testid="alerts-section">Alertas</section>,
  DashboardShell: ({ children }: { children: React.ReactNode }) => <main data-testid="dashboard-shell">{children}</main>,
  ProducerCard: () => <section data-testid="producer-card">Producer</section>,
  StatsGrid: () => <section data-testid="stats-grid">Stats</section>,
  SalesChart: () => <section data-testid="sales-chart">Sales</section>,
  VisitsChart: () => <section data-testid="visits-chart">Visits</section>,
  OrdersSummary: () => <section data-testid="orders-summary">Orders</section>,
  TopProducts: () => <section data-testid="top-products">Products</section>,
  DashboardTabs: () => <section data-testid="dashboard-tabs">Tabs</section>,
  WelcomeHeader: ({ userName }: { userName: string }) => <h1>Hola, {userName}</h1>,
}));

describe('Dashboard home smoke', () => {
  it('renderiza los bloques criticos de home sin romper', async () => {
    render(<DashboardHomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-shell')).toBeDefined();
    });

    expect(screen.getByTestId('alerts-section')).toBeDefined();
    expect(screen.getByTestId('producer-card')).toBeDefined();
    expect(screen.getByTestId('stats-grid')).toBeDefined();
    expect(screen.getByTestId('sales-chart')).toBeDefined();
    expect(screen.getByTestId('visits-chart')).toBeDefined();
    expect(screen.getByTestId('orders-summary')).toBeDefined();
    expect(screen.getByTestId('top-products')).toBeDefined();
    expect(screen.getByTestId('dashboard-tabs')).toBeDefined();
    expect(screen.getByText('Continuar')).toBeDefined();
  });

  it('mantiene cubiertas las rutas smoke de las secciones clave del dashboard', async () => {
    render(<DashboardHomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-shell')).toBeDefined();
    });

    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard')).toBe(true);
    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard/orders')).toBe(true);
    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard/products/create')).toBe(true);
    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard/profile/business')).toBe(true);
    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard/configuracion/pagos')).toBe(true);
    expect(DASHBOARD_SMOKE_ROUTES.includes('/dashboard/notifications')).toBe(true);
  });
});
