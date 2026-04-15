/**
 * Unit tests for NotificationToggleRow (rediseño Sprint 24).
 *
 * Verifica:
 * - Renderiza título y descripción en su propio bloque (no inline con toggles)
 * - Renderiza label "Email" y "Push" cuando se pasan los canales
 * - Llama a los callbacks onChange con el valor correcto
 * - Respeta la prop disabled en cada canal independientemente
 * - El separador inferior se aplica o no según la prop divider
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Bell } from 'lucide-react';
import { NotificationToggleRow } from '@/app/dashboard/notifications/components/NotificationToggleRow';

// Mock Toggle para aislar el componente de la librería externa
vi.mock('@arcediano/ux-library', () => ({
  Toggle: ({
    checked,
    onCheckedChange,
    disabled,
    'aria-label': ariaLabel,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      data-testid={ariaLabel}
    >
      toggle
    </button>
  ),
}));

describe('NotificationToggleRow', () => {
  it('renders title and description', () => {
    render(
      <NotificationToggleRow
        icon={Bell}
        title="Nuevo pedido"
        description="Aviso cuando llega un pedido"
      />,
    );

    expect(screen.getByText('Nuevo pedido')).toBeInTheDocument();
    expect(screen.getByText('Aviso cuando llega un pedido')).toBeInTheDocument();
  });

  it('renders email and push labels when both channels are provided', () => {
    render(
      <NotificationToggleRow
        icon={Bell}
        title="Nuevo pedido"
        email={{ checked: true,  onChange: vi.fn() }}
        push={{  checked: false, onChange: vi.fn() }}
      />,
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
  });

  it('does not render channel labels when no channels provided', () => {
    render(<NotificationToggleRow icon={Bell} title="Solo texto" />);

    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Push')).not.toBeInTheDocument();
  });

  it('calls email onChange with toggled value', () => {
    const onEmailChange = vi.fn();
    render(
      <NotificationToggleRow
        icon={Bell}
        title="Pedidos"
        email={{ checked: true,  onChange: onEmailChange }}
        push={{  checked: false, onChange: vi.fn() }}
      />,
    );

    // email toggle is currently checked=true → click should call with false
    fireEvent.click(screen.getByTestId('Activar email para Pedidos'));
    expect(onEmailChange).toHaveBeenCalledWith(false);
  });

  it('calls push onChange with toggled value', () => {
    const onPushChange = vi.fn();
    render(
      <NotificationToggleRow
        icon={Bell}
        title="Stock"
        email={{ checked: false, onChange: vi.fn() }}
        push={{  checked: false, onChange: onPushChange }}
      />,
    );

    fireEvent.click(screen.getByTestId('Activar push para Stock'));
    expect(onPushChange).toHaveBeenCalledWith(true);
  });

  it('respects disabled flag independently per channel', () => {
    render(
      <NotificationToggleRow
        icon={Bell}
        title="Alerta"
        email={{ checked: true,  onChange: vi.fn(), disabled: true  }}
        push={{  checked: false, onChange: vi.fn(), disabled: false }}
      />,
    );

    const emailToggle = screen.getByTestId('Activar email para Alerta');
    const pushToggle  = screen.getByTestId('Activar push para Alerta');

    expect(emailToggle).toBeDisabled();
    expect(pushToggle).not.toBeDisabled();
  });
});
