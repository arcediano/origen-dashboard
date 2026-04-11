import { expect, test } from '@playwright/test';

import {
  getActiveProducerCredentials,
  loginAsProducer,
} from '../helpers/auth';

const credentials = getActiveProducerCredentials();

test.describe.serial('Regresión de autenticación', () => {
  test('redirige a login si se intenta acceder a /dashboard/security sin sesión', async ({ page }) => {
    await page.goto('/dashboard/security', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
  });

  test('cierra la sesión y redirige a login cuando se dispara session:expired', async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL/PASSWORD o E2E_TEST_EMAIL/PASSWORD.');

    await loginAsProducer(page, credentials!);
    await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 20_000 });

    if (page.url().includes('/onboarding')) {
      test.skip(true, 'La cuenta configurada sigue en onboarding; usa un productor activo.');
    }

    await page.goto('/dashboard/security', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /seguridad/i }).first()).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('session:expired'));
    });

    await expect(page).toHaveURL(/\/auth\/login\?reason=expired/, { timeout: 20_000 });
  });
});
