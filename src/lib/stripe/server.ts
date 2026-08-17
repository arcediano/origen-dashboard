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
 *
 * INVARIANTE CRÍTICA: El payload protegido por idempotencyKey
 * (`stripe.accounts.create()`) NUNCA debe contener datos que el usuario pueda editar
 * (email, business_profile, firstName, lastName). Estos se aplican SIEMPRE vía
 * `stripe.accounts.update()` posterior, fuera de la protección de idempotencia.
 * Cualquier campo nuevo que se añada a esta función debe evaluarse conforme a esta regla:
 * si es editable por el usuario, debe ir en update(), nunca en create().
 *
 * Violar esta invariante reabre el escenario de `idempotency_error` cuando el usuario
 * edita su perfil entre un intento fallido y un reintento dentro de las 24h.
 *
 * @param sellerId UUID del productor (Producer.id de origen-master-microservices),
 *                 DEBE ser el id real, nunca un valor sintético
 * @param email Email del vendedor (aplicado vía update después de creación)
 * @param firstName Nombre del vendedor (aplicado vía update después de creación)
 * @param lastName Apellido del vendedor (aplicado vía update después de creación)
 * @param businessName Nombre del negocio (aplicado vía update después de creación)
 * @param website URL del sitio web (aplicado vía update después de creación)
 * @returns Cuenta de Stripe creada (con perfil actualizado si se proporcionaron datos)
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

  let account: Stripe.Account;

  try {
    // Crear la cuenta con payload INVARIABLE por sellerId (nunca campos editables)
    // Solo: type, country, capabilities, metadata.sellerId, metadata.platform
    account = await stripe.accounts.create(
      {
        type: 'express',
        country: 'ES',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          sellerId,
          platform: 'origen-marketplace',
        },
      },
      { idempotencyKey }
    );
  } catch (error) {
    // Manejo defensivo: si ocurre idempotency_error pese a la invariante,
    // es síntoma de una regresión (alguien añadió un campo editable sin darse cuenta).
    // Loguear de forma distinguible para observabilidad y relanzar sin reintentar.
    if (error && typeof error === 'object' && (error as any).type === 'idempotency_error') {
      console.error(
        '[stripe-idempotency] UNEXPECTED_IDEMPOTENCY_ERROR_ON_INVARIANT_PAYLOAD',
        { sellerId }
      );
    } else {
      console.error('Error creating Stripe account:', error);
    }
    throw error;
  }

  // Aplicar perfil (email, business_profile, firstName, lastName) vía update()
  // fuera de la protección de idempotencia. No necesita su propia key porque
  // un update con los mismos valores es inofensivo (no crea recursos).
  const hasProfileData = email || businessName || website || firstName || lastName;
  if (hasProfileData) {
    try {
      const updatePayload: Stripe.AccountUpdateParams = {
        metadata: {
          sellerId,
          platform: 'origen-marketplace',
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      };

      if (email) {
        updatePayload.email = email;
      }

      if (businessName || website) {
        updatePayload.business_profile = {
          ...(businessName ? { name: businessName } : {}),
          ...(website ? { url: website } : {}),
        };
      }

      await stripe.accounts.update(account.id, updatePayload);
    } catch (updateError) {
      // Fallo del update no es bloqueante — loguear sin relanzar
      // (el formulario embebido de Stripe puede solicitar los datos que falten)
      console.error(
        'Warning: failed to update Stripe account profile (non-blocking)',
        {
          accountId: account.id,
          error: updateError instanceof Error ? updateError.message : String(updateError),
        }
      );
      // No relanzar — devolvemos la cuenta creada
    }
  }

  return account;
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
