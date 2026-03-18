/**
 * Cliente de Stripe para servidor
 * @module lib/stripe/server
 * @description Funciones de Stripe que solo se ejecutan en el servidor
 * 
 * ⚠️ IMPORTANTE: Este archivo solo debe importarse en Server Components
 * o API Routes. Nunca en componentes de cliente.
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG, calculatePlatformFee } from './config';

// Inicializar cliente de Stripe
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

/**
 * Crea una cuenta Connect de tipo Express para un vendedor
 * @param sellerId ID del vendedor en nuestra base de datos
 * @param email Email del vendedor
 * @param businessName Nombre del negocio
 * @returns Cuenta de Stripe creada
 */
export async function createConnectAccount(params: {
  sellerId: string;
  email?: string;
  businessName?: string;
  website?: string;
  address?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
}) {
  const { sellerId, email, businessName, website } = params;

  try {
    const account = await stripe.accounts.create({
      type: STRIPE_CONFIG.connectConfig.type,
      country: STRIPE_CONFIG.connectConfig.country,
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
      },
    });

    return account;
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    throw error;
  }
}

/**
 * Crea un Account Link para el onboarding del vendedor en Stripe.
 *
 * El accountId se incluye como query param en las URLs de retorno para que
 * las páginas de destino puedan verificar el estado de la cuenta sin necesidad
 * de almacenarlo en sesión del lado del servidor.
 *
 * @param accountId ID de la cuenta de Stripe
 * @returns Link de onboarding
 */
export async function createAccountLink(accountId: string) {
  try {
    const base = STRIPE_CONFIG.baseUrl;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/onboarding/stripe/refresh?accountId=${accountId}`,
      return_url: `${base}/onboarding/stripe/complete?accountId=${accountId}`,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
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
 * Crea un Payment Intent con comisión automática para la plataforma
 * @param amount Monto total en céntimos
 * @param sellerStripeAccountId ID de cuenta Stripe del vendedor
 * @param orderId ID del pedido
 * @returns Payment Intent creado
 */
export async function createPaymentIntent(
  amount: number,
  sellerStripeAccountId: string,
  orderId: string
) {
  try {
    const platformFee = calculatePlatformFee(amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      metadata: {
        orderId,
        platformFee: platformFee.toString(),
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export { stripe };
