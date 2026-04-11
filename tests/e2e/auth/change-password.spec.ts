import { expect, test } from '@playwright/test';

import {
  getActiveProducerCredentials,
  loginAsProducer,
} from '../helpers/auth';

const credentials = getActiveProducerCredentials();

test.describe.serial('Flujo change-password', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL/PASSWORD o E2E_TEST_EMAIL/PASSWORD.');

    await loginAsProducer(page, credentials!);
    await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 20_000 });

    if (page.url().includes('/onboarding')) {
      test.skip(true, 'La cuenta configurada sigue en onboarding; usa un productor activo.');
    }

    await page.goto('/dashboard/security', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /seguridad/i }).first()).toBeVisible();
  });

  test('muestra error local si la confirmación no coincide', async ({ page }) => {
    await page.getByLabel('Contraseña actual').fill('CurrentPass1!');
    await page.getByLabel('Nueva contraseña').fill('NewSecurePass1!');
    await page.getByLabel('Confirmar contraseña').fill('DifferentPass1!');

    await page.getByTestId('change-password-submit').click();

    await expect(page.getByText(/las contraseñas no coinciden/i)).toBeVisible();
  });

  test('envía el cambio y muestra mensaje de éxito', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await page.route('**/api/v1/auth/change-password', async (route) => {
      const request = route.request();
      capturedBody = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Contraseña actualizada correctamente',
        }),
      });
    });

    await page.getByLabel('Contraseña actual').fill('CurrentPass1!');
    await page.getByLabel('Nueva contraseña').fill('NewSecurePass1!');
    await page.getByLabel('Confirmar contraseña').fill('NewSecurePass1!');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByText(/contraseña actualizada correctamente/i)).toBeVisible();
    await expect(page.getByText(/inicia sesión de nuevo en otros dispositivos/i)).toBeVisible();
    await expect(page.getByLabel('Contraseña actual')).toHaveValue('');
    await expect(page.getByLabel('Nueva contraseña')).toHaveValue('');
    await expect(page.getByLabel('Confirmar contraseña')).toHaveValue('');

    expect(capturedBody).toEqual({
      currentPassword: 'CurrentPass1!',
      newPassword: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });
  });
});
