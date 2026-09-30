/**
 * @file registro-login-onboarding.spec.ts
 * @description E2E completo: registro de productor, login y onboarding (7 pasos).
 *
 * Credenciales de test generadas en el registro:
 *   Email:    e2e-productor-<timestamp>@test.es
 *   Password: TestE2E-Prod2024!
 *
 * Para login con cuenta real:
 *   E2E_TEST_EMAIL=<email>
 *   E2E_TEST_PASSWORD=<password>
 *
 * Ejecutar:
 *   npx playwright test tests/e2e/auth/registro-login-onboarding.spec.ts --workers=1
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { setAuthCookie } from '../helpers/jwt-cookie';

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const TEST_DOCUMENT = path.join(FIXTURES_DIR, 'test-document.txt');
const TEST_IMAGE = path.join(FIXTURES_DIR, 'test-image.png');

// ─── CREDENCIALES ─────────────────────────────────────────────────────────────

const TEST_TIMESTAMP = Date.now();
const NEW_USER_EMAIL = `e2e-productor-${TEST_TIMESTAMP}@test.es`;
const NEW_USER_PASSWORD = 'TestE2E-Prod2024!';

// ─── MOCK HELPERS ─────────────────────────────────────────────────────────────

async function mockRegistrationApi(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/register', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            trackingCode: 'ORIG-TEST-001',
            email: NEW_USER_EMAIL,
            message: 'Solicitud recibida correctamente.',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

async function mockLoginApi(page: Page, email: string, onboardingCompleted = false): Promise<void> {
  await page.route('**/api/v1/auth/login', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-jwt-token',
            user: {
              id: 99,
              email,
              firstName: 'Test',
              lastName: 'Productor',
              role: 'PRODUCER',
              onboardingCompleted,
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // setUserFromLogin calls /api/v1/auth/userinfo after login
  await page.route('**/api/v1/auth/userinfo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 99,
          email,
          firstName: 'Test',
          lastName: 'Productor',
          role: 'PRODUCER',
          producerCode: 'PROD-099',
          onboardingCompleted,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      }),
    });
  });
}

async function mockOnboardingApis(page: Page): Promise<void> {
  // Auth userinfo
  await page.route('**/api/v1/auth/userinfo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 42,
          email: 'e2e-onboarding@test.es',
          firstName: 'E2E',
          lastName: 'Productor',
          role: 'PRODUCER',
          producerCode: 'PROD-042',
          onboardingCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      }),
    });
  });

  // Notificaciones
  await page.route('**/api/v1/notifications/unread-count', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { count: 0 } }),
    });
  });

  // Cargar datos de onboarding (vacíos — primer acceso)
  await page.route('**/api/v1/producers/onboarding/data', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            fiscal: { businessName: 'Huerta E2E', entityType: null, taxId: '', businessPhone: '', categories: [] },
            location: null,
            story: { businessName: 'Huerta E2E' },
            visual: {},
            logistics: null,
            documents: [],
            certifications: [],
            payment: { stripeConnected: false, stripeAccountId: null, acceptedTermsAt: null },
            onboarding: { currentStep: 1, completedSteps: [] },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Save endpoints
  const stepPaths = [
    '**/api/v1/producers/onboarding/step/1',
    '**/api/v1/producers/onboarding/step/2',
    '**/api/v1/producers/onboarding/step/3',
    '**/api/v1/producers/onboarding/step/4',
    '**/api/v1/producers/onboarding/step/5',
  ];
  for (const p of stepPaths) {
    await page.route(p, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
  }

  // Completar onboarding
  await page.route('**/api/v1/producers/onboarding/complete', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { onboardingCompleted: true } }),
    });
  });

  // Upload proxy
  await page.route('**/api/upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { key: `test/file-${Date.now()}.bin`, url: 'https://cdn.test.es/test/file' },
      }),
    });
  });

  // Upload presigned S3
  await page.route('**/api/presigned-upload**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          key: `test/file-${Date.now()}`,
          uploadUrl: 'https://s3.test.es/upload',
          publicUrl: 'https://cdn.test.es/test/file',
        },
      }),
    });
  });

  // Categorías
  await page.route('**/api/v1/categories/tree**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'cat-1',
            name: 'Frutas y Verduras',
            slug: 'frutas-verduras',
            children: [
              { id: 'cat-1-1', name: 'Frutas', slug: 'frutas' },
              { id: 'cat-1-2', name: 'Verduras', slug: 'verduras' },
            ],
          },
          { id: 'cat-2', name: 'Lácteos', slug: 'lacteos', children: [] },
        ],
      }),
    });
  });

  // Envíos — cobertura de Origen para el CP del negocio (ADR-020)
  await page.route('**/api/v1/producers/onboarding/shipping-coverage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          status: 'COVERED',
          postalCode: '28001',
          canDelegate: true,
          pickupRoute: { id: 'r1', name: 'Ruta Madrid Centro', warehouseName: 'Almacén Madrid' },
          currentChoice: null,
        },
      }),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: REGISTRO DE PRODUCTOR
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Registro de productor — formulario completo', () => {
  test.beforeEach(async ({ page }) => {
    await mockRegistrationApi(page);
    await page.goto('/auth/register');
    await page.waitForLoadState('domcontentloaded');
  });

  test('carga la página de registro con todos los campos', async ({ page }) => {
    await expect(page).toHaveURL('/auth/register');
    // Sección 1 — Datos personales (usamos name attribute que registra react-hook-form)
    await expect(page.locator('input[name="contactName"]')).toBeVisible();
    await expect(page.locator('input[name="contactSurname"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    // Sección 2 — Negocio
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    // Términos
    await expect(page.getByLabel(/acepto los términos/i)).toBeVisible();
    await expect(page.getByLabel(/acepto la política/i)).toBeVisible();
  });

  test('rellena y envía el formulario completo — flujo feliz mocked', async ({ page }) => {
    // ── Sección 1: Datos personales ────────────────────────────────────────
    await page.locator('input[name="contactName"]').fill('Ana');
    await page.locator('input[name="contactSurname"]').fill('García Rodríguez');
    await page.locator('input[name="email"]').fill(NEW_USER_EMAIL);
    await page.locator('input[name="phone"]').fill('612345678');
    await page.locator('input[name="password"]').fill(NEW_USER_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(NEW_USER_PASSWORD);

    // ── Sección 2: Datos del negocio ───────────────────────────────────────
    await page.locator('input[name="businessName"]').fill('La Quesería de Ana');

    // Tipo de negocio — "Autónomo" es el default, hacer clic explícito
    const autonomoBtn = page.getByRole('button', { name: /autónomo/i }).first();
    if (await autonomoBtn.isVisible().catch(() => false)) {
      await autonomoBtn.click();
    }

    // Dirección
    await page.locator('input[name="street"]').fill('Calle Mayor');
    await page.locator('input[name="streetNumber"]').fill('15');
    // Piso / Puerta (opcional)
    const complementInput = page.locator('input[name="streetComplement"]');
    if (await complementInput.isVisible().catch(() => false)) {
      await complementInput.fill('2B');
    }

    // Código postal → auto-rellena provincia
    await page.locator('input[name="postalCode"]').fill('28001');
    await page.waitForTimeout(500);

    await page.locator('input[name="municipio"]').fill('Madrid');

    // ── Sección 3: Categoría ────────────────────────────────────────────────
    const artesanoCard = page.getByRole('button', { name: /artesano/i }).first();
    if (await artesanoCard.isVisible().catch(() => false)) {
      await artesanoCard.click();
    }

    // ── Sección 4: Historia / por qué Origen ──────────────────────────────
    const whyOrigineTextarea = page.locator('textarea[name="whyOrigin"]');
    if (await whyOrigineTextarea.isVisible().catch(() => false)) {
      await whyOrigineTextarea.fill(
        'Productora artesanal de quesos con más de 10 años de experiencia. ' +
          'Mis quesos son elaborados de forma tradicional con leche fresca de cabra ' +
          'de mi propio rebaño en la sierra madrileña.'
      );
    }

    // ── Sección 5: Términos y privacidad ───────────────────────────────────
    await page.getByLabel(/acepto los términos/i).click();
    await page.getByLabel(/acepto la política/i).click();

    // ── Enviar ─────────────────────────────────────────────────────────────
    const submitBtn = page.getByRole('button', { name: /enviar solicitud/i });
    await expect(submitBtn).toBeEnabled({ timeout: 8_000 });
    await submitBtn.click();

    // ── Verificar éxito ────────────────────────────────────────────────────
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/ORIG-TEST-001|código de seguimiento|solicitud recibida/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('muestra error 409 para email duplicado', async ({ page }) => {
    // Override del mock para simular 409
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'duplicate_email', message: 'Este email ya está registrado.' },
        }),
      });
    });

    await page.locator('input[name="contactName"]').fill('Ana');
    await page.locator('input[name="contactSurname"]').fill('García');
    await page.locator('input[name="email"]').fill('existente@test.es');
    await page.locator('input[name="phone"]').fill('612345678');
    await page.locator('input[name="password"]').fill(NEW_USER_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(NEW_USER_PASSWORD);
    await page.locator('input[name="businessName"]').fill('Quesería Ana');
    await page.locator('input[name="street"]').fill('Calle Mayor');
    await page.locator('input[name="streetNumber"]').fill('1');
    await page.locator('input[name="postalCode"]').fill('28001');
    await page.waitForTimeout(300);
    await page.locator('input[name="municipio"]').fill('Madrid');

    const artesanoCard = page.getByRole('button', { name: /artesano/i }).first();
    if (await artesanoCard.isVisible().catch(() => false)) await artesanoCard.click();

    const whyTextarea = page.locator('textarea[name="whyOrigin"]');
    if (await whyTextarea.isVisible().catch(() => false)) {
      await whyTextarea.fill(
        'Productora artesanal con más de 10 años haciendo quesos de cabra de calidad certificada.'
      );
    }

    await page.getByLabel(/acepto los términos/i).click();
    await page.getByLabel(/acepto la política/i).click();

    const submitBtn = page.getByRole('button', { name: /enviar solicitud/i });
    await expect(submitBtn).toBeEnabled({ timeout: 8_000 });
    await submitBtn.click();

    // Esperar mensaje de error por email duplicado
    await expect(
      page.getByText(/email.*registrado|duplicad|ya existe|ya está registrado/i)
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: LOGIN DE PRODUCTOR
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login de productor — formulario completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('carga la página de login con todos los elementos', async ({ page }) => {
    // Campo email — usar type para evitar strict mode (no tiene name attribute)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Campo password — usar type para evitar strict mode con "Mostrar contraseña" button
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Checkbox "Recordar mi sesión"
    await expect(page.getByRole('checkbox', { name: /recordar mi sesión/i })).toBeVisible();
    // Botón de acceso
    await expect(page.getByRole('button', { name: /acceder al panel/i })).toBeVisible();
  });

  test('rellena todos los campos y envía — mock redirige a onboarding', async ({ page, context }) => {
    const loginEmail = `e2e-login-${Date.now()}@test.es`;
    await mockLoginApi(page, loginEmail, false);
    // El gateway establece accessToken vía Set-Cookie; en el test lo hacemos manualmente
    // para que el middleware Next.js permita la navegación a /onboarding
    await setAuthCookie(context);

    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(NEW_USER_PASSWORD);

    // Activar "Recordar mi sesión"
    const rememberCheckbox = page.getByRole('checkbox', { name: /recordar mi sesión/i });
    await expect(rememberCheckbox).not.toBeChecked();
    await rememberCheckbox.click();
    await expect(rememberCheckbox).toBeChecked();

    await page.getByRole('button', { name: /acceder al panel/i }).click();

    // Con onboardingCompleted = false → redirige a /onboarding
    await expect(page).toHaveURL(/onboarding|dashboard/, { timeout: 10_000 });
  });

  test('rellena todos los campos y envía — mock redirige a dashboard (onboarding completado)', async ({ page, context }) => {
    const loginEmail = `e2e-active-${Date.now()}@test.es`;
    await mockLoginApi(page, loginEmail, true);
    // El gateway establece accessToken vía Set-Cookie; en el test lo hacemos manualmente
    await setAuthCookie(context);

    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(NEW_USER_PASSWORD);
    await page.getByRole('button', { name: /acceder al panel/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test('muestra errores de validación al enviar formulario vacío', async ({ page }) => {
    // Deshabilitar validación nativa HTML5 para que el JS de la app muestre sus errores
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 5_000 });
    await page.evaluate(() => {
      document.querySelectorAll('form').forEach(f => f.setAttribute('novalidate', ''));
    });
    await page.getByRole('button', { name: /acceder al panel/i }).click({ force: true });
    await expect(page.getByText(/El email es requerido/i)).toBeVisible({ timeout: 5_000 });
  });

  test('muestra error con email inválido', async ({ page }) => {
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 5_000 });
    await page.evaluate(() => {
      document.querySelectorAll('form').forEach(f => f.setAttribute('novalidate', ''));
    });
    await page.locator('input[type="email"]').fill('noesemail');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /acceder al panel/i }).click({ force: true });
    await expect(page.getByText(/Introduce un email válido/i)).toBeVisible({ timeout: 5_000 });
  });

  test('muestra error con contraseña demasiado corta', async ({ page }) => {
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 5_000 });
    await page.evaluate(() => {
      document.querySelectorAll('form').forEach(f => f.setAttribute('novalidate', ''));
    });
    await page.locator('input[type="email"]').fill('test@test.es');
    await page.locator('input[type="password"]').fill('abc');
    await page.getByRole('button', { name: /acceder al panel/i }).click({ force: true });
    await expect(page.getByText(/Mínimo 8 caracteres/i)).toBeVisible({ timeout: 5_000 });
  });

  test('el enlace de registro lleva a /auth/register', async ({ page }) => {
    await page.getByText(/regístrate como productor/i).click();
    await expect(page).toHaveURL(/register/);
  });

  test('login con credenciales reales (requiere E2E_TEST_EMAIL)', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requiere E2E_TEST_EMAIL y E2E_TEST_PASSWORD en el entorno');

    await page.locator('input[type="email"]').fill(process.env.E2E_TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole('button', { name: /acceder al panel/i }).click();

    await expect(page).toHaveURL(/dashboard|onboarding/, { timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: ONBOARDING COMPLETO — 7 PASOS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Onboarding de productor — 5 pasos (ADR-020)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page, context }) => {
    await setAuthCookie(context);
    await mockOnboardingApis(page);
  });

  test('muestra 5 pasos y abre en el paso indicado por ?step=N', async ({ page }) => {
    await page.goto('/onboarding?step=1');
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1, name: /ubicación e identidad legal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ir al paso/ })).toHaveCount(5);
    await expect(page.getByText(/historia/i)).toHaveCount(0);
  });

  test('paso 1: continuar con el formulario vacío muestra los errores junto a cada campo', async ({ page }) => {
    await page.goto('/onboarding?step=1');
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 20_000 });
    await page.getByRole('button', { name: /^(continuar|guardar y continuar)/i }).last().click({ force: true });
    await expect(page.locator('#onboarding-step-validation')).toBeVisible();
    await expect(page.getByText(/selecciona la forma jurídica/i).first()).toBeVisible();
  });

  test('paso 1: con los datos completos guarda y avanza al perfil visual', async ({ page }) => {
    await page.goto('/onboarding?step=1');
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator('#onb-entity-type').click();
    await page.getByRole('option', { name: /autónomo/i }).click();
    await page.locator('#onb-tax-id').fill('12345678Z');
    await page.locator('#onb-phone').fill('612345678');
    await page.locator('#onb-postal-code').fill('28001');
    await page.locator('#onb-city').fill('Madrid');
    await page.locator('#onb-street').fill('Calle del Pez');
    await page.locator('#onb-street-number').fill('7');
    await page.locator('[data-onboarding-step-content] button[aria-pressed]').first().click();
    await page.getByRole('button', { name: /^(continuar|guardar y continuar)/i }).last().click({ force: true });
    await expect(page.getByRole('heading', { level: 1, name: /perfil visual/i })).toBeVisible({ timeout: 10_000 });
  });

  test('paso 3: con cobertura ofrece delegar en Origen', async ({ page }) => {
    await page.route('**/api/v1/producers/onboarding/data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { fiscal: { businessName: 'Huerta E2E' }, onboarding: { currentStep: 3, completedSteps: [1, 2] } } }),
      });
    });
    await page.goto('/onboarding?step=3');
    await expect(page.getByRole('heading', { level: 1, name: /envíos/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /delegar en origen/i })).toBeVisible();
  });
});
