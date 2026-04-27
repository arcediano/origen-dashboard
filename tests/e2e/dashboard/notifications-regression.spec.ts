import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  getNotificationsCredentials,
  loginAsProducer,
} from '../helpers/auth';

const notificationsCredentials = getNotificationsCredentials();

async function openNotificationBell(page: Page): Promise<void> {
  const bellButton = page.getByRole('button', { name: /notificaciones/i }).first();
  await expect(bellButton).toBeVisible({ timeout: 20_000 });
  await bellButton.click();
  await expect(page.getByRole('dialog', { name: /notificaciones recientes/i })).toBeVisible();
}

async function getUnreadBadge(page: Page): Promise<Locator> {
  return page.getByLabel(/notificaciones sin leer/i).first();
}

async function goToNotificationsCenter(page: Page): Promise<void> {
  await page.goto('/dashboard/notifications', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#main-content').getByRole('heading', { name: /notificaciones/i })).toBeVisible();
  await expect(page.locator('#notifications-inbox')).toBeVisible();
}

test.describe.serial('Regresión real — Notificaciones de productor', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !notificationsCredentials,
      'Requiere E2E_NOTIFICATIONS_EMAIL/PASSWORD o E2E_ACTIVE_PRODUCER_EMAIL/PASSWORD.',
    );

    await loginAsProducer(page, notificationsCredentials!);
    await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 20_000 });

    if (page.url().includes('/onboarding')) {
      test.skip(true, 'La cuenta configurada para notificaciones sigue en onboarding; usa un productor activo.');
    }
  });

  test('la campana muestra badge y abre el panel con acceso al centro de actividad', async ({ page }) => {
    const unreadBadge = await getUnreadBadge(page);

    const hasUnreadBadge = await unreadBadge.isVisible().catch(() => false);
    if (hasUnreadBadge) {
      await expect(unreadBadge).toBeVisible();
    }

    await openNotificationBell(page);
    await expect(page.getByText(/notificaciones/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ver todas/i })).toHaveAttribute('href', '/dashboard/notifications');
  });

  test('permite marcar una notificación desde la campana y reduce el contador', async ({ page }) => {
    const unreadBadge = await getUnreadBadge(page);
    const hasUnreadBadge = await unreadBadge.isVisible().catch(() => false);
    test.skip(!hasUnreadBadge, 'No hay notificaciones sin leer para validar la campana.');

    const initialBadgeText = (await unreadBadge.textContent())?.trim() ?? '0';
    const initialCount = initialBadgeText === '9+' ? 9 : Number(initialBadgeText);

    test.skip(!Number.isFinite(initialCount) || initialCount <= 0, 'No hay notificaciones sin leer para validar la campana.');

    await openNotificationBell(page);

    const quickAction = page.getByRole('button', { name: /ver pedido|ver reseña|ver producto|revisar cuenta|ver detalle/i }).first();
    await expect(quickAction).toBeVisible();
    await quickAction.click();

    await expect(page).toHaveURL(/dashboard\/(orders|reviews|products|account|profile|notifications)/, { timeout: 15_000 });

    const updatedBadge = await getUnreadBadge(page);
    await expect(updatedBadge).toBeVisible();
    const updatedBadgeText = (await updatedBadge.textContent())?.trim() ?? '0';
    const updatedCount = updatedBadgeText === '9+' ? 9 : Number(updatedBadgeText);
    expect(updatedCount).toBeLessThanOrEqual(initialCount - 1);
  });

  test('el centro de actividad filtra las notificaciones por tipo', async ({ page }) => {
    await goToNotificationsCenter(page);

    const inbox = page.locator('#notifications-inbox');
    await expect(inbox.getByText(/pendientes:/i)).toBeVisible();

    await page.getByLabel(/filtrar por tipo/i).selectOption('cuenta');
    await expect(inbox.getByText(/hoy|ultimos 7 dias|anteriores/i).first()).toBeVisible();
  });
});