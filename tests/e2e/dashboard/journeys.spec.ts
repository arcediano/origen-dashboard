import { test, expect } from '@playwright/test';

import {
  getActiveProducerCredentials,
  getPendingOnboardingCredentials,
  loginAsProducer,
} from '../helpers/auth';

const pendingOnboardingCredentials = getPendingOnboardingCredentials();
const activeProducerCredentials = getActiveProducerCredentials();

test.describe.serial('Flujos encadenados de productores', () => {
  test.describe('Login', () => {
    test('muestra un error claro cuando las credenciales son incorrectas', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByLabel(/correo electrónico/i).fill('credencial-invalida@origen.test');
      await page.locator('input[type="password"]').fill('Password1!');
      await page.getByRole('button', { name: /acceder al panel/i }).click();

      await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe('Onboarding', () => {
    test('despues del login pendiente redirige a onboarding y permite alternar la direccion de facturacion', async ({ page }) => {
      test.skip(
        !pendingOnboardingCredentials,
        'Requiere E2E_PENDING_ONBOARDING_EMAIL y E2E_PENDING_ONBOARDING_PASSWORD o E2E_ONBOARDING_EMAIL y E2E_ONBOARDING_PASSWORD.',
      );

      await loginAsProducer(page, pendingOnboardingCredentials!);

      await expect(page).toHaveURL(/onboarding/, { timeout: 15_000 });
      await expect(page.getByLabel(/nombre de la vía/i).first()).toBeVisible();

      const billingCheckbox = page.getByLabel(/la dirección de facturación es la misma que la de producción/i);
      await expect(billingCheckbox).toBeChecked();

      await billingCheckbox.click();

      await expect(billingCheckbox).not.toBeChecked();
      await expect(page.getByLabel(/piso \/ puerta/i)).toBeVisible();
    });
  });

  test.describe('Registro de productos', () => {
    test('despues del login activo permite iniciar el alta y avanzar al paso de imagenes', async ({ page }) => {
      test.skip(
        !activeProducerCredentials,
        'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD o E2E_TEST_EMAIL y E2E_TEST_PASSWORD.',
      );

      await loginAsProducer(page, activeProducerCredentials!);

      await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 15_000 });

      await page.goto('/dashboard/products/create');
      await expect(page.getByRole('heading', { name: /crear producto/i })).toBeVisible();
      await expect(page.getByText(/información básica/i)).toBeVisible();

      const uniqueName = `Producto E2E ${Date.now()}`;
      await page.getByLabel(/nombre del producto/i).fill(uniqueName);
      await page.getByLabel(/descripción corta/i).fill(
        'Producto de prueba para validar el flujo encadenado de alta desde el panel de productores.',
      );

      const categoryTrigger = page.getByRole('button', { name: /seleccionar categoría/i }).first();
      await categoryTrigger.click();
      await page.getByText(/^Quesos$/).click();

      await page.getByRole('button', { name: /^Siguiente$/i }).click();

      await expect(page.getByText(/galería de imágenes/i)).toBeVisible();
      await expect(page.getByText(/paso 2 de 8|paso 2 de 7/i)).toBeVisible();
    });
  });
});