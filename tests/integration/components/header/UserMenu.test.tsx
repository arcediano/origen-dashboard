import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '../../../helpers/render';
import { UserMenu } from '@/app/dashboard/components/header/UserMenu';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api/auth', () => ({
  logoutUser: vi.fn(async () => undefined),
}));

describe('UserMenu', () => {
  it('expone atributos aria del trigger y despliega opciones canónicas', () => {
    render(
      <UserMenu
        userName="María Martínez"
        userEmail="maria@origen.es"
        userInitials="MM"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Abrir menú de usuario' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Mi cuenta')).toBeDefined();
    expect(screen.getByText('Centro de ayuda')).toBeDefined();
  });

  it('usa redirecciones canónicas en links clave', () => {
    render(
      <UserMenu
        userName="María Martínez"
        userEmail="maria@origen.es"
        userInitials="MM"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de usuario' }));

    const accountLink = screen.getByText('Mi cuenta').closest('a');
    const helpLink = screen.getByText('Centro de ayuda').closest('a');

    expect(accountLink?.getAttribute('href')).toBe('/dashboard/account');
    expect(helpLink?.getAttribute('href')).toBe('/ayuda');
  });

  it('cierra el menú con Escape', () => {
    render(
      <UserMenu
        userName="María Martínez"
        userEmail="maria@origen.es"
        userInitials="MM"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Abrir menú de usuario' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  describe('visibilidad en marketplace (readinessReport)', () => {
    it('muestra el motivo real y legible cuando hay un campo de perfil pendiente', () => {
      render(
        <UserMenu
          userName="María Martínez"
          userEmail="maria@origen.es"
          userInitials="MM"
          readinessReport={{
            canSubmitProducts: false,
            blockers: ['MISSING_DELIVERY_OPTION'],
            documentChecks: { CIF: 'MISSING', SEGURO_RC: 'MISSING', MANIPULADOR_ALIMENTOS: 'MISSING' },
          } as any}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de usuario' }));

      // No debe implicar que el motivo es "no tener productos" -- el
      // requisito real (opción de envío) no tiene nada que ver con productos.
      expect(screen.getByText('Perfil no visible en el marketplace')).toBeDefined();
      expect(screen.getByText(/Añade al menos un método de envío activo/)).toBeDefined();
      expect(screen.queryByText(/missing delivery option/i)).toBeNull();
    });

    it('muestra el motivo de estado del productor cuando es el único bloqueante (antes se ocultaba sin dar ninguna razón)', () => {
      render(
        <UserMenu
          userName="María Martínez"
          userEmail="maria@origen.es"
          userInitials="MM"
          readinessReport={{
            canSubmitProducts: false,
            blockers: ['STATUS_NOT_ACTIVE:PENDING_VERIFICATION'],
            documentChecks: { CIF: 'MISSING', SEGURO_RC: 'MISSING', MANIPULADOR_ALIMENTOS: 'MISSING' },
          } as any}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de usuario' }));

      expect(
        screen.getByText(/pendiente de revisión por nuestro equipo/),
      ).toBeDefined();
    });

    it('muestra el estado visible cuando canSubmitProducts es true', () => {
      render(
        <UserMenu
          userName="María Martínez"
          userEmail="maria@origen.es"
          userInitials="MM"
          readinessReport={{
            canSubmitProducts: true,
            blockers: [],
            documentChecks: { CIF: 'VERIFIED', SEGURO_RC: 'VERIFIED', MANIPULADOR_ALIMENTOS: 'VERIFIED' },
          } as any}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de usuario' }));

      expect(screen.getByText('Visible — productos publicados')).toBeDefined();
    });
  });
});
