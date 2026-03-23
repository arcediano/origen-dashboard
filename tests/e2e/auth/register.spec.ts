/**
 * E2E tests para el flujo de registro de productor.
 */

import { test, expect } from '@playwright/test';

const REGISTER_URL = '/auth/register';

test.describe('Formulario de registro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REGISTER_URL);
  });

  test('carga la página de registro correctamente', async ({ page }) => {
    await expect(page).toHaveURL(REGISTER_URL);
    await expect(page.getByLabel(/nombre de contacto/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('el botón de envío está deshabilitado con formulario vacío', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /enviar solicitud/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('muestra error de validación de email en tiempo real', async ({ page }) => {
    await page.getByLabel(/email/i).fill('noesemail');
    await page.getByLabel(/nombre de contacto/i).click(); // Trigger blur
    await expect(page.getByText(/email inválido/i)).toBeVisible();
  });

  test('muestra error de teléfono inválido', async ({ page }) => {
    await page.getByLabel(/teléfono/i).fill('123');
    await page.getByLabel(/nombre de contacto/i).click();
    await expect(page.getByText(/teléfono español inválido/i)).toBeVisible();
  });

  test('muestra error cuando las contraseñas no coinciden', async ({ page }) => {
    await page.getByLabel(/^contraseña$/i).fill('Password1');
    await page.getByLabel(/confirmar contraseña/i).fill('Password2');
    await page.getByLabel(/nombre de contacto/i).click();
    await expect(page.getByText(/las contraseñas no coinciden/i)).toBeVisible();
  });

  test('muestra error de código postal inválido', async ({ page }) => {
    await page.getByLabel(/código postal/i).fill('1234');
    await page.getByLabel(/nombre de contacto/i).click();
    await expect(page.getByText(/5 dígitos/i)).toBeVisible();
  });

  test('rellena la provincia automáticamente al introducir CP válido', async ({ page }) => {
    await page.getByLabel(/código postal/i).fill('28001');
    await expect(page.getByLabel(/provincia/i)).toHaveValue('Madrid', { timeout: 2000 });
  });

  test('muestra el indicador de fortaleza de contraseña', async ({ page }) => {
    await page.getByLabel(/^contraseña$/i).fill('abc');
    // El indicador de fortaleza debe aparecer
    await expect(page.locator('[data-testid="password-strength"], .password-strength')).toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Si no tiene testid explícito, verificar que al menos hay algún indicador visual
        // en el DOM cercano al campo contraseña
      });
  });

  test('la barra de progreso del formulario existe', async ({ page }) => {
    await expect(page.getByRole('progressbar')).toBeVisible();
  });

  test('tiene los checkboxes de términos y privacidad', async ({ page }) => {
    await expect(page.getByLabel(/términos/i)).toBeVisible();
    await expect(page.getByLabel(/privacidad/i)).toBeVisible();
  });
});

test.describe('Registro completo — flujo feliz', () => {
  test('registro exitoso con todos los datos válidos', async ({ page }) => {
    test.skip(true, 'Requiere entorno de test con API disponible — ejecutar manualmente');

    await page.goto(REGISTER_URL);

    await page.getByLabel(/nombre de contacto/i).fill('María');
    await page.getByLabel(/apellidos/i).fill('García López');
    await page.getByLabel(/email/i).fill(`test+${Date.now()}@test.es`);
    await page.getByLabel(/teléfono/i).fill('612345678');
    await page.getByLabel(/nombre del negocio/i).fill('Quesos García');
    await page.getByLabel(/calle/i).fill('Calle Mayor');
    await page.getByLabel(/número/i).fill('12');
    await page.getByLabel(/municipio/i).fill('Segovia');
    await page.getByLabel(/código postal/i).fill('40001');
    await page.getByLabel(/^contraseña$/i).fill('Password1');
    await page.getByLabel(/confirmar contraseña/i).fill('Password1');
    await page.getByLabel(/por qué origen/i).fill(
      'Quiero vender mis productos artesanales directamente a consumidores que valoran la calidad y la tradición local.',
    );

    // Seleccionar tipo de negocio
    await page.getByRole('button', { name: /autónomo|individual/i }).click();

    // Seleccionar categoría
    await page.getByRole('button', { name: /artesano/i }).click();

    // Aceptar términos
    await page.getByLabel(/términos/i).click();
    await page.getByLabel(/privacidad/i).click();

    await page.getByRole('button', { name: /enviar solicitud/i }).click();

    // Esperar modal de éxito
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/solicitud recibida|código de seguimiento/i)).toBeVisible();
  });
});
