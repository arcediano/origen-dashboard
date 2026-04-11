import { expect, type Page } from '@playwright/test';

export interface E2ECredentials {
  email: string;
  password: string;
  source: string;
}

function readCredentials(prefix: string): E2ECredentials | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`]?.trim();

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    source: prefix,
  };
}

export function getPendingOnboardingCredentials(): E2ECredentials | null {
  return readCredentials('E2E_PENDING_ONBOARDING') ?? readCredentials('E2E_ONBOARDING');
}

export function getActiveProducerCredentials(): E2ECredentials | null {
  return readCredentials('E2E_ACTIVE_PRODUCER') ?? readCredentials('E2E_TEST');
}

export function getNotificationsCredentials(): E2ECredentials | null {
  return readCredentials('E2E_NOTIFICATIONS') ?? getActiveProducerCredentials();
}

export async function loginAsProducer(page: Page, credentials: E2ECredentials): Promise<void> {
  await page.goto('/auth/login');

  const emailCandidates = [
    page.getByLabel(/correo electr[oó]nico|email/i),
    page.getByPlaceholder(/correo electr[oó]nico|email/i),
    page.locator('input[type="email"]'),
    page.locator('input[name="email"]'),
  ];

  let emailFilled = false;
  for (const candidate of emailCandidates) {
    const field = candidate.first();
    if (await field.isVisible().catch(() => false)) {
      await field.fill(credentials.email);
      emailFilled = true;
      break;
    }
  }
  if (!emailFilled) {
    throw new Error('No se encontró el campo de email en /auth/login');
  }

  const passwordCandidates = [
    page.getByLabel(/contrase[nñ]a|password/i),
    page.getByPlaceholder(/contrase[nñ]a|password/i),
    page.locator('input[type="password"]'),
    page.locator('input[name="password"]'),
  ];

  let passwordFilled = false;
  for (const candidate of passwordCandidates) {
    const field = candidate.first();
    if (await field.isVisible().catch(() => false)) {
      await field.fill(credentials.password);
      passwordFilled = true;
      break;
    }
  }
  if (!passwordFilled) {
    throw new Error('No se encontró el campo de password en /auth/login');
  }

  const submitButton = page
    .getByRole('button', { name: /acceder al panel|iniciar sesi[oó]n|entrar/i })
    .first();
  if (!(await submitButton.isVisible().catch(() => false))) {
    throw new Error('No se encontró el botón de acceso en /auth/login');
  }
  await submitButton.click();

  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15_000 });
}

export async function mockAuthenticatedProducerSession(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/userinfo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 42,
          email: 'productor@test.es',
          firstName: 'Test',
          lastName: 'Productor',
          role: 'PRODUCER',
          producerCode: 'PROD-042',
          onboardingCompleted: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      }),
    });
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}