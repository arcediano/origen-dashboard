/**
 * @file ProducerCard.test.tsx
 * @description Tests de integración para el componente ProducerCard.
 * Verifica el renderizado de completitud, badge de estado y CTA condicional.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../helpers/render';
import { ProducerCard } from '@/components/features/dashboard/components/profile/producer-card';
import type { ProducerProfile } from '@/components/features/dashboard/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// ─── fixture ──────────────────────────────────────────────────────────────────

const baseProducer: ProducerProfile = {
  id: 'producer-001',
  name: 'Quesería Artesana Valle del Tajo',
  location: 'Talavera de la Reina, Toledo',
  profileCompletenessScore: 0.72,
  profileCompletenessRatio: 0.72,
  profileCompletenessPercent: 72,
  profileCompletenessMeta: { completedSteps: 4, totalSteps: 6, version: 'v1' },
  accountStatus: 'active',
  avatarUrl: '',
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('ProducerCard', () => {
  it('renderiza el nombre del productor', () => {
    render(<ProducerCard producer={baseProducer} />);
    expect(screen.getByText('Quesería Artesana Valle del Tajo')).toBeDefined();
  });

  it('renderiza la ubicación del productor', () => {
    render(<ProducerCard producer={baseProducer} />);
    expect(screen.getByText('Talavera de la Reina, Toledo')).toBeDefined();
  });

  it('renderiza la barra de progreso de completitud con aria-valuenow', () => {
    render(<ProducerCard producer={baseProducer} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeDefined();
    expect(bar.getAttribute('aria-valuenow')).toBe('72');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('muestra el porcentaje de completitud en pantalla', () => {
    render(<ProducerCard producer={baseProducer} />);
    expect(screen.getByText('72%')).toBeDefined();
  });

  it('muestra badge "Cuenta activa" para accountStatus active', () => {
    render(<ProducerCard producer={baseProducer} />);
    expect(screen.getAllByText('Cuenta activa').length).toBeGreaterThan(0);
  });

  it('muestra badge "Verificación pendiente" para accountStatus pending', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, accountStatus: 'pending' }}
      />,
    );
    expect(screen.getAllByText('Verificación pendiente').length).toBeGreaterThan(0);
  });

  it('muestra badge "Cuenta suspendida" para accountStatus suspended', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, accountStatus: 'suspended' }}
      />,
    );
    expect(screen.getAllByText('Cuenta suspendida').length).toBeGreaterThan(0);
  });

  it('muestra CTA "Completar perfil" cuando score < 100', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, profileCompletenessScore: 0.72, profileCompletenessRatio: 0.72, profileCompletenessPercent: 72 }}
      />,
    );
    expect(screen.getByText('Completar perfil')).toBeDefined();
  });

  it('NO muestra CTA "Completar perfil" cuando score === 100', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, profileCompletenessScore: 1, profileCompletenessRatio: 1, profileCompletenessPercent: 100 }}
      />,
    );
    expect(screen.queryByText('Completar perfil')).toBeNull();
  });

  it('renderiza el skeleton en estado isLoading', () => {
    const { container } = render(
      <ProducerCard producer={null} isLoading />,
    );
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    expect(screen.queryByText('Completar perfil')).toBeNull();
  });

  it('muestra el mensaje de error cuando se le pasa', () => {
    render(
      <ProducerCard
        producer={null}
        isLoading={false}
        error="Error al cargar el perfil del productor"
      />,
    );
    expect(
      screen.getByText('Error al cargar el perfil del productor'),
    ).toBeDefined();
  });

  it('no renderiza nada cuando producer es null sin loading ni error', () => {
    const { container } = render(
      <ProducerCard producer={null} isLoading={false} error={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza las iniciales en el avatar cuando no hay avatarUrl', () => {
    render(<ProducerCard producer={{ ...baseProducer, avatarUrl: '' }} />);
    // "QA" son las iniciales de "Quesería Artesana…"
    expect(screen.getByText('QA')).toBeDefined();
  });

  it('la barra de progreso tiene la etiqueta aria correcta', () => {
    render(<ProducerCard producer={baseProducer} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toContain('72%');
  });

  it('renderiza score 0 sin errores', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, profileCompletenessScore: 0, profileCompletenessRatio: 0, profileCompletenessPercent: 0 }}
      />,
    );
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('renderiza score 100 sin CTA', () => {
    render(
      <ProducerCard
        producer={{ ...baseProducer, profileCompletenessScore: 1, profileCompletenessRatio: 1, profileCompletenessPercent: 100 }}
      />,
    );
    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.queryByText('Completar perfil')).toBeNull();
  });
});
