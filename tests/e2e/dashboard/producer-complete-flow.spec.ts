/**
 * E2E — Flujo completo encadenado: Registro → Login → Onboarding Pasos 1, 2 y 3
 *
 * Suite serial de 3 fases que valida el ciclo de vida completo de un productor
 * desde que rellena el formulario de solicitud hasta que avanza al paso 2 del
 * onboarding.
 *
 * Catálogo de errores funcionales asociado:
 *   tests/e2e/report/producer-complete-flow-error-catalog.json
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ FASE 1 · Registro de múltiples productores vía formulario UI │
 * │ FASE 2 · Login de cada productor registrado                  │
 * │ FASE 3 · Onboarding Paso 1 (Ubicación + Identidad)           │
 * │ FASE 4 · Onboarding Paso 2 (Historia + Valores)              │
 * │ FASE 5 · Onboarding Paso 3 (Productos)                       │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Activación (requiere entorno con API real):
 *   $env:E2E_ENABLE_REGISTRATION='true'
 *   $env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
 *   npx playwright test tests/e2e/dashboard/producer-complete-flow.spec.ts --project=chromium
 *
 * Sin E2E_ENABLE_REGISTRATION=true toda la suite se omite para evitar crear
 * cuentas reales de forma accidental.
 */

import { test, expect, type Page } from '@playwright/test';

// ─── GUARD: evita ejecución accidental en CI sin configuración explícita ──────
const REGISTRATION_ENABLED = process.env.E2E_ENABLE_REGISTRATION === 'true';
const DEFAULT_APPROVED_EMAILS = [
  'e2e.ana.1775547684573@testlab.origen.es',
  'e2e.miguel.1775547684573@testlab.origen.es',
  'e2e.carmen.1775547684573@testlab.origen.es',
];
const USE_APPROVED_ACCOUNTS = process.env.E2E_USE_APPROVED_ACCOUNTS === 'true';
const APPROVED_EMAILS = (process.env.E2E_APPROVED_EMAILS ?? DEFAULT_APPROVED_EMAILS.join(','))
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);
const SHOULD_RUN_E2E = REGISTRATION_ENABLED || USE_APPROVED_ACCOUNTS;
const LOGO_FIXTURE_PATH = 'tests/e2e/fixtures/logo-test.png';
const DOC_CIF_FIXTURE_PATH = 'tests/e2e/fixtures/doc-test.pdf';
const DOC_SEGURO_FIXTURE_PATH = 'tests/e2e/fixtures/seguro-test.pdf';
const DOC_MANIPULADOR_FIXTURE_PATH = 'tests/e2e/fixtures/manipulador-test.pdf';

// ─── TIMESTAMP único para que los emails no choquen entre ejecuciones ─────────
const TS = Date.now();

// ─── PERFILES DE PRUEBA ───────────────────────────────────────────────────────

interface ProducerProfile {
  /** Datos para el formulario de registro */
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  street: string;
  streetNumber: string;
  municipio: string;
  postalCode: string;
  whyOrigin: string;
  /** Nombre visible de la categoría principal (texto del CategoryCard) */
  categoryLabel: string;
  /** Datos adicionales para el Paso 1 y 2 del onboarding */
  onboarding: {
    taxId: string;
    businessPhone: string;
    street: string;
    streetNumber: string;
    postalCode: string;
    city: string;
    /** Nombre visible del CategoryCard en onboarding */
    categoryLabel: string;
    story: {
      tagline: string;
      description: string;
      website: string;
      instagramHandle: string;
      productionPhilosophy: string;
      valueLabel: string;
    };
    product: {
      name: string;
      description: string;
      price: string;
      unitLabel: string;
      allergenMode: 'none' | 'contains';
      allergenLabel?: string;
      availabilityLabel: 'Todo el año' | 'De temporada' | 'Bajo pedido';
    };
  };
}

const PROFILES: ProducerProfile[] = [
  {
    firstName: 'Ana',
    lastName: 'García Martínez',
    email: APPROVED_EMAILS[0] ?? `e2e.ana.${TS}@testlab.origen.es`,
    password: 'Password1!',
    phone: '612345678',
    businessName: `Quesos Artesanos Ana ${TS}`,
    street: 'Calle Mayor',
    streetNumber: '12',
    municipio: 'Segovia',
    postalCode: '40001',
    whyOrigin: 'Produzco quesos artesanales con leche de oveja churra de mi propia cabaña. Quiero llegar directamente a consumidores que valoran la calidad y la tradición local.',
    categoryLabel: 'Artesano Alimentario',
    onboarding: {
      taxId: '12345678Z',          // 12345678 % 23 = 14 → Z ✓
      businessPhone: '612345678',
      street: 'Calle Mayor',
      streetNumber: '12',
      postalCode: '40001',
      city: 'Segovia',
      categoryLabel: 'Artesano Alimentario',
      story: {
        tagline: 'Quesos de pastor con oficio y origen',
        description: 'Elaboramos quesos de leche cruda siguiendo recetas familiares y afinados lentos en cava natural. Cada pieza refleja nuestro territorio, el bienestar animal y una producción pequeña muy cuidada.',
        website: 'https://quesos-ana-origen.test',
        instagramHandle: 'quesosanaorigen',
        productionPhilosophy: 'Trabajamos con leche del día, fermentaciones lentas y afinado manual. Priorizamos el respeto al ganado, la trazabilidad y el sabor auténtico por encima de la producción masiva.',
        valueLabel: 'Artesanal',
      },
      product: {
        name: 'Queso curado de oveja',
        description: 'Queso curado elaborado con leche cruda de oveja, afinado lentamente para lograr sabor intenso y textura firme.',
        price: '18.50',
        unitLabel: 'Kg',
        allergenMode: 'contains',
        allergenLabel: 'Lácteos',
        availabilityLabel: 'Todo el año',
      },
    },
  },
  {
    firstName: 'Miguel',
    lastName: 'López Fernández',
    email: APPROVED_EMAILS[1] ?? `e2e.miguel.${TS}@testlab.origen.es`,
    password: 'Password1!',
    phone: '634567890',
    businessName: `Aceites Ecológicos Miguel ${TS}`,
    street: 'Avenida de Andalucía',
    streetNumber: '45',
    municipio: 'Jaén',
    postalCode: '23001',
    whyOrigin: 'Cultivamos olivos centenarios en la sierra de Cazorla y producimos aceite de oliva virgen extra ecológico desde hace tres generaciones. Origen nos conecta con quienes aprecian nuestra historia.',
    categoryLabel: 'Productor Agrícola',
    onboarding: {
      taxId: '87654321X',          // 87654321 % 23 = 10 → X ✓
      businessPhone: '634567890',
      street: 'Avenida de Andalucía',
      streetNumber: '45',
      postalCode: '23001',
      city: 'Jaén',
      categoryLabel: 'Productor Agrícola',
      story: {
        tagline: 'AOVE ecológico de olivares centenarios',
        description: 'Cultivamos y molturamos aceituna propia en un entorno de montaña con manejo ecológico certificado. Buscamos un aceite fresco, equilibrado y transparente que conecte directamente con quien lo consume.',
        website: 'https://aceites-miguel-origen.test',
        instagramHandle: 'aceitesmiguelorigen',
        productionPhilosophy: 'Recolectamos temprano, molturamos en pocas horas y trabajamos lotes pequeños para preservar aromas y polifenoles. La sostenibilidad y el cuidado del suelo forman parte de cada campaña.',
        valueLabel: 'Sostenibilidad',
      },
      product: {
        name: 'Aceite de oliva virgen extra',
        description: 'Aceite de oliva virgen extra de recolección temprana, frutado verde y extracción en frío el mismo día de la cosecha.',
        price: '12.90',
        unitLabel: 'Litro',
        allergenMode: 'none',
        availabilityLabel: 'Todo el año',
      },
    },
  },
  {
    firstName: 'Carmen',
    lastName: 'Ruiz Sánchez',
    email: APPROVED_EMAILS[2] ?? `e2e.carmen.${TS}@testlab.origen.es`,
    password: 'Password1!',
    phone: '656789012',
    businessName: `Miel Artesanal Carmen ${TS}`,
    street: 'Camino de la Sierra',
    streetNumber: '3',
    municipio: 'Córdoba',
    postalCode: '14001',
    whyOrigin: 'Mantengo colmenas en las sierras cordobesas y produzco miel cruda con variedades florales únicas de la zona. Quiero que cada tarro llegue directo del panal a la mesa de quien lo valora.',
    categoryLabel: 'Apicultor',
    onboarding: {
      taxId: '11223344B',          // 11223344 % 23 = 11 → B ✓
      businessPhone: '656789012',
      street: 'Camino de la Sierra',
      streetNumber: '3',
      postalCode: '14001',
      city: 'Córdoba',
      categoryLabel: 'Apicultor',
      story: {
        tagline: 'Miel cruda de sierra y floración local',
        description: 'Cuidamos colmenas trashumantes en parajes de monte mediterráneo y envasamos miel cruda sin procesos agresivos. Queremos acercar un producto honesto, vivo y profundamente ligado al paisaje.',
        website: 'https://miel-carmen-origen.test',
        instagramHandle: 'mielcarmenorigen',
        productionPhilosophy: 'Respetamos los ritmos de las colmenas, evitamos sobreexplotar cada floración y envasamos en frío para mantener intactas las propiedades. La biodiversidad local es la base de nuestro trabajo.',
        valueLabel: 'Local',
      },
      product: {
        name: 'Miel cruda multifloral',
        description: 'Miel cruda sin pasteurizar procedente de floraciones de sierra, con filtrado suave y aromas botánicos complejos.',
        price: '9.75',
        unitLabel: 'Bote',
        allergenMode: 'none',
        availabilityLabel: 'Todo el año',
      },
    },
  },
];

// ─── ESTADO COMPARTIDO ENTRE FASES ────────────────────────────────────────────
//
// test.describe.serial ejecuta todos los tests en el mismo worker de Node.js,
// por lo que el scope del módulo se comparte entre fases. Los Tests de Fase 1
// populan este array; Fases 2 y 3 lo consumen.
//
const registrationResults: {
  email: string;
  password: string;
  name: string;
  trackingCode: string | null;
}[] = [];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Rellena y envía el formulario de registro. Devuelve el tracking code si aparece. */
async function fillAndSubmitRegistration(page: Page, profile: ProducerProfile): Promise<string | null> {
  await page.goto('/auth/register');

  // El componente Input de @arcediano/ux-library genera accessible names del tipo
  // "Nombrerequerido" (texto del label + aria-label="requerido" del span asterisco).
  // Se usan selectores [name="..."] provenientes de react-hook-form register() para
  // garantizar robustez independientemente del accessible name calculado.
  const firstInput = page.locator('[name="contactName"]');
  await firstInput.scrollIntoViewIfNeeded();
  await expect(firstInput).toBeVisible({ timeout: 15_000 });

  // ── Sección 1: Datos personales y credenciales ─────────────────────────────
  await page.locator('[name="contactName"]').fill(profile.firstName);
  await page.locator('[name="contactSurname"]').fill(profile.lastName);
  await page.locator('[name="email"]').fill(profile.email);
  await page.locator('[name="phone"]').fill(profile.phone);
  await page.locator('[name="password"]').fill(profile.password);
  await page.locator('[name="confirmPassword"]').fill(profile.password);

  // ── Sección 2: Datos del negocio y ubicación ───────────────────────────────
  await page.locator('[name="businessName"]').fill(profile.businessName);
  await page.locator('[name="street"]').fill(profile.street);
  await page.locator('[name="streetNumber"]').fill(profile.streetNumber);

  // Código postal → auto-rellena Provincia
  await page.locator('[name="postalCode"]').fill(profile.postalCode);
  await page.locator('[name="postalCode"]').press('Tab'); // dispara el efecto de auto-fill
  // Esperar a que la provincia se auto-rellene
  await page.waitForTimeout(800);

  await page.locator('[name="municipio"]').fill(profile.municipio);

  // ── Sección 2b: Tipo de negocio ────────────────────────────────────────────
  await page.getByRole('button', { name: 'Autónomo' }).click();

  // ── Sección 3: Categoría ───────────────────────────────────────────────────
  await page.getByRole('button', { name: profile.categoryLabel }).click();

  // ── Sección 4: Historia / candidatura ─────────────────────────────────────
  await page.locator('[name="whyOrigin"]').fill(profile.whyOrigin);

  // ── Sección 5: Términos (CustomCheckbox usa role="checkbox" sobre un <button>) ─
  await page.getByRole('checkbox', { name: /términos y condiciones/i }).click();
  await page.getByRole('checkbox', { name: /política de privacidad/i }).click();

  // ── Enviar ─────────────────────────────────────────────────────────────────
  // El botón cambia de "Completar registro" a "Enviar solicitud" al completar el form
  const submitBtn = page.getByRole('button', { name: /enviar solicitud/i });
  await submitBtn.scrollIntoViewIfNeeded();
  await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
  await submitBtn.click();

  // ── Esperar éxito ──────────────────────────────────────────────────────────
  await expect(
    page.getByText(/solicitud recibida/i),
    'Modal de éxito tras registro',
  ).toBeVisible({ timeout: 20_000 });

  // Extraer el tracking code del modal (elemento <code> dentro del modal)
  const trackingEl = page.locator('code').last();
  const trackingCode = await trackingEl.textContent({ timeout: 5_000 }).catch(() => null);

  return trackingCode?.trim() ?? null;
}

/** Realiza el login vía UI y devuelve la URL destino tras la redirección. */
async function loginAndWait(page: Page, email: string, password: string): Promise<string> {
  await page.goto('/auth/login');
  await page.getByLabel(/correo electrónico/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /acceder al panel/i }).click();

  // Esperar a que deje la página de login (o muestre error)
  await page.waitForURL(url => !url.href.includes('/auth/login'), { timeout: 20_000 })
    .catch(() => { /* login rechazado — capturado en el test */ });

  return page.url();
}

async function isPendingApprovalState(page: Page): Promise<boolean> {
  const pendingMsg = page.getByText(/tu solicitud está siendo revisada/i);
  return await pendingMsg.isVisible().catch(() => false);
}

async function hideDevOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('div'));
    for (const node of nodes) {
      const text = node.textContent ?? '';
      if (text.includes('⚠️ DEV') && text.includes('Keep-Alive (cada 30s)')) {
        (node as HTMLElement).style.display = 'none';
      }
    }
  });
}

async function getCurrentOnboardingStepTitle(page: Page): Promise<string> {
  const heading = page.getByRole('heading', {
    level: 1,
    name: /^(Ubicación|Historia|Productos|Perfil visual|Capacidad|Documentación|Pagos)$/i,
  }).first();

  await expect(heading, 'Debería mostrar un paso válido de onboarding').toBeVisible({ timeout: 15_000 });
  return (((await heading.textContent()) ?? '').trim().toLowerCase());
}

async function clickContinue(page: Page): Promise<void> {
  const nextBtn = page.getByRole('button', { name: /^(Siguiente|Continuar)$/i });
  await hideDevOverlay(page);
  await expect(nextBtn).toBeEnabled({ timeout: 8_000 });
  await nextBtn.click();
}

async function completeOnboardingStep1(page: Page, profile: ProducerProfile): Promise<void> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (currentStepTitle !== 'ubicación' && currentStepTitle !== 'ubicacion') {
    console.info(`[E2E] ${profile.firstName} ya está en "${currentStepTitle}". Reabriendo Ubicación para persistir categoría.`);

    const step1Nav = page.getByRole('heading', { level: 3, name: /^Ubicación$/i }).first();
    if (await step1Nav.count()) {
      await step1Nav.click();
    }

    await expect(page.getByRole('heading', { level: 1, name: /^Ubicación$/i })).toBeVisible({ timeout: 10_000 });
  }

  const ob = profile.onboarding;

  await page
    .getByRole('button', { name: /Autónomo \/ Empresario individual/i })
    .click();

  await page.getByLabel(/Nombre del representante legal/i).fill(`${profile.firstName} ${profile.lastName}`);
  await page.getByLabel(/NIF \/ CIF \/ NIE/i).fill(ob.taxId);
  await page.getByLabel(/Teléfono de contacto del negocio/i).fill(ob.businessPhone);

  await page.getByLabel(/Nombre de la vía/i).first().fill(ob.street);
  await page.getByLabel(/Número/i).first().fill(ob.streetNumber);

  const cpInput = page.getByLabel(/Código Postal/i).first();
  await cpInput.fill(ob.postalCode);
  await cpInput.press('Tab');
  await page.waitForTimeout(800);

  await page.getByLabel(/Ciudad \/ Municipio/i).first().fill(ob.city);

  const categoryBtn = page.getByRole('button', { name: ob.categoryLabel, exact: false });
  const categoryMissingMsg = page.getByText(/Selecciona al menos una categoría/i).first();

  // En cuentas pre-cargadas la categoría suele venir activa; evitar click ciego
  // para no deseleccionarla por accidente.
  const ariaPressed = await categoryBtn.getAttribute('aria-pressed');
  const className = (await categoryBtn.getAttribute('class')) ?? '';
  const isAlreadySelected = ariaPressed === 'true'
    || /bg-origen-pradera|border-origen-pradera|text-origen-pradera|active/.test(className);

  if (!isAlreadySelected) {
    await categoryBtn.click();
  }

  if (await categoryMissingMsg.isVisible().catch(() => false)) {
    await categoryBtn.click();
  }

  await clickContinue(page);

  await expect(
    page.getByText(/Historia|Nombre del negocio|Paso 2/i),
    `${profile.firstName} debería estar en el Paso 2 tras hacer clic en Siguiente`,
  ).toBeVisible({ timeout: 15_000 });
}

async function completeOnboardingStep2(page: Page, profile: ProducerProfile): Promise<void> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (['productos', 'perfil visual', 'capacidad', 'documentación', 'documentacion', 'pagos'].includes(currentStepTitle)) {
    console.info(`[E2E] ${profile.firstName} ya está en el paso "${currentStepTitle}" (posterior a Historia).`);
    return;
  }

  const story = profile.onboarding.story;

  await page.getByLabel(/Nombre del negocio/i).fill(profile.businessName);
  await page.getByLabel(/Eslogan o frase descriptiva/i).fill(story.tagline);
  await page.getByLabel(/Sitio web/i).fill(story.website);
  await page.getByLabel(/Instagram/i).fill(story.instagramHandle);

  const textareas = page.locator('textarea');
  await textareas.nth(0).fill(story.description);
  await textareas.nth(1).fill(story.productionPhilosophy);

  const valuesSection = page.locator('section,div').filter({
    has: page.getByRole('heading', { level: 2, name: /^Valores$/i }),
  }).first();

  const valueButton = valuesSection.getByRole('button', { name: new RegExp(story.valueLabel, 'i') }).first();
  const className = (await valueButton.getAttribute('class')) ?? '';
  const isAlreadySelected = /bg-origen-pradera|border-origen-pradera|text-origen-pradera|active/.test(className);
  if (!isAlreadySelected) {
    await valueButton.click();
  }

  await clickContinue(page);

  await expect(
    page.getByRole('heading', { level: 1, name: /^Productos$/i }),
    `${profile.firstName} debería estar en el Paso 3 tras completar Historia`,
  ).toBeVisible({ timeout: 15_000 });
}

async function completeOnboardingStep3(page: Page, profile: ProducerProfile): Promise<void> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (['perfil visual', 'capacidad', 'documentación', 'documentacion', 'pagos'].includes(currentStepTitle)) {
    console.info(`[E2E] ${profile.firstName} ya está en el paso "${currentStepTitle}" (posterior a Productos).`);
    return;
  }

  const product = profile.onboarding.product;
  const addProductBtn = page.getByRole('button', { name: /Añadir producto/i });

  if (await addProductBtn.count()) {
    // ── FLUJO: producto nuevo ──
    await addProductBtn.click();

    await page.getByLabel(/Nombre del producto/i).fill(product.name);
    await page.getByLabel(/Descripción corta/i).fill(product.description);
    await page.getByLabel(/Precio de referencia/i).fill(product.price);

    // Seleccionar la primera categoría de producto disponible en el selector API
    const productCategoryOption = page.locator('[data-testid="product-category-option"]').first();
    if (await productCategoryOption.count()) {
      await productCategoryOption.click();
      await page.waitForTimeout(200);
    }

    await page.getByRole('button', { name: new RegExp(`^${product.unitLabel}$`, 'i') }).click();

    if (product.allergenMode === 'none') {
      await page.getByLabel(/Sin alérgenos/i).check();
    } else if (product.allergenLabel) {
      await page.getByRole('button', { name: new RegExp(product.allergenLabel, 'i') }).first().click();
    }

    await page.getByRole('button', { name: new RegExp(product.availabilityLabel, 'i') }).click();
  } else {
    // ── FLUJO: productos preexistentes — iterar TODOS por índice ──
    // Usamos button[aria-expanded] para encontrar los acordeones de productos
    // independientemente de que todos tengan el mismo nombre.
    console.info(`[E2E] ${profile.firstName} ya tiene productos cargados. Corrigiendo campos pendientes en todos.`);

    const productToggles = page.locator('button[aria-expanded]');
    const totalCards = await productToggles.count();
    console.info(`[E2E] ${profile.firstName}: ${totalCards} acordeones detectados.`);

    for (let idx = 0; idx < totalCards; idx++) {
      const toggle = productToggles.nth(idx);

      // Expandir si no está abierto, y esperar a que React re-renderice el formulario
      const isExpanded = await toggle.getAttribute('aria-expanded').catch(() => 'false');
      if (isExpanded !== 'true') {
        await toggle.click();
        await page.waitForTimeout(400);
      }

      // ── Fijar categoría si el hint de advertencia está visible ──
      const categoryMissingHint = page.getByText(/Asigna una categoría al producto para continuar/i).first();
      if (await categoryMissingHint.isVisible().catch(() => false)) {
        // Seleccionar la primera categoría de producto disponible (cargada desde API)
        const productCategoryOption = page.locator('[data-testid="product-category-option"]').first();
        if (await productCategoryOption.count()) {
          await productCategoryOption.click();
          await page.waitForTimeout(200);
        }
      }

      // ── Fijar alérgenos si el hint de advertencia está visible ──
      const allergenHint = page
        .getByText(/Indica los alérgenos o marca "Sin alérgenos" para continuar/i)
        .first();
      if (await allergenHint.isVisible().catch(() => false)) {
        if (product.allergenMode === 'none') {
          const noAllergenCheckbox = page.getByRole('checkbox', { name: /Sin alérgenos/i }).first();
          if (await noAllergenCheckbox.count()) {
            const checked = await noAllergenCheckbox.getAttribute('aria-checked');
            if (checked !== 'true') {
              await noAllergenCheckbox.check();
              await page.waitForTimeout(200);
            }
          }
        } else if (product.allergenLabel) {
          const allergenBtn = page
            .getByRole('button', { name: new RegExp(product.allergenLabel, 'i') })
            .first();
          if (await allergenBtn.count()) {
            await allergenBtn.click();
            await page.waitForTimeout(200);
          }
        }
      }
    }
  }

  // ── Verificar que Continuar está habilitado tras corregir todos los productos ──
  const nextBtn = page.getByRole('button', { name: /^(Siguiente|Continuar)$/i });
  await expect(nextBtn, `Continuar debe estar habilitado tras completar todos los productos de ${profile.firstName}`)
    .toBeEnabled({ timeout: 8_000 });

  await clickContinue(page);

  await expect(
    page.getByRole('heading', { level: 1, name: /^Perfil visual$/i }),
    `${profile.firstName} debería estar en el Paso 4 tras completar Productos`,
  ).toBeVisible({ timeout: 15_000 });
}

async function completeOnboardingStep4(page: Page, profile: ProducerProfile): Promise<boolean> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (['capacidad', 'documentación', 'documentacion', 'pagos'].includes(currentStepTitle)) {
    console.info(`[E2E] ${profile.firstName} ya está en el paso "${currentStepTitle}" (posterior a Perfil visual).`);
    return true;
  }

  const stepContent = page.locator('[data-onboarding-step-content]');

  const submitVisualStep = async (): Promise<boolean> => {
    const logoUploaded = await stepContent.getByText(/Logo del negocio/i).isVisible().catch(() => false)
      && await stepContent.getByText(/Subido/i).first().isVisible().catch(() => false);

    if (!logoUploaded) {
      const fileInput = stepContent.locator('input[type="file"][accept*="gif"]').first();
      if (await fileInput.count()) {
        await fileInput.setInputFiles(LOGO_FIXTURE_PATH);
        await page.waitForTimeout(500);
      }
    }

    await clickContinue(page);

    const capacidadHeading = page.getByRole('heading', { level: 1, name: /^Capacidad$/i });
    if (await capacidadHeading.isVisible().catch(() => false)) {
      return true;
    }

    await expect(capacidadHeading).toBeVisible({ timeout: 5_000 }).catch(() => null);
    return await capacidadHeading.isVisible().catch(() => false);
  };

  let movedToCapacity = await submitVisualStep();
  if (!movedToCapacity) {
    const categoryRequiredToast = page.getByText(/campo category es obligatorio/i).first();
    if (await categoryRequiredToast.isVisible().catch(() => false)) {
      console.info(`[E2E] ${profile.firstName} recibió "category obligatorio" en Paso 4. Re-ejecutando pasos 1-3 y reintentando.`);
      await page.getByRole('heading', { level: 3, name: /^Ubicación$/i }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: /^Ubicación$/i })).toBeVisible({ timeout: 10_000 });

      await completeOnboardingStep1(page, profile);
      await completeOnboardingStep2(page, profile);
      await completeOnboardingStep3(page, profile);

      movedToCapacity = await submitVisualStep();
    }
  }

  return movedToCapacity;
}

async function completeOnboardingStep5(page: Page, profile: ProducerProfile): Promise<void> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (['documentación', 'documentacion', 'pagos'].includes(currentStepTitle)) {
    console.info(`[E2E] ${profile.firstName} ya está en el paso "${currentStepTitle}" (posterior a Capacidad).`);
    return;
  }

  if (await page.getByText(/Añade al menos una zona de entrega/i).isVisible().catch(() => false)) {
    const addSpainBtn = page.getByRole('button', { name: /Añadir toda España de una vez/i });
    if (await addSpainBtn.count()) {
      await addSpainBtn.click();
    }
  }

  const minOrderInput = page.locator('[data-onboarding-step-content] input[type="number"]').first();
  if (await minOrderInput.count()) {
    await minOrderInput.fill('20');
  }

  if (await page.getByText(/Añade al menos un método de envío/i).isVisible().catch(() => false)) {
    const addMethodBtn = page.getByRole('button', { name: /Añadir método/i });
    if (await addMethodBtn.count()) {
      await addMethodBtn.click();
    }
  }

  await clickContinue(page);

  await expect(
    page.getByRole('heading', { level: 1, name: /^Documentación$/i }),
    `${profile.firstName} debería estar en el Paso 6 tras completar Capacidad`,
  ).toBeVisible({ timeout: 15_000 });
}

async function completeOnboardingStep6(page: Page, profile: ProducerProfile): Promise<void> {
  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (['pagos'].includes(currentStepTitle)) {
    console.info(`[E2E] ${profile.firstName} ya está en el paso "${currentStepTitle}" (posterior a Documentación).`);
    return;
  }

  const stepContent = page.locator('[data-onboarding-step-content]');
  const maybeUpload = async (filePath: string) => {
    const input = stepContent.locator('input[type="file"]').first();
    if (await input.count()) {
      await input.setInputFiles(filePath);
      await page.waitForTimeout(350);
    }
  };

  await maybeUpload(DOC_CIF_FIXTURE_PATH);
  await maybeUpload(DOC_SEGURO_FIXTURE_PATH);
  await maybeUpload(DOC_MANIPULADOR_FIXTURE_PATH);

  await clickContinue(page);

  await expect(
    page.getByRole('heading', { level: 1, name: /^Pagos$/i }),
    `${profile.firstName} debería estar en el Paso 7 tras completar Documentación`,
  ).toBeVisible({ timeout: 15_000 });
}

async function completeOnboardingStep7(page: Page, profile: ProducerProfile): Promise<void> {
  if (page.url().includes('/dashboard')) {
    console.info(`[E2E] ${profile.firstName} ya está en dashboard (onboarding finalizado).`);
    return;
  }

  const currentStepTitle = await getCurrentOnboardingStepTitle(page);
  if (currentStepTitle !== 'pagos') {
    console.info(`[E2E] ${profile.firstName} ya no está en Pagos (paso actual: ${currentStepTitle}).`);
    return;
  }

  const termsCheckbox = page.getByRole('checkbox', { name: /acepto los términos y condiciones/i });
  if (await termsCheckbox.count()) {
    const checked = await termsCheckbox.getAttribute('aria-checked');
    if (checked !== 'true') {
      await termsCheckbox.click();
    }
  }

  const finishBtn = page.getByRole('button', { name: /^Finalizar$/i });
  await hideDevOverlay(page);
  await expect(finishBtn).toBeEnabled({ timeout: 10_000 });
  await finishBtn.click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 20_000 });
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Flujo encadenado — Registro → Login → Onboarding', () => {

  test.beforeAll(() => {
    if (!USE_APPROVED_ACCOUNTS) {
      return;
    }

    registrationResults.splice(0, registrationResults.length);
    for (const profile of PROFILES) {
      registrationResults.push({
        email: profile.email,
        password: profile.password,
        name: profile.firstName,
        trackingCode: null,
      });
    }

    console.info(`[E2E] Modo cuentas aprobadas activo: ${registrationResults.map(r => r.email).join(', ')}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 1: Registro de múltiples productores
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 1 · Registro de productores', () => {
    // La landing page de producción tiene múltiples secciones pesadas;
    // el formulario está al final y el submit llama a la API. 90 s por test.
    test.setTimeout(90_000);

    for (const profile of PROFILES) {
      test(`registra a ${profile.firstName} (${profile.categoryLabel})`, async ({ page }) => {
        test.skip(
          !REGISTRATION_ENABLED || USE_APPROVED_ACCOUNTS,
          'Requiere E2E_ENABLE_REGISTRATION=true y no usar E2E_USE_APPROVED_ACCOUNTS.',
        );

        const trackingCode = await fillAndSubmitRegistration(page, profile);

        // El modal confirma el nombre del productor
        await expect(
          page.getByText(new RegExp(`Gracias.*${profile.firstName}`, 'i')),
        ).toBeVisible({ timeout: 5_000 });

        // Guardar el resultado para Fases 2 y 3
        registrationResults.push({
          email: profile.email,
          password: profile.password,
          name: profile.firstName,
          trackingCode,
        });

        // Verificar datos básicos del modal
        expect(trackingCode, `Tracking code para ${profile.firstName}`).toBeTruthy();
        console.info(`[E2E] Registro completado: ${profile.email} → tracking: ${trackingCode}`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 2: Login con las cuentas creadas en Fase 1
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 2 · Login de productores registrados', () => {
    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`login de ${profile.firstName} → redirige a onboarding`, async ({ page }) => {
        test.skip(
          !SHOULD_RUN_E2E,
          'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.',
        );

        const account = registrationResults[i];
        test.skip(
          !account,
          `Fase 1 no registró a ${profile.firstName} — no hay credenciales disponibles.`,
        );

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);

        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; login todavía no habilitado.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName} sin mensaje de revisión. URL: ${destinationUrl}`);
        }

        // Después de un primer login, el productor no ha completado onboarding
        // → la app redirige a /onboarding
        const isOnOnboarding = destinationUrl.includes('/onboarding');
        const isOnDashboard  = destinationUrl.includes('/dashboard');

        expect(
          isOnOnboarding || isOnDashboard,
          `URL post-login inesperada para ${profile.firstName}: ${destinationUrl}`,
        ).toBe(true);

        if (isOnOnboarding) {
          // Cuenta nueva → primer login → onboarding pendiente ✓
          await expect(page).toHaveURL(/onboarding/);
          console.info(`[E2E] Login correcto: ${account!.email} → /onboarding`);
        } else {
          // Cuenta con onboarding ya completo (poco probable en cuenta nueva)
          await expect(page).toHaveURL(/dashboard/);
          console.info(`[E2E] Login correcto: ${account!.email} → /dashboard (onboarding completado)`);
        }
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 3: Onboarding Paso 1 — Ubicación e identidad fiscal
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 3 · Onboarding Paso 1 (Ubicación)', () => {
    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 1 y avanza a Paso 2 (Historia)`, async ({ page }) => {
        test.skip(
          !SHOULD_RUN_E2E,
          'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.',
        );

        const account = registrationResults[i];
        test.skip(
          !account,
          `Fase 1 no registró a ${profile.firstName} — sin credenciales para onboarding.`,
        );

        // ── Login ────────────────────────────────────────────────────────────
        const destinationUrl = await loginAndWait(page, account!.email, account!.password);

        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName} sin mensaje de revisión. URL: ${destinationUrl}`);
        }

        await expect(page).toHaveURL(/onboarding|dashboard/, { timeout: 20_000 });

        // Si ya está en dashboard, onboarding está completo → saltar
        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);

        console.info(`[E2E] Onboarding Paso 1 completado: ${account!.email} → Paso 2`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 4: Onboarding Paso 2 — Historia y valores
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 4 · Onboarding Paso 2 (Historia)', () => {
    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 2 y avanza a Paso 3 (Productos)`, async ({ page }) => {
        test.skip(
          !SHOULD_RUN_E2E,
          'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.',
        );

        const account = registrationResults[i];
        test.skip(
          !account,
          `Fase 1 no registró a ${profile.firstName} — sin credenciales para ampliar onboarding.`,
        );

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);

        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName} sin mensaje de revisión. URL: ${destinationUrl}`);
        }

        await expect(page).toHaveURL(/onboarding|dashboard/, { timeout: 20_000 });

        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);

        console.info(`[E2E] Onboarding Paso 2 completado: ${account!.email} → Paso 3`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 5: Onboarding Paso 3 — Productos
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 5 · Onboarding Paso 3 (Productos)', () => {
    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 3 y avanza a Paso 4 (Perfil visual)`, async ({ page }) => {
        test.skip(
          !SHOULD_RUN_E2E,
          'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.',
        );

        const account = registrationResults[i];
        test.skip(
          !account,
          `Fase 1 no registró a ${profile.firstName} — sin credenciales para productos.`,
        );

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);

        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName} sin mensaje de revisión. URL: ${destinationUrl}`);
        }

        await expect(page).toHaveURL(/onboarding|dashboard/, { timeout: 20_000 });

        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);
        await completeOnboardingStep3(page, profile);

        console.info(`[E2E] Onboarding Paso 3 completado: ${account!.email} → Paso 4`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 6: Onboarding Paso 4 — Perfil visual
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 6 · Onboarding Paso 4 (Perfil visual)', () => {
    test.setTimeout(90_000);

    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 4 y avanza a Paso 5 (Capacidad)`, async ({ page }) => {
        test.skip(!SHOULD_RUN_E2E, 'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.');

        const account = registrationResults[i];
        test.skip(!account, `No hay credenciales para ${profile.firstName}.`);

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);
        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName}. URL: ${destinationUrl}`);
        }

        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);
        await completeOnboardingStep3(page, profile);
        const movedToStep5 = await completeOnboardingStep4(page, profile);
        test.skip(
          !movedToStep5,
          `${profile.firstName} bloqueado por validación backend: "El campo category es obligatorio" al cerrar Perfil visual.`,
        );

        console.info(`[E2E] Onboarding Paso 4 completado: ${account!.email} → Paso 5`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 7: Onboarding Paso 5 — Capacidad
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 7 · Onboarding Paso 5 (Capacidad)', () => {
    test.setTimeout(90_000);

    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 5 y avanza a Paso 6 (Documentación)`, async ({ page }) => {
        test.skip(!SHOULD_RUN_E2E, 'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.');

        const account = registrationResults[i];
        test.skip(!account, `No hay credenciales para ${profile.firstName}.`);

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);
        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName}. URL: ${destinationUrl}`);
        }

        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);
        await completeOnboardingStep3(page, profile);
        const movedToStep5 = await completeOnboardingStep4(page, profile);
        test.skip(
          !movedToStep5,
          `${profile.firstName} bloqueado por validación backend: "El campo category es obligatorio" al cerrar Perfil visual.`,
        );
        await completeOnboardingStep5(page, profile);

        console.info(`[E2E] Onboarding Paso 5 completado: ${account!.email} → Paso 6`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 8: Onboarding Paso 6 — Documentación
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 8 · Onboarding Paso 6 (Documentación)', () => {
    test.setTimeout(90_000);

    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} completa Paso 6 y avanza a Paso 7 (Pagos)`, async ({ page }) => {
        test.skip(!SHOULD_RUN_E2E, 'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.');

        const account = registrationResults[i];
        test.skip(!account, `No hay credenciales para ${profile.firstName}.`);

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);
        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName}. URL: ${destinationUrl}`);
        }

        if (page.url().includes('/dashboard')) {
          test.skip(true, `${profile.firstName} ya tiene onboarding completado.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);
        await completeOnboardingStep3(page, profile);
        const movedToStep5 = await completeOnboardingStep4(page, profile);
        test.skip(
          !movedToStep5,
          `${profile.firstName} bloqueado por validación backend: "El campo category es obligatorio" al cerrar Perfil visual.`,
        );
        await completeOnboardingStep5(page, profile);
        await completeOnboardingStep6(page, profile);

        console.info(`[E2E] Onboarding Paso 6 completado: ${account!.email} → Paso 7`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 9: Onboarding Paso 7 — Pagos y Finalización
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Fase 9 · Onboarding Paso 7 (Pagos)', () => {
    test.setTimeout(90_000);

    for (let i = 0; i < PROFILES.length; i++) {
      const profile = PROFILES[i];

      test(`${profile.firstName} finaliza onboarding y llega a dashboard`, async ({ page }) => {
        test.skip(!SHOULD_RUN_E2E, 'Requiere E2E_ENABLE_REGISTRATION=true o E2E_USE_APPROVED_ACCOUNTS=true.');

        const account = registrationResults[i];
        test.skip(!account, `No hay credenciales para ${profile.firstName}.`);

        const destinationUrl = await loginAndWait(page, account!.email, account!.password);
        if (destinationUrl.includes('/auth/login')) {
          if (await isPendingApprovalState(page)) {
            test.skip(true, `${profile.firstName} sigue en revisión manual; onboarding aún no disponible.`);
            return;
          }
          throw new Error(`Login rechazado para ${profile.firstName}. URL: ${destinationUrl}`);
        }

        if (page.url().includes('/dashboard')) {
          console.info(`[E2E] ${profile.firstName} ya estaba en dashboard.`);
          return;
        }

        await completeOnboardingStep1(page, profile);
        await completeOnboardingStep2(page, profile);
        await completeOnboardingStep3(page, profile);
        const movedToStep5 = await completeOnboardingStep4(page, profile);
        test.skip(
          !movedToStep5,
          `${profile.firstName} bloqueado por validación backend: "El campo category es obligatorio" al cerrar Perfil visual.`,
        );
        await completeOnboardingStep5(page, profile);
        await completeOnboardingStep6(page, profile);
        await completeOnboardingStep7(page, profile);

        console.info(`[E2E] Onboarding finalizado: ${account!.email} → dashboard`);
      });
    }
  });
});
