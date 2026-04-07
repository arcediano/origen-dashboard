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

export async function loginAsProducer(page: Page, credentials: E2ECredentials): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel(/correo electrónico/i).fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page.getByRole('button', { name: /acceder al panel/i }).click();

  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15_000 });
}