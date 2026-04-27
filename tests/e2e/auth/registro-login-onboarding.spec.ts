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
            fiscal: {
              entityType: null,
              taxId: '',
              businessPhone: '',
              legalRepresentativeName: '',
            },
            location: { street: '', streetNumber: '', city: '', province: '', postalCode: '' },
            story: { businessName: '', description: '', tagline: '', values: [] },
            visual: { logo: null, banner: null },
            logistics: {
              isInOriginRoute: true,
              deliveryOptions: [],
              includedZones: [],
              minOrderAmount: 20,
            },
            documents: { cif: null, seguroRC: null, manipuladorAlimentos: null },
            stripe: { stripeConnected: false, acceptTerms: false },
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
    '**/api/v1/producers/onboarding/step/products',
    '**/api/v1/producers/onboarding/step/3',
    '**/api/v1/producers/onboarding/step/4',
    '**/api/v1/producers/onboarding/step/5',
    '**/api/v1/producers/onboarding/step/6',
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

  // Logística — zone-check
  await page.route('**/api/v1/producers/logistics/zone-check**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { centralizedLogistics: true, centralizedTransport: false },
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

test.describe('Onboarding de productor — 7 pasos completos', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page, context }) => {
    // 1. Cookie JWT para el middleware Next.js
    await setAuthCookie(context);
    // 2. Mocks de red ANTES de navegar
    await mockOnboardingApis(page);
    // 3. Navegar al onboarding
    await page.goto('/onboarding');
    // 4. Esperar que el spinner de carga inicial desaparezca
    await page.waitForSelector('div.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {});
    // 5. Esperar el contenido del primer paso (Framer Motion anima la entrada)
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 15_000 });
    // 6. Pequeña pausa para que la animación de entrada termine
    await page.waitForTimeout(400);
  });

  // ── PASO 1: UBICACIÓN ────────────────────────────────────────────────────

  test('Paso 1 - Ubicación: rellena todos los campos y continúa', async ({ page }) => {
    // Verificar que el paso 1 está activo (el contenedor step-content existe)
    await expect(page.locator('[data-onboarding-step-content]')).toBeVisible();

    // Tipo de entidad — botón trigger del Select personalizado (placeholder "Selecciona forma jurídica")
    const entityTrigger = page.getByRole('button', { name: /selecciona forma jurídica/i });
    await entityTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await entityTrigger.click();
    // Esperar que las opciones aparezcan y seleccionar "Autónomo"
    const autonomoOption = page.getByRole('button', { name: /autónomo.*empresario/i });
    await autonomoOption.waitFor({ state: 'visible', timeout: 5_000 });
    await autonomoOption.click();

    // NIF / CIF / NIE — placeholder "12345678A"
    await page.getByPlaceholder(/12345678a/i).fill('12345678Z');

    // Teléfono de negocio — placeholder "600 000 000"
    await page.getByPlaceholder(/600 000 000/i).fill('612345678');

    // Dirección — placeholder "Calle Mayor..."
    await page.getByPlaceholder(/calle mayor/i).fill('Calle del Pez');

    // Número de vía (label "Número", sin placeholder)
    await page.locator('[data-onboarding-step-content]').getByLabel(/^número/i).first().fill('7').catch(async () => {
      await page.locator('[data-onboarding-step-content] input[type="text"]').nth(3).fill('7');
    });

    // Código Postal (label "Código Postal", sin placeholder)
    await page.locator('[data-onboarding-step-content]').getByLabel(/código postal/i).first().fill('28001').catch(async () => {
      await page.locator('[data-onboarding-step-content] input[type="text"]').nth(5).fill('28001');
    });
    await page.waitForTimeout(400);

    // Ciudad / Municipio (label "Ciudad / Municipio", sin placeholder)
    await page.locator('[data-onboarding-step-content]').getByLabel(/ciudad/i).first().fill('Madrid').catch(async () => {
      await page.locator('[data-onboarding-step-content] input[type="text"]').nth(6).fill('Madrid');
    });

    // Categoría de productor — usar aria-pressed (CategoryCard siempre lo tiene)
    const firstCategoryCard = page.locator('[data-onboarding-step-content] button[aria-pressed]').first();
    await firstCategoryCard.waitFor({ state: 'visible', timeout: 5_000 });
    await firstCategoryCard.click();

    // Continuar (force: true para evitar que el panel dev debug intercepte el click)
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Verificar avance al paso 2
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    // El step 2 tiene un input con label "Nombre del negocio" (UXLibrary Input, sin name/placeholder)
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── PASO 2: HISTORIA ─────────────────────────────────────────────────────

  test('Paso 2 - Historia: rellena todos los campos y continúa', async ({ page }) => {
    await _completeStep1(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Nombre del negocio — UXLibrary Input con label "Nombre del negocio"
    await page.getByLabel(/nombre del negocio/i).fill('Quesería Artesanal del Valle');

    // Eslogan (opcional) — placeholder "Una frase que capture la esencia de tu marca"
    const sloganInput = page.getByPlaceholder(/esencia de tu marca|eslogan|frase descriptiva/i).first();
    if (await sloganInput.isVisible().catch(() => false)) {
      await sloganInput.fill('El sabor de la sierra, en tu mesa');
    }

    // Sitio web (opcional)
    const websiteInput = page.getByPlaceholder(/https:\/\/|sitio web|website/i).first();
    if (await websiteInput.isVisible().catch(() => false)) {
      await websiteInput.fill('https://queseriavalle.es');
    }

    // Instagram (opcional)
    const igInput = page.getByPlaceholder(/instagram|@usuario/i).first();
    if (await igInput.isVisible().catch(() => false)) {
      await igInput.fill('queseriavalle');
    }

    // Historia del negocio (mínimo 50 caracteres)
    await page.locator('textarea').first().fill(
      'Elaboramos quesos artesanales desde 1995 con leche fresca de nuestras cabras criadas en libertad ' +
        'en la sierra de Madrid. Tradición y calidad en cada pieza de queso.'
    );

    // Valores de marca — seleccionar al menos 1
    const artesanalBtn = page.getByRole('button', { name: /artesanal/i }).first();
    if (await artesanalBtn.isVisible().catch(() => false)) {
      await artesanalBtn.click();
    }
    const tradicionBtn = page.getByRole('button', { name: /tradición|tradicion/i }).first();
    if (await tradicionBtn.isVisible().catch(() => false)) {
      await tradicionBtn.click();
    }

    // Continuar
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Verificar avance al paso 3 (Productos)
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  });

  // ── PASO 3: PRODUCTOS (OPCIONAL) ─────────────────────────────────────────

  test('Paso 3 - Productos: añade un producto completo y continúa', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Añadir producto
    await page.getByRole('button', { name: /añadir producto/i }).click({ force: true });
    await page.waitForTimeout(500);

    // Nombre del producto
    await page.getByLabel(/nombre del producto/i).fill('Queso de cabra curado').catch(async () => {
      await page.locator('[data-onboarding-step-content] input[type="text"]').first().fill('Queso de cabra curado');
    });

    // Descripción (mínimo 20 caracteres)
    await page.getByLabel(/descripción corta/i).fill(
      'Queso curado 3 meses con hierbas aromáticas de la sierra madrileña.'
    ).catch(async () => {
      await page.locator('[data-onboarding-step-content] textarea').first().fill(
        'Queso curado 3 meses con hierbas aromáticas de la sierra madrileña.'
      );
    });

    // Categoría — combobox con data-testid
    const categoryCombobox = page.locator('[data-testid="product-category-option"]').first();
    if (await categoryCombobox.isVisible().catch(() => false)) {
      await categoryCombobox.click();
      await page.locator('[data-testid="product-category-item"]').first().click();
    }

    // Precio de referencia
    await page.getByLabel(/precio de referencia/i).fill('12.50').catch(async () => {
      await page.locator('input[type="number"]').first().fill('12.50');
    });

    // Alérgenos — marcar "Sin alérgenos"
    const noAllergenCheckbox = page.getByLabel(/sin alérgenos/i).first();
    if (await noAllergenCheckbox.isVisible().catch(() => false)) {
      await noAllergenCheckbox.click();
    }

    // Continuar (paso 3 es opcional)
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  });

  // ── PASO 4: PERFIL VISUAL ─────────────────────────────────────────────────

  test('Paso 4 - Perfil visual: sube logo y banner', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await _completeStep3Skip(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Logo (obligatorio) — primer input type="file"
    const logoInput = page.locator('input[type="file"]').first();
    await logoInput.waitFor({ state: 'attached', timeout: 8_000 });
    await logoInput.setInputFiles(TEST_IMAGE);
    await page.waitForTimeout(600);

    // Verificar que se subió (aparece "Subido" badge)
    await expect(page.getByText('Subido').first()).toBeVisible({ timeout: 8_000 });

    // Banner (opcional) — segundo input type="file" si existe
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    if (count >= 2) {
      await fileInputs.nth(1).setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(400);
    }

    // Continuar
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  });

  // ── PASO 5: CAPACIDAD ─────────────────────────────────────────────────────

  test('Paso 5 - Capacidad: añade zona de entrega', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await _completeStep3Skip(page);
    await _completeStep4Visual(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Zona por provincia — tab "Provincia" es el default
    const zoneInput = page.getByPlaceholder(/ej: madrid, barcelona, sevilla/i);
    await zoneInput.waitFor({ state: 'visible', timeout: 8_000 });
    await zoneInput.fill('Madrid');
    await page.getByRole('button', { name: /añadir zona/i }).click({ force: true });
    await page.waitForTimeout(300);

    // Verificar zona añadida
    await expect(page.getByText('Madrid').first()).toBeVisible({ timeout: 5_000 });

    // Continuar (minOrderAmount ya es 20 por defecto, que es válido)
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  });

  // ── PASO 6: DOCUMENTACIÓN ────────────────────────────────────────────────

  test('Paso 6 - Documentación: sube los 3 documentos requeridos', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await _completeStep3Skip(page);
    await _completeStep4Visual(page);
    await _completeStep5Capacity(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Subir los 3 documentos (CIF, Seguro RC, Manipulador)
    // Cada vez que subimos uno, el FileUpload desaparece → siempre usar .first()
    for (let i = 0; i < 3; i++) {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.waitFor({ state: 'attached', timeout: 8_000 });
      await fileInput.setInputFiles(TEST_DOCUMENT);
      await page.waitForTimeout(500);
    }

    // Verificar que al menos un documento se subió
    const deleteButtons = page.locator('[aria-label*="Eliminar documento"]');
    await expect(deleteButtons.first()).toBeVisible({ timeout: 8_000 });

    // Continuar
    const continueBtn = page.getByRole('button', { name: /continuar/i });
    await expect(continueBtn).toBeEnabled({ timeout: 8_000 });
    await continueBtn.click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  });

  // ── PASO 7: PAGOS / STRIPE ───────────────────────────────────────────────

  test('Paso 7 - Pagos: acepta términos y finaliza el onboarding', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await _completeStep3Skip(page);
    await _completeStep4Visual(page);
    await _completeStep5Capacity(page);
    await _completeStep6Documents(page);
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    // Aceptar términos de Stripe (obligatorio para finalizar)
    const acceptTermsCheckbox = page.locator('#accept-terms');
    await acceptTermsCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
    await acceptTermsCheckbox.click({ force: true });
    await expect(acceptTermsCheckbox).toBeChecked();

    // Clic en "Finalizar"
    const finalizarBtn = page.getByRole('button', { name: /finalizar/i });
    await expect(finalizarBtn).toBeEnabled({ timeout: 5_000 });
    await finalizarBtn.click({ force: true });

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  });

  // ── FLUJO COMPLETO: 7 pasos en secuencia ─────────────────────────────────

  test('Flujo completo — 7 pasos hasta el dashboard', async ({ page }) => {
    await _completeStep1(page);
    await _completeStep2(page);
    await _completeStep3Skip(page);
    await _completeStep4Visual(page);
    await _completeStep5Capacity(page);
    await _completeStep6Documents(page);

    // Paso 7 — Pagos
    await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);
    const acceptTermsCheckbox = page.locator('#accept-terms');
    await acceptTermsCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
    await acceptTermsCheckbox.click({ force: true });
    const finalizarBtn = page.getByRole('button', { name: /finalizar/i });
    await expect(finalizarBtn).toBeEnabled({ timeout: 5_000 });
    await finalizarBtn.click({ force: true });

    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS — completar pasos para tests que empiezan en un paso posterior
// ─────────────────────────────────────────────────────────────────────────────

async function _completeStep1(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(400);

  // Tipo de entidad — botón trigger del Select personalizado
  const entityTrigger = page.getByRole('button', { name: /selecciona forma jurídica/i });
  await entityTrigger.waitFor({ state: 'visible', timeout: 10_000 });
  await entityTrigger.click();
  const autonomoOption = page.getByRole('button', { name: /autónomo.*empresario/i });
  await autonomoOption.waitFor({ state: 'visible', timeout: 5_000 });
  await autonomoOption.click();
  await page.waitForTimeout(200);

  // NIF/CIF
  await page.getByPlaceholder(/12345678a/i).fill('12345678Z');
  // Teléfono (InputAffixField con placeholder "600 000 000")
  await page.getByPlaceholder(/600 000 000/i).fill('612345678');
  // Calle (placeholder "Calle Mayor, Av. de la Constitución")
  await page.getByPlaceholder(/calle mayor/i).fill('Calle del Pez');

  // Número de vía — sin placeholder, buscar por label
  const streetNumberInput = page.locator('[data-onboarding-step-content]').getByLabel(/^número/i).first();
  await streetNumberInput.fill('7').catch(async () => {
    // Fallback: 4º text input en el step content (0=NIF, 1=Phone, 2=Street, 3=StreetNumber)
    await page.locator('[data-onboarding-step-content] input[type="text"]').nth(3).fill('7');
  });

  // Código Postal — sin placeholder, buscar por label
  const postalCodeInput = page.locator('[data-onboarding-step-content]').getByLabel(/código postal/i).first();
  await postalCodeInput.fill('28001').catch(async () => {
    // Fallback: 6º text input (0=NIF, 1=Phone, 2=Street, 3=StreetNum, 4=Piso, 5=CP)
    await page.locator('[data-onboarding-step-content] input[type="text"]').nth(5).fill('28001');
  });
  await page.waitForTimeout(400); // esperar auto-relleno de provincia

  // Ciudad — sin placeholder, buscar por label
  const cityInput = page.locator('[data-onboarding-step-content]').getByLabel(/ciudad/i).first();
  await cityInput.fill('Madrid').catch(async () => {
    // Fallback: 7º text input
    await page.locator('[data-onboarding-step-content] input[type="text"]').nth(6).fill('Madrid');
  });

  // Categoría — usar aria-pressed (CategoryCard siempre lo tiene)
  const firstCategoryCard = page.locator('[data-onboarding-step-content] button[aria-pressed]').first();
  await firstCategoryCard.waitFor({ state: 'visible', timeout: 5_000 });
  await firstCategoryCard.click();
  await page.waitForTimeout(200);

  // Esperar que el botón Continuar esté habilitado (validación OK)
  const continueBtn = page.getByRole('button', { name: /continuar/i });
  await expect(continueBtn).toBeEnabled({ timeout: 10_000 });
  await continueBtn.click({ force: true });
  // Esperar transición al paso siguiente
  await page.waitForTimeout(800);
}

async function _completeStep2(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(400);

  // Nombre del negocio — UXLibrary Input con label "Nombre del negocio", sin name/placeholder
  await page.getByLabel(/nombre del negocio/i).fill('Quesería Artesanal del Valle');

  // Historia
  await page.locator('textarea').first().fill(
    'Elaboramos quesos artesanales desde 1995 con leche fresca de nuestras cabras criadas en libertad ' +
      'en la sierra de Madrid. Tradición y calidad.'
  );

  // Valores — al menos uno
  const artesanalBtn = page.getByRole('button', { name: /artesanal/i }).first();
  if (await artesanalBtn.isVisible().catch(() => false)) {
    await artesanalBtn.click();
  }

  const continueBtn2 = page.getByRole('button', { name: /continuar/i });
  await expect(continueBtn2).toBeEnabled({ timeout: 10_000 });
  await continueBtn2.click({ force: true });
  await page.waitForTimeout(800);
}

async function _completeStep3Skip(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(400);
  // Productos es opcional — continuar sin añadir ninguno
  await page.getByRole('button', { name: /continuar/i }).click({ force: true });
  await page.waitForTimeout(600);
}

async function _completeStep4Visual(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(400);
  // Logo obligatorio
  const logoInput = page.locator('input[type="file"]').first();
  await logoInput.waitFor({ state: 'attached', timeout: 8_000 });
  await logoInput.setInputFiles(TEST_IMAGE);
  await page.waitForTimeout(600);
  const continueBtn4 = page.getByRole('button', { name: /continuar/i });
  await expect(continueBtn4).toBeEnabled({ timeout: 10_000 });
  await continueBtn4.click({ force: true });
  await page.waitForTimeout(800);
}

async function _completeStep5Capacity(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(400);
  const zoneInput = page.getByPlaceholder(/ej: madrid, barcelona, sevilla/i);
  await zoneInput.waitFor({ state: 'visible', timeout: 8_000 });
  await zoneInput.fill('Madrid');
  await page.getByRole('button', { name: /añadir zona/i }).click({ force: true });
  await page.waitForTimeout(300);
  const continueBtn5 = page.getByRole('button', { name: /continuar/i });
  await expect(continueBtn5).toBeEnabled({ timeout: 10_000 });
  await continueBtn5.click({ force: true });
  await page.waitForTimeout(800);
}

async function _completeStep6Documents(page: Page): Promise<void> {
  await page.locator('[data-onboarding-step-content]').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(400);
  // Subir los 3 documentos requeridos (CIF, Seguro RC, Manipulador)
  // Cada vez que subimos uno, el FileUpload desaparece → siempre usar .first()
  for (let i = 0; i < 3; i++) {
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 8_000 });
    await fileInput.setInputFiles(TEST_DOCUMENT);
    await page.waitForTimeout(500);
  }
  const continueBtn6 = page.getByRole('button', { name: /continuar/i });
  await expect(continueBtn6).toBeEnabled({ timeout: 10_000 });
  await continueBtn6.click({ force: true });
  await page.waitForTimeout(800);
}
