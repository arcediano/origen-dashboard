/**
 * Tests de integración para el formulario de recuperación de contraseña (SimpleForgotPassword).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { render } from '../../helpers/render';
import { server } from '../../mocks/server';
import { SimpleForgotPassword } from '@/components/features/auth/components/forgot-password-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/forgot-password',
}));

const getEmailInput = () => screen.getByPlaceholderText(/nombre@productor\.es/i);
const getSubmitButton = () => screen.getByRole('button', { name: /enviar enlace/i });

describe('SimpleForgotPassword — Formulario de recuperación de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renderizado ─────────────────────────────────────────────────────────────

  it('renderiza el campo de email', () => {
    render(<SimpleForgotPassword />);
    expect(getEmailInput()).toBeInTheDocument();
  });

  it('renderiza el botón de envío', () => {
    render(<SimpleForgotPassword />);
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it('muestra el título del formulario', () => {
    render(<SimpleForgotPassword />);
    expect(screen.getByText(/olvidaste tu contraseña/i)).toBeInTheDocument();
  });

  it('muestra el enlace para volver al login', () => {
    render(<SimpleForgotPassword />);
    const links = screen.getAllByText(/volver al inicio de sesión/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it('el campo de email está vacío al inicio', () => {
    render(<SimpleForgotPassword />);
    expect(getEmailInput()).toHaveValue('');
  });

  // ── Validación del campo email ──────────────────────────────────────────────

  it('muestra error "email es requerido" cuando se envía sin email', async () => {
    const { container } = render(<SimpleForgotPassword />);
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/email es requerido/i)).toBeInTheDocument();
    });
  });

  it('muestra error "email válido" cuando el formato es incorrecto', async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'noesvalido');
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    });
  });

  it('el error desaparece al corregir el email', async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'noesvalido');
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    });

    // Corregir el email
    await user.clear(getEmailInput());
    await user.type(getEmailInput(), 'correcto@test.es');

    await waitFor(() => {
      expect(screen.queryByText(/email válido/i)).not.toBeInTheDocument();
    });
  });

  // ── Envío exitoso ───────────────────────────────────────────────────────────

  it('muestra el estado de éxito tras un envío correcto', async () => {
    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
  });

  it('muestra el email enviado en el mensaje de confirmación', async () => {
    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/productor@test\.es/i)).toBeInTheDocument();
    });
  });

  it('oculta el formulario después del envío exitoso', async () => {
    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enviar enlace/i })).not.toBeInTheDocument();
    });
  });

  // ── Error de servidor (500) ─────────────────────────────────────────────────

  it('muestra error de servidor cuando el backend devuelve 500', async () => {
    server.use(
      http.post('http://localhost:3001/api/v1/auth/forgot-password', () =>
        HttpResponse.json(
          { success: false, message: 'Internal Server Error' },
          { status: 500 }
        )
      )
    );

    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/error del servidor/i)).toBeInTheDocument();
    });
  });

  it('no muestra el estado de éxito cuando hay un error de servidor', async () => {
    server.use(
      http.post('http://localhost:3001/api/v1/auth/forgot-password', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.queryByText(/revisa tu correo/i)).not.toBeInTheDocument();
    });
  });

  // ── Protección anti-enumeración de usuarios ─────────────────────────────────

  it('muestra éxito (no error) con 404 — evita revelar si el email existe', async () => {
    server.use(
      http.post('http://localhost:3001/api/v1/auth/forgot-password', () =>
        HttpResponse.json({ success: false, message: 'Not Found' }, { status: 404 })
      )
    );

    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'noexiste@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
  });

  it('muestra éxito con 400 — no revela que el email es inválido en el servidor', async () => {
    server.use(
      http.post('http://localhost:3001/api/v1/auth/forgot-password', () =>
        HttpResponse.json({ success: false, message: 'Bad Request' }, { status: 400 })
      )
    );

    const user = userEvent.setup();
    render(<SimpleForgotPassword />);

    await user.type(getEmailInput(), 'test@test.es');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
  });
});
