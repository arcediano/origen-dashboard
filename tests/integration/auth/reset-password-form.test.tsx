/**
 * Tests de integración para el formulario de restablecimiento de contraseña (ResetPasswordForm).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { render } from '../../helpers/render';
import { server } from '../../mocks/server';
import { TEST_API_BASE } from '../../mocks/api-base';
import { ResetPasswordForm } from '@/components/features/auth/components/reset-password-form';

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/auth/reset-password',
}));

const getNewPasswordInput = () => screen.getByPlaceholderText(/mínimo 8 caracteres/i);
const getConfirmPasswordInput = () => screen.getByPlaceholderText(/repite la contraseña/i);
const getSubmitButton = () => screen.getByRole('button', { name: /guardar nueva contraseña/i });

describe('ResetPasswordForm — Formulario de restablecimiento de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams({ token: 'token-valido' });
  });

  it('muestra el enlace no válido cuando no hay token en la URL', () => {
    mockSearchParams = new URLSearchParams();
    render(<ResetPasswordForm />);
    expect(screen.getByText(/enlace no válido/i)).toBeInTheDocument();
  });

  it('renderiza los campos de contraseña cuando hay token', () => {
    render(<ResetPasswordForm />);
    expect(getNewPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
  });

  it('muestra error cuando la contraseña tiene menos de 8 caracteres', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(getNewPasswordInput(), 'corta1');
    await user.type(getConfirmPasswordInput(), 'corta1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it('muestra error cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(getNewPasswordInput(), 'Password1');
    await user.type(getConfirmPasswordInput(), 'Password2');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    });
  });

  it('muestra el estado de éxito tras restablecer la contraseña', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(getNewPasswordInput(), 'Password1');
    await user.type(getConfirmPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/contraseña actualizada/i)).toBeInTheDocument();
    });
  });

  it('muestra el error del servidor cuando el token es inválido', async () => {
    mockSearchParams = new URLSearchParams({ token: 'token-invalido' });
    server.use(
      http.post(`${TEST_API_BASE}/auth/reset-password`, () =>
        HttpResponse.json({ success: false, message: 'Token inválido o expirado' }, { status: 400 })
      )
    );

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(getNewPasswordInput(), 'Password1');
    await user.type(getConfirmPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/token inválido o expirado/i)).toBeInTheDocument();
    });
  });
});
