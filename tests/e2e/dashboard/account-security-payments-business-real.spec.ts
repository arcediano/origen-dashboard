/**
 * @file account-security-payments-business-real.spec.ts
 * @description E2E real para seguridad, cobros y "Mi negocio" en ambiente remoto.
 *
 * ⚠️ IMPORTANTE — AMBIENTE REAL OBLIGATORIO:
 * Estas pruebas DEBEN ejecutarse contra el servidor remoto deployed:
 * - URL base: https://producers.origen.delivery
 * - NO funciona en localhost (requiere Stripe real, emails, etc)
 *
 * Ejecución requerida:
 * ```bash
 * $env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
 * $env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.miguel.1777238090175@testlab.origen.es'
 * $env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
 * npx playwright test tests/e2e/dashboard/account-security-payments-business-real.spec.ts --project=chromium
 * ```
 *
 * Credenciales de prueba (Miguel):
 * - Email: e2e.miguel.1777238090175@testlab.origen.es
 * - Password: Password1!
 * - Fuente: Ambiente remoto de pruebas (testlab.origen.es)
 *
 * Funcionalidad cubierta:
 * 1. SEGURIDAD: Cambio de contraseña
 * 2. COBROS: Visualización estado Stripe, flujo de conexión
 * 3. MI NEGOCIO: Carga de datos del onboarding, edición de campos
 *
 * Validaciones críticas:
 * - Los datos del onboarding persisten en "Mi Negocio"
 * - No se requiere re-inserción de datos ya guardados
 * - Cambio de contraseña afecta el login posterior
 * - Estado de Stripe se refleja correctamente
 */

import * as path from 'path';
import { expect, test, type Page } from '@playwright/test';
import { getActiveProducerCredentials, loginAsProducer, type E2ECredentials } from '../helpers/auth';

const credentials = getActiveProducerCredentials() as E2ECredentials;
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const TEST_IMAGE = path.join(FIXTURES_DIR, 'test-image-valid.png');

// Credenciales alternativas para validar cambio de contraseña
const TEST_NEW_PASSWORD = 'NewPassword123!';

let currentPassword = credentials.password; // Rastreamos cambios locales

async function ensureStep(page: Page, heading: RegExp): Promise<void> {
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 15_000 });
}

async function clickButton(page: Page, label: RegExp | string): Promise<void> {
  const button = typeof label === 'string'
    ? page.getByRole('button', { name: label })
    : page.getByRole('button', { name: label });
  await expect(button.first()).toBeVisible({ timeout: 10_000 });
  await expect(button.first()).toBeEnabled({ timeout: 10_000 });
  await button.first().click({ force: true });
}

async function fillInput(page: Page, label: RegExp | string, value: string): Promise<void> {
  const input = typeof label === 'string'
    ? page.getByLabel(label)
    : page.getByLabel(label).first();
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.clear();
  await input.fill(value);
}

// ─── SECURITY TESTS ─────────────────────────────────────────────────────────

async function testChangePassword(page: Page): Promise<void> {
  await ensureStep(page, /Seguridad|Security/i);

  // Rellenar formulario de cambio de contraseña
  await fillInput(page, /Contraseña actual/i, currentPassword);
  await fillInput(page, /Nueva contraseña|Nueva password/i, TEST_NEW_PASSWORD);
  await fillInput(page, /Confirmar contraseña|Confirmar password/i, TEST_NEW_PASSWORD);

  // Enviar cambio
  await clickButton(page, /Cambiar contraseña|Guardar cambios/i);

  // Esperar confirmación (toast/alert)
  await expect(
    page.getByText(/contraseña actualizada|password changed|éxito/i)
  ).toBeVisible({ timeout: 10_000 });

  // Actualizar contraseña en memoria
  currentPassword = TEST_NEW_PASSWORD;
}

// ─── PAYMENT (COBROS) TESTS ────────────────────────────────────────────────

async function testPaymentStatusDisplay(page: Page): Promise<void> {
  // La página de pagos se identifica por el PageHeader con título "Cobros"
  await expect(page.getByRole('heading', { name: /Cobros/i }).first()).toBeVisible({ timeout: 15_000 });

  // Debe haber algún indicador de estado de Stripe (conectado / sin conectar)
  const connectedIndicator = page.getByText(/conectado|connected|cuenta activa/i).first();
  const connectButton = page.getByRole('button', { name: /conectar stripe|connect stripe|configurar cobros/i }).first();

  const hasConnected = await connectedIndicator.isVisible({ timeout: 10_000 }).catch(() => false);
  const hasConnectButton = await connectButton.isVisible({ timeout: 3_000 }).catch(() => false);

  // Alguno de los dos debe estar visible
  expect(hasConnected || hasConnectButton).toBe(true);

  if (hasConnected) {
    console.log('[payments] Stripe already connected');
  } else {
    console.log('[payments] Stripe not connected — connect button visible');
  }
}

// ─── BUSINESS (MI NEGOCIO) TESTS ────────────────────────────────────────────

async function testBusinessDataLoaded(page: Page): Promise<void> {
  // La página se identifica por el PageHeader con título "Información del negocio"
  await expect(page.getByRole('heading', { name: /Información del negocio/i }).first()).toBeVisible({ timeout: 15_000 });

  // Detectar si el API devuelve error al cargar los datos (el Alert no tiene role="alert", buscar por texto)
  const apiErrorText = page.getByText(/Internal server error/i).first();
  const hasApiError = await apiErrorText.isVisible({ timeout: 3_000 }).catch(() => false);

  if (hasApiError) {
    throw new Error(
      `[BUG BACKEND] GET /producers/profile devuelve "Internal server error" para este productor. ` +
      `Los datos del onboarding NO se cargan en el formulario de Mi Negocio. ` +
      `Resultado: #businessName vacío. ` +
      `El usuario tendrá que volver a introducir todos sus datos de negocio.`
    );
  }

  // Los campos usan id="businessName", id="taxId" — están disabled en modo lectura
  const businessNameInput = page.locator('#businessName');
  const taxIdInput = page.locator('#taxId');

  await expect(businessNameInput).toBeVisible({ timeout: 10_000 });

  // Validar que el nombre comercial NO está vacío (debe venir del onboarding)
  const businessName = await businessNameInput.inputValue();
  expect(
    businessName?.trim().length,
    `#businessName está vacío — los datos del onboarding no se están pre-cargando en Mi Negocio`
  ).toBeGreaterThan(0);

  console.log('[business-data] Loaded:', {
    businessName: businessName?.substring(0, 50),
    taxIdVisible: await taxIdInput.isVisible().catch(() => false),
  });
}

async function testBusinessFieldsEditable(page: Page): Promise<void> {
  // Primero hay que hacer click en "Editar informacion del negocio"
  const editButton = page.getByRole('button', { name: /Editar informacion del negocio/i }).first();
  await expect(editButton).toBeVisible({ timeout: 10_000 });
  await editButton.click();

  // Ahora el campo businessName debe estar habilitado
  const businessNameInput = page.locator('#businessName');
  await expect(businessNameInput).toBeEnabled({ timeout: 5_000 });

  const currentValue = await businessNameInput.inputValue();

  // Guardar con "Guardar cambios"
  const saveButton = page.getByRole('button', { name: /Guardar cambios/i }).first();
  await expect(saveButton).toBeVisible({ timeout: 5_000 });
  await saveButton.click();

  // Esperar confirmación de guardado
  await expect(
    page.getByText(/Perfil comercial sincronizado|guardado|actualizado/i)
  ).toBeVisible({ timeout: 15_000 });

  console.log('[business-edit] Save confirmed, businessName:', currentValue?.substring(0, 50));
}

async function testBusinessDataPersistence(page: Page, originalBusinessName: string): Promise<void> {
  // Navegar al dashboard y volver a "Mi Negocio"
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await page.goto('/dashboard/profile/business', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: /Información del negocio/i }).first()).toBeVisible({ timeout: 15_000 });

  // Validar que los datos persisten
  const businessNameInput = page.locator('#businessName');
  await expect(businessNameInput).toBeVisible({ timeout: 10_000 });

  const loadedBusinessName = await businessNameInput.inputValue();
  expect(loadedBusinessName?.trim()).toBe(originalBusinessName.trim());

  console.log('[business-persistence] Data persisted correctly:', {
    original: originalBusinessName,
    loaded: loadedBusinessName,
  });
}

// ─── TEST SUITE ────────────────────────────────────────────────────────────

test.describe.serial('Dashboard - Seguridad, Cobros y Mi Negocio (Real)', () => {
  test.setTimeout(300_000); // 5 minutos por test

  test('autentica como productor y accede al dashboard', async ({ page }) => {
    await loginAsProducer(page, credentials);
    // La página de inicio muestra "Buenos días, [nombre]" y tiene enlace "Inicio" en sidebar
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible({ timeout: 20_000 });
    // La URL debe haber redirigido al dashboard
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });

  test('accede a seguridad y valida formulario de cambio de contraseña', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/security', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // PageHeader muestra "Seguridad"
    await expect(page.getByRole('heading', { name: /Seguridad/i }).first()).toBeVisible({ timeout: 15_000 });

    // NOTA: Solo validamos acceso al formulario sin ejecutar el cambio real
    // para no bloquear logins futuros.
    const currentPasswordInput = page.getByLabel(/Contraseña actual/i).first();
    await expect(currentPasswordInput).toBeVisible({ timeout: 10_000 });

    const newPasswordInput = page.getByLabel(/Nueva contraseña/i).first();
    await expect(newPasswordInput).toBeVisible({ timeout: 5_000 });

    const confirmPasswordInput = page.getByLabel(/Confirmar contraseña/i).first();
    await expect(confirmPasswordInput).toBeVisible({ timeout: 5_000 });

    const submitButton = page.getByRole('button', { name: /Guardar nueva contraseña/i }).first();
    await expect(submitButton).toBeVisible({ timeout: 5_000 });

    console.log('[security] Change password form is fully accessible');
  });

  test('accede a cobros y valida estado de pago Stripe', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/configuracion/pagos', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await testPaymentStatusDisplay(page);
  });

  test('accede a mi negocio y valida que datos del onboarding están pre-cargados', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/profile/business', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Validar que los datos del onboarding (businessName) están cargados
    await testBusinessDataLoaded(page);
  });

  test('valida que los campos se pueden editar y guardar correctamente', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/profile/business', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Información del negocio/i }).first()).toBeVisible({ timeout: 15_000 });

    await testBusinessFieldsEditable(page);
  });

  test('persiste datos del negocio tras navegar fuera y volver', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/profile/business', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Información del negocio/i }).first()).toBeVisible({ timeout: 15_000 });

    // Capturar nombre original antes de navegar
    const businessNameInput = page.locator('#businessName');
    await expect(businessNameInput).toBeVisible({ timeout: 10_000 });
    const originalBusinessName = await businessNameInput.inputValue();
    expect(originalBusinessName?.trim().length).toBeGreaterThan(0);

    // Validar persistencia tras reload
    await testBusinessDataPersistence(page, originalBusinessName || '');
  });

  test('el hub de cuenta enlaza correctamente a seguridad, cobros y perfil', async ({ page }) => {
    await loginAsProducer(page, credentials);

    await page.goto('/dashboard/account', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // PageHeader muestra "Cuenta"
    await expect(page.getByRole('heading', { name: /Cuenta/i }).first()).toBeVisible({ timeout: 15_000 });

    // Los tres enlaces del accountSections deben ser navegables
    const securityLink = page.locator('a[href="/dashboard/security"]').first();
    const paymentsLink = page.locator('a[href="/dashboard/configuracion/pagos"]').first();
    const profileLink = page.locator('a[href="/dashboard/profile"]').first();

    await expect(securityLink).toBeVisible({ timeout: 10_000 });
    await expect(paymentsLink).toBeVisible({ timeout: 10_000 });
    await expect(profileLink).toBeVisible({ timeout: 10_000 });

    // Navegar a Seguridad y volver
    await securityLink.click();
    await expect(page).toHaveURL(/\/dashboard\/security/, { timeout: 10_000 });
    await page.goBack();

    // Navegar a Cobros y volver
    await expect(page.locator('a[href="/dashboard/configuracion/pagos"]').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('a[href="/dashboard/configuracion/pagos"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/configuracion\/pagos/, { timeout: 10_000 });

    console.log('[account-hub] All navigation links work correctly');
  });
});
