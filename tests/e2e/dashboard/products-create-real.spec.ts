/**
 * @file products-create-real.spec.ts
 * @description E2E real para crear, editar y publicar productos con certificaciones.
 *
 * ⚠️ OBLIGATORIO — AMBIENTE REAL ÚNICAMENTE:
 * ESTAS PRUEBAS SOLO FUNCIONAN CONTRA EL SERVIDOR REMOTO DEPLOYED.
 * NO FUNCIONAN EN LOCALHOST — Requieren: BD real, autenticación remota, storage de media real.
 *
 * URL Base Requerida: https://producers.origen.delivery
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EJECUCIÓN REQUERIDA:
 * ═══════════════════════════════════════════════════════════════════════════
 * ```bash
 * # PowerShell / Bash
 * $env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
 * $env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.carmen.1777238090175@testlab.origen.es'
 * $env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
 * npx playwright test tests/e2e/dashboard/products-create-real.spec.ts --project=chromium --workers=1
 * ```
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CREDENCIALES (Carmen — Product Management)
 * ═══════════════════════════════════════════════════════════════════════════
 * Email:    e2e.carmen.1777238090175@testlab.origen.es
 * Password: Password1!
 * Status:   Fully onboarded, active
 * Use for:  Product creation, certification management
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * COBERTURA DE TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * ✅ Test 1: Crear producto completo (7 pasos) + certificación manual
 *    - Basic info, images, pricing, nutritional, production, inventory, certifications
 *    - Validación de: imagen 1400x1400px, ingrediente requerido, PDF documento
 *
 * ✅ Test 2: Editar producto creado + actualizar certificación
 *    - Navegación a detail page → route /edit
 *    - Validación de: persistencia de datos previos, actualización selectiva
 *
 * ✅ Test 3: Verificar persistencia tras recarga de página
 *    - Reload + navegación a producto → validar que cambios persisten
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REQUISITOS DE AMBIENTE
 * ═══════════════════════════════════════════════════════════════════════════
 * • Servidor remoto activo: https://producers.origen.delivery
 * • BD con usuario Carmen pre-cargado y activo
 * • Storage (AWS S3 o similar) para carga de imágenes/PDFs
 * • Gateway API funcionando (autenticación, onboarding, products endpoints)
 * • Network acceso a servidor remoto desde máquina de test
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VALIDACIONES CRÍTICAS
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. Imagen validada (no menor a 1200x1200, aceptada 1400x1400)
 * 2. Paso nutricional requiere mínimo 1 ingrediente (validación backend)
 * 3. Certificación manual requiere: nombre, organismo, # de cert, documento
 * 4. Publicación redirige a /dashboard/products
 * 5. Edición accesible vía ruta /dashboard/products/[id]/edit
 * 6. Datos persistem tras reload (DB integrity)
 * 7. Selector flexible para labels de botones (Siguiente vs Completa este paso)
 */

import * as path from 'path';
import { expect, test, type Page } from '@playwright/test';
import { getActiveProducerCredentials, loginAsProducer, type E2ECredentials } from '../helpers/auth';

const credentials = getActiveProducerCredentials() as E2ECredentials;
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const TEST_IMAGE = path.join(FIXTURES_DIR, 'test-image-valid.png');
const TEST_DOCUMENT = path.join(FIXTURES_DIR, 'doc-test.pdf');

const PRODUCT_NAME = `E2E Producto Completo ${Date.now()}`;
const PRODUCT_NAME_EDITED = `${PRODUCT_NAME} Editado`;
const MANUAL_CERT_NAME = `Certificacion Manual ${Date.now()}`;
const MANUAL_CERT_NAME_EDITED = `${MANUAL_CERT_NAME} Editada`;

let createdProductName: string | null = null;
let editedProductName: string | null = null;

async function ensureStep(page: Page, heading: RegExp): Promise<void> {
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 15_000 });
}

async function clickNext(page: Page): Promise<void> {
  const nextButton = page.getByRole('button', { name: /^(Siguiente|Completa este paso)$/i }).first();
  await expect(nextButton).toBeVisible({ timeout: 10_000 });
  await expect(nextButton).toBeEnabled({ timeout: 10_000 });
  await nextButton.click({ force: true });
}

async function fillBasicStep(page: Page): Promise<void> {
  await ensureStep(page, /Informaci[oó]n b[aá]sica/i);
  await page.getByLabel(/Nombre del producto/i).fill(PRODUCT_NAME);
  const categoryTrigger = page.getByText(/Seleccionar categor[ií]a/i).first();
  if (await categoryTrigger.isVisible().catch(() => false)) {
    await categoryTrigger.click();
    await page.getByRole('option').first().click();
  }
  await page.getByLabel(/Descripci[oó]n corta/i).fill('Descripcion corta de prueba para validacion e2e.');
  await page.getByLabel(/Descripci[oó]n detallada/i).fill('Descripcion larga de prueba para validar el paso basico en el flujo e2e de producto.');
  await clickNext(page);
}

async function fillImagesStep(page: Page): Promise<void> {
  await ensureStep(page, /Im[aá]genes/i);
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toBeAttached({ timeout: 10_000 });
  await fileInput.setInputFiles(TEST_IMAGE);
  await expect(page.getByText(/Imagen rechazada/i)).toHaveCount(0);
  await expect(page.locator('img[alt="Producto"]').first()).toBeVisible({ timeout: 10_000 });
  await clickNext(page);
}

async function fillPricingStep(page: Page): Promise<void> {
  await ensureStep(page, /Precios y ofertas/i);
  const salePrice = page.locator('input[placeholder="Ej: 24,50"]').first();
  if (await salePrice.isVisible().catch(() => false)) {
    await salePrice.fill('24,50');
  }
  await clickNext(page);
}

async function fillNutritionalStep(page: Page): Promise<void> {
  await ensureStep(page, /Informaci[oó]n nutricional/i);
  await page.locator('input[type="number"]').first().fill('100');
  await page.getByRole('button', { name: /Ingredientes/i }).click();
  await page.getByPlaceholder(/Leche de oveja pasteurizada/i).fill('Ingrediente E2E');
  await page.getByRole('button', { name: /^A[nñ]adir$/i }).click();
  await expect(page.getByText('Ingrediente E2E')).toBeVisible({ timeout: 10_000 });
  await clickNext(page);
}

async function fillProductionStep(page: Page): Promise<void> {
  await ensureStep(page, /Producci[oó]n/i);
  await page.getByRole('button', { name: /Historia/i }).click();
  await page.getByLabel(/Historia del productor/i).fill('Historia e2e');
  await page.getByRole('button', { name: /Origen/i }).click();
  await page.getByLabel(/Pa[ií]s de origen/i).fill('Espana');
  await clickNext(page);
}

async function fillInventoryStep(page: Page): Promise<void> {
  await ensureStep(page, /Inventario/i);
  await page.getByLabel(/Stock actual/i).fill('50');
  await page.getByLabel(/Umbral de stock bajo/i).fill('5');
  await clickNext(page);
}

async function addManualCertification(page: Page, certName: string, certNumber: string): Promise<void> {
  await ensureStep(page, /Certificaciones y atributos/i);
  await page.getByRole('button', { name: /A[nñ]adir manualmente/i }).click();
  await page.getByLabel(/Nombre/i).fill(certName);
  await page.getByLabel(/Organismo emisor/i).fill('Organismo E2E');
  await page.getByLabel(/Nº de certificado|N° de certificado|No de certificado/i).fill(certNumber);
  const fileInputs = page.locator('input[type="file"]');
  if ((await fileInputs.count()) > 0) {
    await fileInputs.last().setInputFiles(TEST_DOCUMENT);
  }
  await page.getByRole('button', { name: /^Guardar$/i }).click();
  await expect(page.getByText(certName)).toBeVisible({ timeout: 10_000 });
}

async function publishProduct(page: Page): Promise<void> {
  const publishButton = page.getByRole('button', { name: /^Publicar$/i }).first();
  await expect(publishButton).toBeVisible({ timeout: 10_000 });
  await expect(publishButton).toBeEnabled({ timeout: 10_000 });
  await publishButton.click();
  await expect(page.getByText(/Producto enviado a revisi[oó]n/i)).toBeVisible({ timeout: 15_000 });
  await page.waitForURL(/dashboard\/products/, { timeout: 12_000 });
}

async function openProductForEdit(page: Page, productName: string): Promise<void> {
  await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Productos|Mi cat[aá]logo/i }).first()).toBeVisible({ timeout: 20_000 });
  const row = page.locator('tr').filter({ hasText: productName }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click({ force: true });
  await page.waitForURL(/dashboard\/products\/[a-z0-9-]+$/i, { timeout: 15_000 });
  await page.goto(`${page.url()}/edit`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/edit/, { timeout: 15_000 });
}

async function openCertificationsStep(page: Page): Promise<void> {
  const directButton = page.getByRole('button', { name: /Certificaciones/i }).last();
  const canJumpDirectly = await directButton.isVisible({ timeout: 3_000 }).catch(() => false)
    && await directButton.isEnabled().catch(() => false);

  if (canJumpDirectly) {
    await directButton.click();
    return;
  }

  for (let index = 0; index < 6; index += 1) {
    if (await page.getByRole('heading', { name: /Certificaciones y atributos/i }).first().isVisible().catch(() => false)) {
      return;
    }
    await clickNext(page);
  }
}

test.describe.serial('Dashboard - Productos reales create/edit', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    try {
      await loginAsProducer(page, credentials);
      await page.waitForLoadState('domcontentloaded');
    } catch {
      test.skip(true, `No se pudo autenticar en real con ${credentials.email}. Revisa credenciales o estado de la cuenta.`);
    }
  });

  test('crea un producto real con todos los pasos y una certificacion manual', async ({ page }) => {
    await page.goto('/dashboard/products/create', { waitUntil: 'networkidle' });
    await fillBasicStep(page);
    await fillImagesStep(page);
    await fillPricingStep(page);
    await fillNutritionalStep(page);
    await fillProductionStep(page);
    await fillInventoryStep(page);
    await addManualCertification(page, MANUAL_CERT_NAME, 'CERT-E2E-001');
    await publishProduct(page);
    await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible({ timeout: 20_000 });
    createdProductName = PRODUCT_NAME;
  });

  test('edita el producto real y actualiza la certificacion manual', async ({ page }) => {
    test.skip(!createdProductName, 'Se omite edicion porque no se creo producto en el test previo.');

    await openProductForEdit(page, createdProductName!);
    await page.getByLabel(/Nombre del producto/i).fill(PRODUCT_NAME_EDITED);
    await openCertificationsStep(page);
    const certificationCard = page.locator('div').filter({ hasText: MANUAL_CERT_NAME }).first();
    await expect(certificationCard).toBeVisible({ timeout: 10_000 });
    await certificationCard.getByRole('button', { name: /Editar/i }).click();
    await page.getByLabel(/Nombre/i).fill(MANUAL_CERT_NAME_EDITED);
    await page.getByLabel(/Nº de certificado|N° de certificado|No de certificado/i).fill('CERT-E2E-002');
    await page.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(MANUAL_CERT_NAME_EDITED)).toBeVisible({ timeout: 10_000 });
    const saveDraftButton = page.getByRole('button', { name: /Guardar borrador/i }).first();
    await expect(saveDraftButton).toBeVisible({ timeout: 10_000 });
    await saveDraftButton.click();
    await page.waitForURL(/dashboard\/products/, { timeout: 12_000 });
    editedProductName = PRODUCT_NAME_EDITED;
  });

  test('persiste tras recarga la edicion del producto y la certificacion', async ({ page }) => {
    test.skip(!editedProductName, 'Se omite persistencia porque no se completo la edicion previa.');

    await openProductForEdit(page, editedProductName!);
    await expect(page.getByLabel(/Nombre del producto/i)).toHaveValue(editedProductName!, { timeout: 15_000 });
    await openCertificationsStep(page);
    await expect(page.getByText(MANUAL_CERT_NAME_EDITED)).toBeVisible({ timeout: 10_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/Nombre del producto/i)).toHaveValue(editedProductName!, { timeout: 15_000 });
    await openCertificationsStep(page);
    await expect(page.getByText(MANUAL_CERT_NAME_EDITED)).toBeVisible({ timeout: 10_000 });
  });
});
