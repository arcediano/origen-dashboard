/**
 * Cliente de Stripe para servidor
 * @module lib/stripe/server
 * @description Funciones de Stripe que solo se ejecutan en el servidor
 * 
 * ⚠️ IMPORTANTE: Este archivo solo debe importarse en Server Components
 * o API Routes. Nunca en componentes de cliente.
 */

import Stripe from 'stripe';

export type StripeOnboardingSource = 'onboarding' | 'account_payments';

function normalizeOnboardingSource(source?: string): StripeOnboardingSource {
  return source === 'account_payments' ? 'account_payments' : 'onboarding';
}

// Inicialización lazy — evita que next build falle cuando STRIPE_SECRET_KEY
// no está definida durante el análisis estático de páginas.
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
      maxNetworkRetries: 2,
    });
  }
  return _stripe;
}

// Re-export para compatibilidad con cualquier importación directa de `stripe`
const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Construye una idempotency key determinista y estable para la creación de una cuenta Connect.
 * La key es válida durante 24 horas en Stripe (caché incorporada).
 *
 * @param producerId UUID del productor (Producer.id de origen-master-microservices)
 * @returns Idempotency key en formato `connect-account-create:{producerId}`
 * @throws Error si producerId es undefined, null, o string vacío tras trim()
 */
export function buildCreateAccountIdempotencyKey(producerId: string): string {
  if (!producerId || typeof producerId !== 'string' || !producerId.trim()) {
    throw new Error(
      'buildCreateAccountIdempotencyKey: producerId must be a non-empty string'
    );
  }
  return `connect-account-create:${producerId}`;
}

/**
 * Crea una cuenta Connect de tipo Express para un vendedor
 * @param sellerId UUID del productor (Producer.id de origen-master-microservices),
 *                 DEBE ser el id real, nunca un valor sintético
 * @param email Email del vendedor
 * @param businessName Nombre del negocio
 * @returns Cuenta de Stripe creada
 */
export async function createConnectAccount(params: {
  sellerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  website?: string;
}) {
  const { sellerId, email, firstName, lastName, businessName, website } = params;

  // Validar que sellerId es el UUID real del productor, nunca un valor vacío
  // Lanza si no es válido — defensa en profundidad
  const idempotencyKey = buildCreateAccountIdempotencyKey(sellerId);

  try {
    const account = await stripe.accounts.create(
      {
        type: 'express',
        country: 'ES',
        ...(email ? { email } : {}),
        ...(businessName || website ? {
          business_profile: {
            ...(businessName ? { name: businessName } : {}),
            ...(website ? { url: website } : {}),
          },
        } : {}),
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          sellerId,
          platform: 'origen-marketplace',
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      },
      { idempotencyKey }
    );

    return account;
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    throw error;
  }
}


/**
 * Verifica el estado de una cuenta Connect
 * @param accountId ID de la cuenta de Stripe
 * @returns Estado de la cuenta
 */
export async function checkAccountStatus(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requiresAction: !account.details_submitted,
    };
  } catch (error) {
    console.error('Error checking account status:', error);
    throw error;
  }
}

/**
 * Crea un login link para el Stripe Dashboard de una cuenta Connect.
 * Se utiliza para permitir que el productor edite su cuenta directamente en Stripe.
 *
 * Si la cuenta tiene details_submitted=false, devuelve un flag requiresOnboarding=true
 * para que el frontend caiga al flujo startStripeOnboarding.
 *
 * Si la cuenta tiene requirements.disabled_reason !== null (cuenta restringida),
 * intenta crear el login link pero devuelve { restricted: true, disabledReason: ... }
 * en caso de que la restricción sea demasiado severa.
 *
 * @param accountId ID de la cuenta de Stripe
 * @returns { dashboardUrl: string } | { requiresOnboarding: true } | { restricted: true, disabledReason: string }
 */
export async function createDashboardLink(accountId: string) {
  try {
    // Primero, verifica el estado de la cuenta
    const account = await stripe.accounts.retrieve(accountId);

    // Si la cuenta aún no tiene detalles completados, retorna flag para onboarding
    if (!account.details_submitted) {
      return {
        requiresOnboarding: true,
      };
    }

    // Verificar si la cuenta está restringida
    const disabledReason = account.requirements?.disabled_reason ?? null;

    // Intentar crear login link
    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      return {
        dashboardUrl: loginLink.url,
      };
    } catch (loginLinkError) {
      // Si createLoginLink falla y la cuenta tiene disabled_reason, reportar la restricción
      if (disabledReason) {
        return {
          restricted: true,
          disabledReason,
        };
      }
      // Si no hay disabled_reason pero falla, relanzar el error
      throw loginLinkError;
    }
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    throw error;
  }
}

/**
 * Crea una sesión de cuenta para Stripe Connect Embedded Components
 * @param accountId ID de la cuenta de Stripe
 * @returns AccountSession con client_secret
 */
export async function createAccountSession(accountId: string) {
  try {
    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: { enabled: true },
      },
    });

    return {
      clientSecret: accountSession.client_secret,
    };
  } catch (error) {
    console.error('Error creating account session:', error);
    throw error;
  }
}

export { stripe };
