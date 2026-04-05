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
    expect(screen.getByPlaceholderText(/Ej: María/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mín\. 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repite la contraseña/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Huerta Ecológica/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/600 000 000/i)).toBeInTheDocument();
  });

  it('el botón muestra "Completar registro" cuando el formulario no es válido', () => {
    render(<SimpleRegistration />);
    // Cuando el formulario está vacío/inválido, el botón muestra "Completar registro"
    expect(screen.getByRole('button', { name: /completar registro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completar registro/i })).toBeDisabled();
  });

  it('tiene los checkboxes de términos y privacidad desmarcados por defecto', () => {
    render(<SimpleRegistration />);
    expect(screen.getByLabelText(/acepto los términos/i)).not.toBeChecked();
    expect(screen.getByLabelText(/acepto la política/i)).not.toBeChecked();
  });

  it('los checkboxes de términos y privacidad son interactuables', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const termsCheckbox = screen.getByLabelText(/acepto los términos/i);
    await user.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    await user.click(termsCheckbox);
    expect(termsCheckbox).not.toBeChecked();
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

    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i);
    await user.type(emailInput, 'test@test.es');
    expect(emailInput).toHaveValue('test@test.es');
  });

  it('el campo de código postal acepta texto', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const cpInput = screen.getByPlaceholderText(/Ej: 28001/i);
    await user.type(cpInput, '28001');
    expect(cpInput).toHaveValue('28001');
  });

  it('el campo de contraseña oculta el texto por defecto (type=password)', () => {
    render(<SimpleRegistration />);
    const pwInput = screen.getByPlaceholderText(/Mín\. 8 caracteres/i);
    expect(pwInput).toHaveAttribute('type', 'password');
  });

  // ── Validación con react-hook-form (mode: onChange) ───────────────────────

  it('muestra error de validación en el email cuando es inválido', async () => {
    const user = userEvent.setup();
    render(<SimpleRegistration />);

    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i);
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
    const confirmInput = screen.getByPlaceholderText(/Repite la contraseña/i);
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
