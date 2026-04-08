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
    expect(screen.getByText('Preferencias de notificación')).toBeDefined();
    expect(screen.getByText('Pagos')).toBeDefined();
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

    const preferenciasLink = screen
      .getByText('Preferencias de notificación')
      .closest('a');
    const pagosLink = screen.getByText('Pagos').closest('a');

    expect(preferenciasLink?.getAttribute('href')).toBe('/dashboard/notifications?view=preferences');
    expect(pagosLink?.getAttribute('href')).toBe('/dashboard/configuracion/pagos');
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
});
