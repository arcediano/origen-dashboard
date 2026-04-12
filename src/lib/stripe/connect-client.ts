import { saveStep6 } from '@/lib/api/onboarding';

const STRIPE_ONBOARDING_CACHE_KEY = 'origen:stripe:onboarding-link';
const STRIPE_ONBOARDING_CACHE_TTL_MS = 4 * 60 * 1000;

interface StripeOnboardingResponse {
  success: boolean;
  data?: {
    accountId?: string;
    onboardingUrl?: string;
  };
  error?: string;
  detail?: string;
}

export interface StartStripeOnboardingOptions {
  stripeAccountId?: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  website?: string;
}

function resolveErrorMessage(response: StripeOnboardingResponse, fallback: string): string {
  return response.detail ? `${response.error ?? fallback}: ${response.detail}` : response.error ?? fallback;
}

function isTrustedStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'connect.stripe.com';
  } catch {
    return false;
  }
}

interface StripeOnboardingLinkCache {
  accountId?: string;
  url: string;
  createdAt: number;
}

function readCachedOnboardingLink(accountId?: string | null): string | null {
  if (typeof window === 'undefined') return null;

  if (!accountId) {
    // Never reuse cache when caller does not know which Stripe account should be opened.
    return null;
  }

  const raw = window.localStorage.getItem(STRIPE_ONBOARDING_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StripeOnboardingLinkCache;
    if (!parsed.url || !parsed.createdAt || !isTrustedStripeUrl(parsed.url)) return null;

    const isExpired = Date.now() - parsed.createdAt > STRIPE_ONBOARDING_CACHE_TTL_MS;
    if (isExpired) return null;

    // If we already know accountId, ensure the cached link belongs to the same account.
    if (parsed.accountId && parsed.accountId !== accountId) {
      return null;
    }

    return parsed.url;
  } catch {
    return null;
  }
}

function cacheOnboardingLink(url: string, accountId?: string): void {
  if (typeof window === 'undefined') return;

  if (!isTrustedStripeUrl(url)) {
    return;
  }

  const payload: StripeOnboardingLinkCache = {
    url,
    accountId,
    createdAt: Date.now(),
  };

  window.localStorage.setItem(STRIPE_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
}

export async function startStripeOnboarding(options: StartStripeOnboardingOptions): Promise<void> {
  const cachedLink = readCachedOnboardingLink(options.stripeAccountId);
  if (cachedLink) {
    window.location.href = cachedLink;
    return;
  }

  if (options.stripeAccountId) {
    const res = await fetch('/api/stripe/connect/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: options.stripeAccountId }),
    });

    const json = await res.json() as StripeOnboardingResponse;
    if (!json.success || !json.data?.onboardingUrl) {
      throw new Error(resolveErrorMessage(json, 'Error al renovar el enlace de Stripe'));
    }

    if (!isTrustedStripeUrl(json.data.onboardingUrl)) {
      throw new Error('URL de Stripe no válida');
    }

    cacheOnboardingLink(json.data.onboardingUrl, options.stripeAccountId ?? undefined);
    window.location.href = json.data.onboardingUrl;
    return;
  }

  const res = await fetch('/api/stripe/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: options.email,
      firstName: options.firstName,
      lastName: options.lastName,
      businessName: options.businessName,
      website: options.website,
    }),
  });

  const json = await res.json() as StripeOnboardingResponse;
  if (!json.success || !json.data?.accountId || !json.data?.onboardingUrl) {
    throw new Error(resolveErrorMessage(json, 'Error al crear la cuenta Stripe'));
  }

  if (!isTrustedStripeUrl(json.data.onboardingUrl)) {
    throw new Error('URL de Stripe no válida');
  }

  await saveStep6({
    stripeConnected: false,
    stripeAccountId: json.data.accountId,
    acceptTerms: false,
  });

  cacheOnboardingLink(json.data.onboardingUrl, json.data.accountId);
  window.location.href = json.data.onboardingUrl;
}