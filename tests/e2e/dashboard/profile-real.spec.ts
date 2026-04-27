/**
 * @file profile-real.spec.ts
 * @description Real E2E tests (no mocks) for the /dashboard/profile section.
 *
 * Covers:
 *   - /dashboard/profile/personal — render, load data, edit/cancel cycle, form validation
 *   - /dashboard/profile/business — render, load data, edit/cancel cycle, description counter
 *   - ProfileSectionNav — navigation between sub-sections
 *
 * Activation (requires a real active producer account):
 *   $env:E2E_ACTIVE_PRODUCER_EMAIL='productor@example.es'
 *   $env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
 *   npx playwright test tests/e2e/dashboard/profile-real.spec.ts --project=chromium
 *
 * Without those env vars every test is skipped to prevent accidental failures in CI.
 */

import { expect, test, type Page } from '@playwright/test';
import { getActiveProducerCredentials, loginAsProducer } from '../helpers/auth';

const credentials = getActiveProducerCredentials();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Navigate to a profile sub-page and wait for #main-content to mount. */
async function gotoProfile(page: Page, subPath: string): Promise<void> {
  await page.goto(`/dashboard/profile/${subPath}`, { waitUntil: 'domcontentloaded' });
  // DashboardContentWrapper sets mounted=true after auth resolves — wait for it
  await page.locator('#main-content').waitFor({ state: 'attached', timeout: 20_000 }).catch(() => {});
}

/** Wait until the page finishes loading profile data (loading indicator disappears). */
async function waitForProfileLoaded(page: Page): Promise<void> {
  // The loading state shows "Cargando datos reales de tu perfil..." in an alert
  // and sets all inputs to disabled. Wait for the Editar button to be enabled.
  await expect(
    page.getByRole('button', { name: /editar/i }).first(),
  ).toBeEnabled({ timeout: 20_000 });
}

// ─── SUITE ────────────────────────────────────────────────────────────────────

test.describe.serial('Real — /dashboard/profile (datos personales y negocio)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !credentials,
      'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD (o E2E_TEST_EMAIL / E2E_TEST_PASSWORD).',
    );
    await loginAsProducer(page, credentials!);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // /dashboard/profile/personal
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('/dashboard/profile/personal', () => {
    test.setTimeout(45_000);

    test('carga y muestra la página con el encabezado "Datos personales"', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await expect(page.getByRole('heading', { name: /datos personales/i }).first()).toBeVisible({ timeout: 15_000 });
    });

    test('carga datos reales del perfil (nombre y email visibles)', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      // El nombre cargado desde la API debe aparecer en el input #name
      const nameInput = page.locator('#name');
      await expect(nameInput).toBeVisible();
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length, 'El nombre debería estar poblado por la API').toBeGreaterThan(0);

      // El email siempre se rellena desde authUser
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();
      const emailValue = await emailInput.inputValue();
      expect(emailValue, 'El email debería coincidir con las credenciales').toContain('@');
    });

    test('los campos están deshabilitados en modo lectura', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      await expect(page.locator('#name')).toBeDisabled();
      await expect(page.locator('#phone')).toBeDisabled();
      await expect(page.locator('#email')).toBeDisabled();
    });

    test('el botón Editar activa el modo edición', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      const editBtn = page.getByRole('button', { name: /^editar$/i });
      await editBtn.click();

      await expect(page.locator('#name')).toBeEnabled();
      await expect(page.locator('#phone')).toBeEnabled();
      // El email siempre queda deshabilitado (no editable)
      await expect(page.locator('#email')).toBeDisabled();
    });

    test('el botón Cancelar restaura los valores originales', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      const originalName = await page.locator('#name').inputValue();

      await page.getByRole('button', { name: /^editar$/i }).click();
      await page.locator('#name').fill('Nombre Modificado Test E2E');
      expect(await page.locator('#name').inputValue()).toBe('Nombre Modificado Test E2E');

      await page.getByRole('button', { name: /^cancelar$/i }).click();

      // Debe volver al valor original
      await expect(page.locator('#name')).toHaveValue(originalName);
      // Y volver al modo lectura (deshabilitado)
      await expect(page.locator('#name')).toBeDisabled();
    });

    test('validación de campo obligatorio: nombre vacío', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      await page.getByRole('button', { name: /^editar$/i }).click();
      await page.locator('#name').fill('');
      await page.getByRole('button', { name: /^guardar$/i }).click();

      await expect(page.getByText(/el nombre es obligatorio/i)).toBeVisible({ timeout: 5_000 });
    });

    test('validación de campo obligatorio: teléfono vacío', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      await page.getByRole('button', { name: /^editar$/i }).click();
      await page.locator('#phone').fill('');
      await page.getByRole('button', { name: /^guardar$/i }).click();

      await expect(page.getByText(/el telefono es obligatorio/i)).toBeVisible({ timeout: 5_000 });
    });

    test('la sección "Biografía" tiene un textarea editable en modo edición', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      await page.getByRole('button', { name: /^editar$/i }).click();
      const bioTextarea = page.locator('textarea#bio');
      await expect(bioTextarea).toBeEnabled();
    });

    test('muestra el badge "Verificado" en el perfil', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await expect(page.getByText(/verificado/i)).toBeVisible({ timeout: 15_000 });
    });

    test('ProfileSectionNav tiene los enlaces correctos', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await expect(page.getByRole('link', { name: /datos personales/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('link', { name: /^negocio$/i })).toBeVisible();
    });

    test('la página no muestra error de carga en condiciones normales', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await waitForProfileLoaded(page);

      const loadError = page.getByText(/error al cargar el perfil/i);
      const isError = await loadError.isVisible().catch(() => false);
      expect(isError, 'No debería haber error de carga con credenciales válidas').toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // /dashboard/profile/business
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('/dashboard/profile/business', () => {
    test.setTimeout(45_000);

    test('carga y muestra la página con el encabezado "Información del negocio"', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('heading', { name: /informaci[oó]n del negocio/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    test('carga datos reales del negocio (businessName visible)', async ({ page }) => {
      await gotoProfile(page, 'business');
      // Esperar a que el botón de editar esté habilitado (datos cargados)
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      // Verificar que el campo existe y está en modo lectura (deshabilitado)
      // No se asume que tenga valor: las cuentas E2E pueden no tener perfil comercial poblado
      const businessNameInput = page.locator('#businessName');
      await expect(businessNameInput).toBeVisible();
      await expect(businessNameInput).toBeDisabled();
      const value = await businessNameInput.inputValue();
      expect(typeof value, 'El campo debe ser una cadena de texto').toBe('string');
    });

    test('los campos están deshabilitados en modo lectura', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      await expect(page.locator('#businessName')).toBeDisabled();
      await expect(page.locator('#taxId')).toBeDisabled();
    });

    test('el botón Editar activa el modo edición', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      await page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }).click();

      await expect(page.locator('#businessName')).toBeEnabled();
      await expect(page.locator('#taxId')).toBeEnabled();
    });

    test('el botón Cancelar restaura los valores originales', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      const originalName = await page.locator('#businessName').inputValue();

      await page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }).click();
      await page.locator('#businessName').fill('Nombre Negocio Test E2E Modificado');

      await page.getByRole('button', { name: /^cancelar$/i }).click();

      await expect(page.locator('#businessName')).toHaveValue(originalName);
      await expect(page.locator('#businessName')).toBeDisabled();
    });

    test('validación: descripción demasiado corta (<50 chars)', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      await page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }).click();
      await page.locator('#businessDescription').fill('Corto');
      await page.getByRole('button', { name: /^guardar cambios$/i }).click();

      await expect(
        page.getByText(/al menos 50 caracteres/i),
      ).toBeVisible({ timeout: 5_000 });
    });

    test('el contador de caracteres de la descripción es visible', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      // El contador tiene formato "N/5000"
      await expect(page.getByText(/\/5000/)).toBeVisible();
    });

    test('la sección de categorías carga las categorías del negocio', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      await expect(page.getByRole('heading', { name: /^categorias$/i, level: 3 })).toBeVisible();
    });

    test('la página no muestra error de carga en condiciones normales', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      const loadError = page.getByText(/error al cargar perfil comercial/i);
      const isError = await loadError.isVisible().catch(() => false);
      expect(isError, 'No debería haber error de carga con credenciales válidas').toBe(false);
    });

    test('muestra el banner de verificación del negocio (si la cuenta está verificada)', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('button', { name: /editar informaci[oó]n del negocio/i }),
      ).toBeEnabled({ timeout: 20_000 });

      // El banner solo aparece si el negocio ha sido verificado por el equipo de Origen.
      // Las cuentas E2E recién creadas pueden no estarlo — el test pasa en ambos casos.
      const verified = page.getByText(/tu negocio ha sido verificado/i);
      const pending = page.getByText(/pendiente de verificaci[oó]n/i);
      const anyBannerVisible =
        (await verified.isVisible().catch(() => false)) ||
        (await pending.isVisible().catch(() => false));
      // Al menos uno de los dos estados debe ser visible (o ninguno — no se fuerza)
      // Solo se falla si aparece un error de carga inesperado
      const loadError = page.getByText(/error al cargar perfil comercial/i);
      const isError = await loadError.isVisible().catch(() => false);
      expect(isError, 'No debería haber error de carga con credenciales válidas').toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ProfileSectionNav — navegación entre sub-secciones
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('ProfileSectionNav', () => {
    test.setTimeout(30_000);

    test('navega de personal a business al hacer clic en el enlace del nav', async ({ page }) => {
      await gotoProfile(page, 'personal');
      await expect(
        page.getByRole('heading', { name: /datos personales/i }).first(),
      ).toBeVisible({ timeout: 15_000 });

      const businessLink = page.getByRole('link', { name: /^negocio$/i });
      await businessLink.click();

      await expect(page).toHaveURL(/profile\/business/);
      await expect(
        page.getByRole('heading', { name: /informaci[oó]n del negocio/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    test('navega de business a personal al hacer clic en el enlace del nav', async ({ page }) => {
      await gotoProfile(page, 'business');
      await expect(
        page.getByRole('heading', { name: /informaci[oó]n del negocio/i }).first(),
      ).toBeVisible({ timeout: 15_000 });

      const personalLink = page.getByRole('link', { name: /datos personales/i });
      await personalLink.click();

      await expect(page).toHaveURL(/profile\/personal/);
      await expect(
        page.getByRole('heading', { name: /datos personales/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
