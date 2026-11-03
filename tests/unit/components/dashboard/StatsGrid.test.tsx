/**
 * @file StatsGrid.test.tsx
 * @description Verifica que "Visitas hoy" explica su criterio de conteo
 * (deduplicado por IP en 24h, no por dispositivo) — petición del humano tras
 * preguntar si entrar desde PC y móvil cuenta como 2 visitas.
 *
 * StatGrid/StatCard están mockeados globalmente (vitest.setup.ts) como un
 * <div> passthrough que no renderiza label/subtitle como texto legible --
 * aquí se usa el componente real de la librería para poder leer el subtítulo.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@arcediano/ux-library', async () => vi.importActual('@arcediano/ux-library'));

const { StatsGrid } = await import('@/components/features/dashboard/components/stats/stats-grid');
type DashboardStats = import('@/components/features/dashboard/types').DashboardStats;

const STATS: DashboardStats = {
  profileViews: { today: 12 },
  orders: { today: 3 },
  revenue: { today: 45.9 },
  rating: { average: 4.5, total: 10 },
};

describe('StatsGrid', () => {
  it('aclara que "Visitas hoy" son visitantes únicos por IP en 24h, no por dispositivo', () => {
    render(<StatsGrid stats={STATS} />);

    expect(screen.getByText('Visitas hoy')).toBeDefined();
    expect(screen.getByText('Visitantes únicos (por IP, 24h)')).toBeDefined();
  });
});
