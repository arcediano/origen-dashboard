/**
 * E2E tests para el flujo de login.
 *
 * Requiere servidor Next.js corriendo en localhost:3001
 * y API gateway disponible (o configurado con mocks).
 *
 * Ejecutar: npx playwright test tests/e2e/auth/login.spec.ts
 */

import { test, expect } from '@playwright/test';

const LOGIN_URL = '/auth/login';
const VALID_EMAIL = process.env.E2E_TEST_EMAIL ?? 'productor@test.es';
const VALID_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'Password1';

test.describe('Flujo de login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test('carga la página de login correctamente', async ({ page }) => {
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByRole('heading', { name: /acceso productores/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /acceder al panel/i })).toBeVisible();
  });

  test('muestra error al enviar formulario vacío', async ({ page }) => {
    await page.getByRole('button', { name: /acceder al panel/i }).click();
    await expect(page.getByText(/el email es requerido/i)).toBeVisible();
  });

  test('muestra error con email inválido', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('noesemail');
    await page.getByLabel(/contraseña/i).fill('Password1');
    await page.getByRole('button', { name: /acceder al panel/i }).click();
    await expect(page.getByText(/introduce un email válido/i)).toBeVisible();
  });

  test('muestra error con contraseña muy corta', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('test@test.es');
    await page.getByLabel(/contraseña/i).fill('abc');
    await page.getByRole('button', { name: /acceder al panel/i }).click();
    await expect(page.getByText(/mínimo 8 caracteres/i)).toBeVisible();
  });

  test('el enlace "¿Olvidaste?" lleva a forgot-password', async ({ page }) => {
    await page.getByText(/olvidaste/i).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('el enlace de registro lleva a la página de registro', async ({ page }) => {
    await page.getByText(/regístrate como productor/i).click();
    await expect(page).toHaveURL(/register/);
  });

  test('el checkbox "Recordar mi sesión" es interactuable', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /recordar mi sesión/i });
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('tiene accesibilidad básica (labels en inputs)', async ({ page }) => {
    const emailInput = page.getByLabel(/correo electrónico/i);
    const passwordInput = page.getByLabel(/contraseña/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    // Los inputs deben ser accesibles por label
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });
});

test.describe('Login con credenciales válidas', () => {
  test('login exitoso redirige al dashboard o onboarding', async ({ page }) => {
    // Este test solo se ejecuta si las credenciales E2E están configuradas
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requiere E2E_TEST_EMAIL configurado');

    await page.goto(LOGIN_URL);
    await page.getByLabel(/correo electrónico/i).fill(VALID_EMAIL);
    await page.getByLabel(/contraseña/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /acceder al panel/i }).click();

    await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 10_000 });
  });
});
