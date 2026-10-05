/**
 * Tests de integración para el formulario de registro (SimpleRegistration).
 *
 * Nota: la validación react-hook-form con mode:'onChange' y happy-dom
 * requiere eventos DOM nativos. Los tests usan fireEvent para mayor fiabilidad.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../helpers/render';
import { server } from '../../mocks/server';
import { authErrorHandlers } from '../../mocks/handlers/auth.handlers';
import { TEST_API_BASE } from '../../mocks/api-base';
import { SimpleRegistration } from '@/components/features/registration/SimpleRegistration';

function getInputByName(name: string): HTMLInputElement {
  const el = document.querySelector(`input[name="${name}"]`);
  expect(el).not.toBeNull();
  return el as HTMLInputElement;
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/register',
}));

vi.mock('@/constants/categories', () => ({
  PRODUCER_CATEGORIES: [
    { id: 'agricola', name: 'Agrícola', description: 'Cultivos', subcategories: [] },
    { id: 'artesano', name: 'Artesano', description: 'Artesanía', subcategories: [] },
  ],
}));

vi.mock('@/constants/provinces', () => ({
  PROVINCIAS_ESPANA: ['Madrid', 'Segovia', 'Barcelona'],
}));

vi.mock('@/constants/cp-provincias', () => ({
  getProvinciaFromCP: (cp: string) => {
    if (cp === '40001') return 'Segovia';
    if (cp === '28001') return 'Madrid';
    return null;
  },
}));

vi.mock('@/components/features/registration/hooks/useAutosave', () => ({
  useAutosave: () => ({
    loadDraft: () => null,
    clearDraft: vi.fn(),
  }),
}));

describe('SimpleRegistration — Formulario de registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renderizado ────────────────────────────────────────────────────────────

  it('renderiza los campos principales del formulario', () => {
    render(<SimpleRegistration />);
    expect(getInputByName('contactName')).toBeInTheDocument();
    expect(getInputByName('email')).toBeInTheDocument();
    expect(getInputByName('password')).toBeInTheDocument();
    expect(getInputByName('confirmPassword')).toBeInTheDocument();
    expect(getInputByName('businessName')).toBeInTheDocument();
    expect(getInputByName('phone')).toBeInTheDocument();
  });

  it('el botón "Enviar solicitud" siempre está activo y, con campos vacíos, avisa de que hay campos en rojo', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);
    const button = screen.getByRole('button', { name: /enviar solicitud/i });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(await screen.findByText(/campos marcados en rojo/i)).toBeInTheDocument();
  });

  it('la textarea de historia acepta y muestra texto escrito', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const textarea = screen.getByPlaceholderText(/quién eres/i);
    await user.type(textarea, 'Mi historia como productor');
    expect(textarea).toHaveValue('Mi historia como productor');
  });

  it('el campo de email acepta texto', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const emailInput = getInputByName('email');
    await user.type(emailInput, 'test@test.es');
    expect(emailInput).toHaveValue('test@test.es');
  });

  it('el campo de código postal acepta texto', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const cpInput = getInputByName('postalCode');
    await user.type(cpInput, '28001');
    expect(cpInput).toHaveValue('28001');
  });

  it('el campo de contraseña oculta el texto por defecto (type=password)', () => {
    render(<SimpleRegistration />);
    const pwInput = getInputByName('password');
    expect(pwInput).toHaveAttribute('type', 'password');
  });

  // ── Validación con react-hook-form (mode: onChange) ───────────────────────

  it('muestra error de validación en el email cuando es inválido', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const emailInput = getInputByName('email');
    await user.type(emailInput, 'notvalid');
    // Disparar blur para asegurar que la validación corre
    fireEvent.blur(emailInput);

    await waitFor(() => {
      // El campo debería tener aria-invalid=true cuando hay error
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 2000 });
  });

  it('muestra error de validación en teléfono cuando el formato es incorrecto', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const phoneInput = screen.getByPlaceholderText(/600 000 000/i);
    await user.type(phoneInput, '123');
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 2000 });
  });

  it('el campo confirmPassword tiene type=password', () => {
    render(<SimpleRegistration />);
    const confirmInput = getInputByName('confirmPassword');
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  // ── MSW — Email duplicado (409) ───────────────────────────────────────────

  it('el handler MSW devuelve 409 para email ya registrado', async () => {
    server.use(authErrorHandlers.registerConflict);

    const response = await fetch(`${TEST_API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.es' }),
    });

    expect(response.status).toBe(409);
    const data = await response.json() as { message: string };
    expect(data.message).toMatch(/email ya está registrado/i);
  });

  it('el handler MSW del registro exitoso devuelve 200 con trackingCode', async () => {
    const response = await fetch(`${TEST_API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nuevo@test.es', password: 'Password1' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json() as { data: { trackingCode: string } };
    expect(data.data.trackingCode).toBe('TRACK-001');
  });
});
