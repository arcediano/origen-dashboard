import { expect, test } from '@playwright/test';

import { getActiveProducerCredentials, loginAsProducer } from '../helpers/auth';
import { DASHBOARD_SMOKE_ROUTES } from '../../shared/dashboard-smoke-routes';

const activeProducerCredentials = getActiveProducerCredentials();

test.describe('Dashboard home y secciones smoke', () => {
  test('home renderiza bloques clave tras login', async ({ page }) => {
    test.skip(
      !activeProducerCredentials,
      'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD o E2E_TEST_EMAIL y E2E_TEST_PASSWORD.',
    );

    await loginAsProducer(page, activeProducerCredentials!);
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/acciones rápidas/i)).toBeVisible();
    await expect(page.getByText(/pedidos recientes/i)).toBeVisible();
  });

  test('todas las rutas smoke del dashboard cargan sin error de runtime', async ({ page }) => {
    test.skip(
      !activeProducerCredentials,
      'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD o E2E_TEST_EMAIL y E2E_TEST_PASSWORD.',
    );

    await loginAsProducer(page, activeProducerCredentials!);

    for (const route of DASHBOARD_SMOKE_ROUTES) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

      expect(response?.status() ?? 500).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
      await expect(page.locator('body')).not.toContainText(/404|application error|something went wrong|error inesperado/i);
    }
  });
});
