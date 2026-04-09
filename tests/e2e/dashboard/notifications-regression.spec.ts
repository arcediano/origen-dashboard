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
  await expect(page.getByRole('heading', { name: /notificaciones/i })).toBeVisible();
  await expect(page.locator('#notifications-inbox')).toBeVisible();
  await expect(page.locator('#notifications-preferences')).toBeVisible();
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
    await expect(unreadBadge).toBeVisible();

    await openNotificationBell(page);
    await expect(page.getByText(/notificaciones/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ver todas/i })).toHaveAttribute('href', '/dashboard/notifications');
  });

  test('permite marcar una notificación desde la campana y reduce el contador', async ({ page }) => {
    const unreadBadge = await getUnreadBadge(page);
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

  test('el centro de actividad filtra, marca todas y persiste preferencias', async ({ page }) => {
    await goToNotificationsCenter(page);

    const inbox = page.locator('#notifications-inbox');
    await expect(inbox.getByText(/tienes/i)).toBeVisible();

    await inbox.getByRole('button', { name: /cuenta y sistema/i }).click();
    await expect(inbox.getByText(/hoy|ultimos 7 dias|anteriores/i).first()).toBeVisible();

    const markAllButton = inbox.getByRole('button', { name: /marcar todas/i });
    if (await markAllButton.isEnabled()) {
      await markAllButton.click();
      await expect(inbox.getByText(/0 notificación\(es\) sin leer|0 notificaciones sin leer/i)).toBeVisible({ timeout: 15_000 });
    }

    const preferences = page.locator('#notifications-preferences');
    await expect(preferences.getByText(/email/i).first()).toBeVisible();

    const marketingToggle = page.getByRole('switch', { name: /marketing y promociones/i }).first();
    await marketingToggle.click();

    const saveButton = page.getByRole('button', { name: /guardar preferencias|preferencias guardadas|¡guardado!/i }).first();
    await saveButton.click();

    await expect(page.getByRole('button', { name: /preferencias guardadas|¡guardado!/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});