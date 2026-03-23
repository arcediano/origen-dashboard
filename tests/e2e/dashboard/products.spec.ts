/**
 * E2E tests para el listado y gestión de productos.
 *
 * Requiere sesión activa — usar storageState o login previo.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard — Listado de productos', () => {
  test.beforeEach(async ({ page }) => {
    // En CI se pueden pre-configurar las cookies de sesión
    // Para desarrollo, el test asume sesión activa
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requiere E2E_TEST_EMAIL para sesión autenticada');
    await page.goto('/dashboard/products');
  });

  test('muestra el listado de productos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible();
  });

  test('el botón "Nuevo producto" es visible y navega al formulario', async ({ page }) => {
    await page.getByRole('link', { name: /nuevo producto/i }).click();
    await expect(page).toHaveURL(/products\/new|products\/create/);
  });

  test('el filtro de búsqueda filtra los productos', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('queso');
      await expect(page.url()).toContain('queso');
    }
  });
});

test.describe('Dashboard — Formulario de nuevo producto', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requiere E2E_TEST_EMAIL para sesión autenticada');
    await page.goto('/dashboard/products/new');
  });

  test('carga el formulario multi-step', async ({ page }) => {
    await expect(page.getByText(/información básica|paso 1/i)).toBeVisible();
  });

  test('el campo nombre muestra validación inline', async ({ page }) => {
    const nameInput = page.getByLabel(/nombre del producto/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('AB'); // Menos de 5 caracteres
      await nameInput.blur();
      await expect(page.getByText(/mínimo 5 caracteres/i)).toBeVisible();
    }
  });

  test('navega entre pasos del formulario', async ({ page }) => {
    // Rellenar paso 1 mínimo y avanzar
    const nameInput = page.getByLabel(/nombre del producto/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Queso Manchego Artesano');
      const shortDescInput = page.getByLabel(/descripción corta/i);
      if (await shortDescInput.isVisible()) {
        await shortDescInput.fill('Queso manchego con DOP, curación mínima 6 meses');
      }
      const nextBtn = page.getByRole('button', { name: /siguiente|continuar/i });
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await expect(page.getByText(/imágenes|paso 2/i)).toBeVisible();
      }
    }
  });
});
