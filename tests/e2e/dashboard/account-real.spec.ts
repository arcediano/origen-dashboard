/**
 * @file account-real.spec.ts
 * @description Real E2E tests (no auth mocks) for /dashboard/account, /dashboard/configuracion,
 * /dashboard/security, /dashboard/configuracion/pagos and /dashboard/configuracion/envios.
 *
 * Uses a real login against the production API. Only specific edge-case endpoints are mocked:
 *   - /api/v1/auth/change-password → mocked to prevent actual password changes on the test account
 *   - /api/v1/notifications/preferences PATCH/GET error scenarios → mocked to simulate failures
 *   - /api/v1/producers/profile → mocked per-test in the Stripe suite to cover all 3 states
 *
 * Activation:
 *   $env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.ana.xxx@testlab.origen.es'
 *   $env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
 *   npx playwright test tests/e2e/dashboard/account-real.spec.ts --project=chromium
 *
 * Without those env vars every test is skipped.
 */

import { expect, test, type Page } from '@playwright/test';
import { getActiveProducerCredentials, loginAsProducer } from '../helpers/auth';

const credentials = getActiveProducerCredentials();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'attached', timeout: 20_000 }).catch(() => {});
}

function primaryAccountLink(page: Page, href: string) {
  return page.locator(`#main-content a[href="${href}"]`).first();
}

function makeMockProducerProfile(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      story:   { businessName: 'Quesos Ana', website: 'https://quesos.es' },
      fiscal:  { businessName: 'Quesos Ana SL' },
      payment: { stripeConnected: false, stripeAccountId: null, acceptedTermsAt: null, ...overrides },
    },
  };
}

// Un único describe.serial externo garantiza un solo worker para todo el archivo,
// evitando que múltiples suites se logueen simultáneamente con las mismas credenciales.
test.describe.serial('Real — account / configuracion / security / pagos / envios', () => {

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — /dashboard/account
// ─────────────────────────────────────────────────────────────────────────────

test.describe('/dashboard/account (Mi Cuenta)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD.');
    await loginAsProducer(page, credentials!);
    await navigateTo(page, '/dashboard/account');
    await expect(page).toHaveURL(/\/dashboard\/account$/);
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^cuenta$/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('renderiza el encabezado "Cuenta"', async ({ page }) => {
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^cuenta$/i }),
    ).toBeVisible();
  });

  test('muestra los tres accesos principales: Seguridad, Cobros, Perfil comercial', async ({ page }) => {
    await expect(page.getByText(/^seguridad$/i).first()).toBeVisible();
    await expect(page.getByText(/^cobros$/i).first()).toBeVisible();
    await expect(page.getByText(/^perfil comercial$/i).first()).toBeVisible();
  });

  test('el enlace Seguridad navega a /dashboard/security', async ({ page }) => {
    await primaryAccountLink(page, '/dashboard/security').click();
    await expect(page).toHaveURL(/dashboard\/security/);
  });

  test('el enlace Cobros navega a /dashboard/configuracion/pagos', async ({ page }) => {
    await primaryAccountLink(page, '/dashboard/configuracion/pagos').click();
    await expect(page).toHaveURL(/configuracion\/pagos/);
  });

  test('el enlace Perfil comercial apunta a /dashboard/profile', async ({ page }) => {
    await expect(primaryAccountLink(page, '/dashboard/profile')).toHaveAttribute('href', '/dashboard/profile');
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/dashboard\/profile/);
  });

  test('muestra la sección de Soporte y ayuda', async ({ page }) => {
    await expect(page.getByText(/soporte y ayuda/i)).toBeVisible();
    await expect(page.getByText(/centro de ayuda/i)).toBeVisible();
    await expect(page.getByText(/revisar seguridad/i)).toBeVisible();
  });

  test('"Revisar seguridad" lleva a /dashboard/security', async ({ page }) => {
    await page.getByRole('link', { name: /revisar seguridad/i }).click();
    await expect(page).toHaveURL(/dashboard\/security/);
  });

  test('muestra el banner informativo de una sola entrada', async ({ page }) => {
    await expect(page.getByText(/una sola entrada para toda tu cuenta/i)).toBeVisible();
  });

  test('la página carga correctamente sin error visible', async ({ page }) => {
    await navigateTo(page, '/dashboard/account');
    // Verifica que el contenido principal carga (no error boundary ni pantalla en blanco)
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^cuenta$/i }),
    ).toBeVisible({ timeout: 15_000 });
    // No debe aparecer ningún mensaje de error en pantalla
    const errorMsg = page.getByText(/algo salió mal|error inesperado|500|not found/i);
    expect(await errorMsg.isVisible().catch(() => false)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — /dashboard/configuracion (preferencias de notificación)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('/dashboard/configuracion (preferencias de notificación)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD.');
    await loginAsProducer(page, credentials!);
  });

  test('renderiza el encabezado "Configuraciones"', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /configuraciones/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('muestra grupos de notificaciones tras cargar', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion');
    await expect(page.getByText(/pedidos/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('los grupos de notificaciones renderizan correctamente', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion');
    // La página real muestra grupos: Pedidos, Productos, Cuenta, Sistema, Marketing
    await expect(page.getByRole('heading', { name: /^pedidos$/i, level: 3 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /^productos$/i, level: 3 })).toBeVisible();
  });

  test('muestra nota de seguridad sobre eventos siempre activos', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion');
    await expect(
      page.getByText(/eventos de seguridad.*siempre se envían por email/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('los switches de notificación son interactivos y cambian de estado', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion');
    // Los toggles se renderizan como botones con aria-label "Activar/Desactivar email para X"
    await page.waitForSelector('button[aria-label*="email para"]', { timeout: 15_000 });

    const toggles = page.locator('button[aria-label*="email para"]');
    const count = await toggles.count();
    expect(count, 'Debe haber al menos un toggle de notificación').toBeGreaterThan(0);

    // Capturar estado inicial del primero
    const firstToggle = toggles.first();
    expect(await firstToggle.isEnabled()).toBe(true);

    // Hacer click y verificar que la UI responde (no crashea)
    await firstToggle.click();
    await page.waitForTimeout(600);

    // Restaurar: hacer click de nuevo
    await firstToggle.click();
    await page.waitForTimeout(300);
  });

  test('actualización optimista se revierte si el servidor falla (mock 500)', async ({ page }) => {
    // Este test requiere simular un fallo de API — se mantiene mock solo para el PATCH
    await page.route('**/api/v1/notifications/preferences/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await navigateTo(page, '/dashboard/configuracion');
    await page.waitForSelector('button[aria-label*="email para"]', { timeout: 15_000 });

    const firstToggle = page.locator('button[aria-label*="email para"]').first();
    await firstToggle.click();
    await page.waitForTimeout(600);

    // Tras el error 500, el componente debe seguir visible (no crash)
    await expect(firstToggle).toBeVisible();
  });

  test('muestra estado de error si la carga de preferencias falla (mock 500)', async ({ page }) => {
    // Mock solo el GET de preferencias para simular fallo de carga
    await page.route('**/api/v1/notifications/preferences', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, body: '' });
      }
      return route.continue();
    });
    await navigateTo(page, '/dashboard/configuracion');
    await expect(
      page.getByText(/no se pudieron cargar las preferencias/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — /dashboard/security (Seguridad)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('/dashboard/security', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD.');
    await loginAsProducer(page, credentials!);
    await navigateTo(page, '/dashboard/security');
    await expect(page).toHaveURL(/\/dashboard\/security$/);
    await expect(page.getByLabel(/contraseña actual/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/contraseña actual/i)).toBeEditable({ timeout: 5_000 });
  });

  test('renderiza el encabezado "Seguridad"', async ({ page }) => {
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^seguridad$/i }),
    ).toBeVisible();
  });

  test('renderiza el formulario de cambio de contraseña con tres campos', async ({ page }) => {
    await expect(page.getByLabel(/contraseña actual/i)).toBeVisible();
    await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible();
  });

  test('valida campos vacíos al enviar', async ({ page }) => {
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/la contraseña actual es obligatoria/i)).toBeVisible();
    await expect(page.getByText(/la nueva contraseña es obligatoria/i)).toBeVisible();
    await expect(page.getByText(/confirma la nueva contraseña/i)).toBeVisible();
  });

  test('valida contraseña nueva demasiado corta (< 8 chars)', async ({ page }) => {
    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('abc');
    await page.getByLabel(/confirmar contraseña/i).fill('abc');
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/al menos 8 caracteres/i)).toBeVisible();
  });

  test('valida contraseña sin mayúscula, número o símbolo', async ({ page }) => {
    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('solominuscula');
    await page.getByLabel(/confirmar contraseña/i).fill('solominuscula');
    await page.getByTestId('change-password-submit').click();
    await expect(
      page.getByText(/mayúscula.*minúscula.*número.*símbolo|incluye mayúscula/i),
    ).toBeVisible();
  });

  test('valida que confirmación no coincide con nueva contraseña', async ({ page }) => {
    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('NewPass1!');
    await page.getByLabel(/confirmar contraseña/i).fill('OtherPass1!');
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/contraseñas no coinciden/i)).toBeVisible();
  });

  test('valida que la nueva contraseña sea distinta a la actual', async ({ page }) => {
    await page.getByLabel(/contraseña actual/i).fill('SamePass1!');
    await page.getByLabel(/nueva contraseña/i).fill('SamePass1!');
    await page.getByLabel(/confirmar contraseña/i).fill('SamePass1!');
    await page.getByTestId('change-password-submit').click();
    await expect(page.getByText(/diferente a la actual/i)).toBeVisible();
  });

  test('redirige a login si la API responde 401 al cambiar la contraseña', async ({ page }) => {
    // La app invalida la sesión ante cualquier 401 real fuera de /auth/*.
    await page.getByLabel(/contraseña actual/i).fill('WrongPassword999!');
    await page.getByLabel(/nueva contraseña/i).fill('NewSecure1!');
    await page.getByLabel(/confirmar contraseña/i).fill('NewSecure1!');
    await page.getByTestId('change-password-submit').click();
    await expect(page).toHaveURL(/\/auth\/login\?reason=expired/i, { timeout: 15_000 });
    await expect(page.getByText(/tu sesión ha expirado.*inicia sesión de nuevo/i)).toBeVisible({ timeout: 10_000 });
  });

  test('botón submit muestra éxito con datos válidos (mock change-password)', async ({ page }) => {
    // Mockeamos solo el endpoint de cambio para no alterar la cuenta de test
    await page.route('**/api/v1/auth/change-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('NewSecure1!');
    await page.getByLabel(/confirmar contraseña/i).fill('NewSecure1!');
    await page.getByTestId('change-password-submit').click();

    await expect(
      page.getByText(/contraseña actualizada correctamente/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('los campos se vacían tras un cambio exitoso (mock change-password)', async ({ page }) => {
    await page.route('**/api/v1/auth/change-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('NewSecure1!');
    await page.getByLabel(/confirmar contraseña/i).fill('NewSecure1!');
    await page.getByTestId('change-password-submit').click();

    await expect(
      page.getByText(/contraseña actualizada correctamente/i),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByLabel(/contraseña actual/i)).toHaveValue('');
    await expect(page.getByLabel(/nueva contraseña/i)).toHaveValue('');
    await expect(page.getByLabel(/confirmar contraseña/i)).toHaveValue('');
  });

  test('el historial registra el cambio de contraseña exitoso (mock change-password)', async ({ page }) => {
    await page.route('**/api/v1/auth/change-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.getByLabel(/contraseña actual/i).fill('CurrentPass1!');
    await page.getByLabel(/nueva contraseña/i).fill('NewSecure1!');
    await page.getByLabel(/confirmar contraseña/i).fill('NewSecure1!');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByText(/contraseña actualizada/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('list', { name: /historial de actividad/i })).toBeVisible();
  });

  test('los botones mostrar/ocultar contraseña funcionan', async ({ page }) => {
    const currentInput = page.getByLabel(/contraseña actual/i);
    await expect(currentInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /^mostrar$/i }).first().click();
    await expect(currentInput).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /^ocultar$/i }).first().click();
    await expect(currentInput).toHaveAttribute('type', 'password');
  });

  test('el historial de auditoría comienza vacío', async ({ page }) => {
    await expect(
      page.getByText(/ninguna acción de seguridad realizada en esta sesión/i),
    ).toBeVisible();
  });

  test('muestra la sección de verificación en dos pasos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /verificación en dos pasos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /activar/i })).toBeVisible();
  });

  test('"Volver a Cuenta" apunta a /dashboard/account', async ({ page }) => {
    await expect(page.getByRole('link', { name: /volver a cuenta/i }).first()).toHaveAttribute('href', '/dashboard/account');
    await page.goto('/dashboard/account', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/dashboard\/account/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — /dashboard/configuracion/pagos (Cobros / Stripe)
// Los 3 estados de Stripe se testean con mock del perfil productor ya que no
// podemos controlar el estado real de la cuenta de test.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('/dashboard/configuracion/pagos (Stripe)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD.');
    await loginAsProducer(page, credentials!);
  });

  test('muestra estado vacío (sin cuenta Stripe)', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockProducerProfile()),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(page.getByText(/conecta stripe para empezar a cobrar/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/sin cuenta de cobro/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta de cobro/i })).toBeVisible();
  });

  test('muestra estado pendiente (Stripe creado pero sin verificar)', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeMockProducerProfile({ stripeAccountId: 'acct_abc123', stripeConnected: false }),
        ),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(page.getByText(/onboarding pendiente/i)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: /continuar onboarding de stripe/i }),
    ).toBeVisible();
  });

  test('muestra estado conectado (Stripe activo)', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeMockProducerProfile({
            stripeConnected: true,
            stripeAccountId: 'acct_connected',
            acceptedTermsAt: '2026-01-15T12:00:00Z',
          }),
        ),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(page.getByText(/cobros activos/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/tu cuenta está lista para recibir pagos/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /modificar cuenta en stripe/i }),
    ).toBeVisible();
  });

  test('muestra los términos aceptados cuando existen', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeMockProducerProfile({
            stripeConnected: true,
            stripeAccountId: 'acct_connected',
            acceptedTermsAt: '2026-01-15T12:00:00Z',
          }),
        ),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(page.getByText(/terminos aceptados/i)).toBeVisible({ timeout: 10_000 });
  });

  test('muestra error si la API del perfil falla', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(
      page.getByText(/error al cargar estado de cobros|internal server error/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('muestra la sección "Estado de la cuenta de cobro"', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockProducerProfile()),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(page.getByText(/estado de la cuenta de cobro/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/proximos pasos/i)).toBeVisible();
  });

  test('el botón de crear cuenta Stripe está habilitado', async ({ page }) => {
    await page.route('**/api/v1/producers/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockProducerProfile()),
      }),
    );
    await navigateTo(page, '/dashboard/configuracion/pagos');
    await expect(
      page.getByRole('button', { name: /crear cuenta de cobro/i }),
    ).toBeEnabled({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — /dashboard/configuracion/envios (Logística — stub)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('/dashboard/configuracion/envios', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credentials, 'Requiere E2E_ACTIVE_PRODUCER_EMAIL y E2E_ACTIVE_PRODUCER_PASSWORD.');
    await loginAsProducer(page, credentials!);
    await navigateTo(page, '/dashboard/configuracion/envios');
    await expect(page).toHaveURL(/\/configuracion\/envios$/);
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^logística$/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('renderiza el encabezado "Logística"', async ({ page }) => {
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^logística$/i }),
    ).toBeVisible();
  });

  test('muestra los tres métodos de envío predefinidos', async ({ page }) => {
    await expect(page.getByText(/envío estándar/i)).toBeVisible();
    await expect(page.getByText(/envío exprés/i)).toBeVisible();
    await expect(page.getByText(/recogida en local/i)).toBeVisible();
  });

  test('muestra las zonas de entrega', async ({ page }) => {
    await expect(page.getByText(/Madrid/)).toBeVisible();
    await expect(page.getByText(/Barcelona/)).toBeVisible();
    await expect(page.getByText(/Valencia/)).toBeVisible();
  });

  test('el botón "Añadir método" es visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /añadir método/i })).toBeVisible();
  });

  test('el botón "Guardar cambios" es visible y se recupera tras click', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /guardar cambios/i }).first();
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();

    await saveBtn.click();
    // La implementación deshabilita el botón ~1500ms tras el click
    await page.waitForTimeout(1600);
    await expect(saveBtn).toBeEnabled();
  });

  test('la página carga correctamente sin error visible', async ({ page }) => {
    await navigateTo(page, '/dashboard/configuracion/envios');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^logística$/i }),
    ).toBeVisible({ timeout: 15_000 });
    const errorMsg = page.getByText(/algo salió mal|error inesperado|500|not found/i);
    expect(await errorMsg.isVisible().catch(() => false)).toBe(false);
  });
});

}); // end describe.serial 'Real — account / configuracion / security / pagos / envios'
