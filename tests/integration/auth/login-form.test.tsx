/**
 * Tests de integración para el formulario de login (SimpleLogin).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockSetUserFromLogin, mockClearUser } from '../../helpers/render';
import { server } from '../../mocks/server';
import { authErrorHandlers } from '../../mocks/handlers/auth.handlers';
import { SimpleLogin } from '@/components/features/auth/components/login-form';
import { buildProducerUser, buildAdminUser } from '../../factories/user.factory';

// Router mock propio de este test — NO depende del de render.tsx
const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/login',
}));

// Helpers para acceder a los inputs por placeholder (evita ambigüedad con "Mostrar contraseña")
const getEmailInput = () => screen.getByPlaceholderText(/nombre@productor\.es/i);
const getPasswordInput = () => screen.getByPlaceholderText(/••••••••/);
const getSubmitButton = () => screen.getByRole('button', { name: /acceder al panel/i });
const submitForm = (container: HTMLElement) => {
  const form = container.querySelector('form')!;
  fireEvent.submit(form);
};

describe('SimpleLogin — Formulario de login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renderizado inicial ────────────────────────────────────────────────────

  it('renderiza el formulario correctamente', () => {
    render(<SimpleLogin />);
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  // ── Validación con formulario vacío ───────────────────────────────────────

  it('muestra error cuando se envía el formulario vacío', async () => {
    const { container } = render(<SimpleLogin />);
    submitForm(container);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const emailAlert = alerts.find((el) => el.textContent?.includes('email es requerido'));
      expect(emailAlert).toBeDefined();
    });
  });

  it('muestra error de email inválido', async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleLogin />);

    await user.type(getEmailInput(), 'notanemail');
    await user.type(getPasswordInput(), 'Password1');
    submitForm(container);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const emailAlert = alerts.find((el) => el.textContent?.includes('email válido'));
      expect(emailAlert).toBeDefined();
    });
  });

  it('muestra error de contraseña mínima', async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleLogin />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), '1234');
    submitForm(container);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const pwAlert = alerts.find((el) => el.textContent?.includes('8 caracteres'));
      expect(pwAlert).toBeDefined();
    });
  });

  // ── Login exitoso ─────────────────────────────────────────────────────────

  it('redirige al dashboard si el usuario es PRODUCER con onboarding completado', async () => {
    const user = userEvent.setup();
    mockSetUserFromLogin.mockResolvedValueOnce(buildProducerUser({ onboardingCompleted: true }));

    render(<SimpleLogin />);
    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockSetUserFromLogin).toHaveBeenCalledWith('productor@test.es');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirige a /onboarding si el productor no ha completado el onboarding', async () => {
    const user = userEvent.setup();
    mockSetUserFromLogin.mockResolvedValueOnce(buildProducerUser({ onboardingCompleted: false }));

    render(<SimpleLogin />);
    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  // ── Credenciales incorrectas (401) ────────────────────────────────────────

  it('muestra error de credenciales incorrectas con 401', async () => {
    const user = userEvent.setup();
    render(<SimpleLogin />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'WrongPass1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // ── Cuenta no aprobada (403) ──────────────────────────────────────────────

  it('muestra el mensaje del servidor cuando el estado es 403', async () => {
    server.use(authErrorHandlers.loginForbidden);
    const user = userEvent.setup();
    render(<SimpleLogin />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/cuenta pendiente de aprobación/i)).toBeInTheDocument();
    });
  });

  // ── Error de servidor (500) ───────────────────────────────────────────────

  it('muestra error genérico de conexión con 500', async () => {
    server.use(authErrorHandlers.loginServerError);
    const user = userEvent.setup();
    render(<SimpleLogin />);

    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument();
    });
  });

  // ── Rol no PRODUCER ───────────────────────────────────────────────────────

  it('muestra error y limpia usuario si el rol no es PRODUCER', async () => {
    const user = userEvent.setup();
    // El MSW acepta productor@test.es + Password1 → después setUserFromLogin devuelve ADMIN
    mockSetUserFromLogin.mockResolvedValueOnce(buildAdminUser());

    render(<SimpleLogin />);
    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockClearUser).toHaveBeenCalled();
      expect(screen.getByText(/tu cuenta no tiene acceso al panel/i)).toBeInTheDocument();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // ── Recuerdo de sesión ────────────────────────────────────────────────────

  it('tiene el checkbox "Recordar mi sesión" y funciona', async () => {
    const user = userEvent.setup();
    render(<SimpleLogin />);

    const checkbox = screen.getByRole('checkbox', { name: /recordar mi sesión/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // ── Estado de carga ───────────────────────────────────────────────────────

  it('no navega hasta que el perfil se carga completamente', async () => {
    const user = userEvent.setup();
    // Login correcto → no hay redirección prematura
    mockSetUserFromLogin.mockResolvedValueOnce(buildProducerUser({ onboardingCompleted: true }));

    render(<SimpleLogin />);
    await user.type(getEmailInput(), 'productor@test.es');
    await user.type(getPasswordInput(), 'Password1');
    await user.click(getSubmitButton());

    // Al final, sí debe navegar
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
    // Y el mock de setUserFromLogin se llamó exactamente una vez
    expect(mockSetUserFromLogin).toHaveBeenCalledTimes(1);
  });
});
