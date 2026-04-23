/**
 * @file OrganicScoreBadge.test.tsx
 * @description Tests unitarios para el componente OrganicScoreBadge.
 *
 * Verifica:
 * - Los 4 niveles semánticos de color según el score
 * - El porcentaje mostrado se calcula correctamente
 * - La prop showLabel muestra/oculta el texto de nivel
 * - Edge cases: score 0, score 1, score exactamente en umbrales
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrganicScoreBadge } from '@/components/shared/products/OrganicScoreBadge';

// Mock Tooltip de ux-library — solo necesitamos renderizar el contenido hijo
vi.mock('@arcediano/ux-library', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react para evitar dependencias de SVG en JSDOM
vi.mock('lucide-react', () => ({
  Leaf: () => <span data-testid="leaf-icon" />,
}));

describe('OrganicScoreBadge', () => {
  // ─── Porcentaje mostrado ───────────────────────────────────────────────────

  it('muestra el porcentaje redondeado al entero más próximo', () => {
    render(<OrganicScoreBadge score={0.756} />);
    expect(screen.getByText(/76%/)).toBeDefined();
  });

  it('muestra 0% cuando el score es 0', () => {
    render(<OrganicScoreBadge score={0} />);
    expect(screen.getByText(/0%/)).toBeDefined();
  });

  it('muestra 100% cuando el score es 1', () => {
    render(<OrganicScoreBadge score={1} />);
    expect(screen.getByText(/100%/)).toBeDefined();
  });

  // ─── Niveles semánticos ────────────────────────────────────────────────────

  it('aplica clase text-origen-pradera para score ≥ 0.80 (Excelente)', () => {
    const { container } = render(<OrganicScoreBadge score={0.85} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-pradera');
  });

  it('aplica clase text-origen-hoja para score ≥ 0.60 y < 0.80 (Bueno)', () => {
    const { container } = render(<OrganicScoreBadge score={0.65} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-hoja');
  });

  it('aplica clase text-origen-mandarina para score ≥ 0.40 y < 0.60 (Regular)', () => {
    const { container } = render(<OrganicScoreBadge score={0.50} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-mandarina');
  });

  it('aplica clase text-feedback-danger-text para score < 0.40 (Bajo)', () => {
    const { container } = render(<OrganicScoreBadge score={0.20} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-feedback-danger-text');
  });

  // ─── Umbrales exactos ─────────────────────────────────────────────────────

  it('score exactamente 0.80 → Excelente (text-origen-pradera)', () => {
    const { container } = render(<OrganicScoreBadge score={0.80} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-pradera');
  });

  it('score exactamente 0.60 → Bueno (text-origen-hoja)', () => {
    const { container } = render(<OrganicScoreBadge score={0.60} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-hoja');
  });

  it('score exactamente 0.40 → Regular (text-origen-mandarina)', () => {
    const { container } = render(<OrganicScoreBadge score={0.40} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-origen-mandarina');
  });

  // ─── Prop showLabel ───────────────────────────────────────────────────────

  it('no muestra el label de nivel por defecto (showLabel=false)', () => {
    render(<OrganicScoreBadge score={0.85} />);
    // El label "Excelente" está en un span hidden en mobile; no existe en el DOM visible
    // Comprobamos que el texto standalone no aparece fuera del span hidden
    const badge = screen.queryByText('Excelente');
    // Puede estar en DOM con clase hidden — lo que no debe estar es visible sin clase
    if (badge) {
      expect(badge.className).toContain('hidden');
    }
  });

  it('muestra el label de nivel cuando showLabel=true', () => {
    render(<OrganicScoreBadge score={0.85} showLabel />);
    const labelSpan = screen.getByText('Excelente');
    expect(labelSpan).toBeDefined();
  });

  // ─── Icono ────────────────────────────────────────────────────────────────

  it('siempre renderiza el icono de hoja', () => {
    render(<OrganicScoreBadge score={0.5} />);
    expect(screen.getByTestId('leaf-icon')).toBeDefined();
  });

  // ─── Prop size ────────────────────────────────────────────────────────────

  it('aplica text-[10px] con size=sm (defecto)', () => {
    const { container } = render(<OrganicScoreBadge score={0.5} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-[10px]');
  });

  it('aplica text-xs con size=md', () => {
    const { container } = render(<OrganicScoreBadge score={0.5} size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });
});
