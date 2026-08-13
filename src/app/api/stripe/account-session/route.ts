/**
 * API Route: POST /api/stripe/account-session
 *
 * Crea una sesión de cuenta para Stripe Connect Embedded Components.
 * Reemplaza a `/api/stripe/connect` y `/api/stripe/connect/refresh` en el flujo embebido.
 *
 * Body: { accountId?: string; email?, firstName?, lastName?, businessName?, website? }
 * Respuesta: { success: true, data: { accountId, clientSecret } }
 *
 * Lógica:
 *   1. Si no viene accountId: reutilizar stripeAccountId existente si aplica, crear cuenta nueva si no.
 *   1b. (Nuevo) Si se crea una cuenta nueva, vincularla inmediatamente en BD antes de devolver clientSecret.
 *   2. Si viene accountId: verificar que pertenece al productor autenticado (IDOR prevention).
 *   3. Generar AccountSession con components.account_onboarding.enabled = true.
 *   4. Devolver accountId y clientSecret (nunca loguear clientSecret).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConnectAccount, createAccountSession } from '@/lib/stripe/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

function isValidStripeAccountId(accountId: string): boolean {
  return /^acct_[A-Za-z0-9]+$/.test(accountId);
}

/**
 * Reintenta el fetch a link-stripe-account con 3 intentos totales y 300ms entre cada uno.
 * Solo reintenta el paso de persistencia, nunca la creación de la cuenta (que ya tiene
 * idempotency key propia en createConnectAccount).
 *
 * @param accessToken Token de autorización para el gateway
 * @param stripeAccountId ID de la cuenta Stripe a vincular
 * @returns Respuesta del endpoint link-stripe-account si éxito, lanza si 3 intentos fallan
 */
async function linkAccountWithRetry(
  accessToken: string,
  stripeAccountId: string
): Promise<Response> {
  const maxAttempts = 3;
  const delayMs = 300;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(
        `${GATEWAY_URL}/api/v1/producers/onboarding/step/link-stripe-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ stripeAccountId }),
        }
      );

      if (res.ok) {
        return res;
      }

      // Si no es ok y no es el último intento, esperar y reintentar
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      // Error de red u otro — reintentar si no es el último
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }

  // Agotó los 3 intentos sin success
  throw new Error(
    `linkAccountWithRetry: failed after ${maxAttempts} attempts`
  );
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      accountId,
      email,
      firstName,
      lastName,
      businessName,
      website,
      source,
    } = body as {
      accountId?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      businessName?: string;
      website?: string;
      source?: 'onboarding' | 'account_payments';
    };

    // Obtener datos del productor autenticado del gateway
    const onboardingRes = await fetch(`${GATEWAY_URL}/api/v1/producers/onboarding/data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!onboardingRes.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo validar la cuenta del usuario' },
        { status: onboardingRes.status === 401 ? 401 : 502 },
      );
    }

    const onboardingJson = await onboardingRes.json() as {
      data?: { id?: string; payment?: { stripeAccountId?: string | null } };
    };
    const ownedAccountId = onboardingJson?.data?.payment?.stripeAccountId;
    const producerId = onboardingJson?.data?.id;

    let resolvedAccountId: string;

    if (accountId) {
      // Si viene accountId en el body, verificar que pertenece al usuario (IDOR prevention)
      if (!isValidStripeAccountId(accountId)) {
        return NextResponse.json(
          { success: false, error: 'accountId inválido' },
          { status: 400 },
        );
      }

      if (!ownedAccountId || ownedAccountId !== accountId) {
        return NextResponse.json(
          { success: false, error: 'Cuenta Stripe no autorizada para este usuario' },
          { status: 403 },
        );
      }

      resolvedAccountId = accountId;
    } else {
      // Si no viene accountId, reutilizar el existente si aplica
      if (ownedAccountId) {
        // El productor ya tiene una cuenta Stripe, reutilizarla
        resolvedAccountId = ownedAccountId;
      } else {
        // Crear una cuenta Stripe nueva
        // GUARDA: producerId debe estar disponible — es requisito para generar
        // la idempotency key dentro de createConnectAccount
        if (!producerId) {
          return NextResponse.json(
            {
              success: false,
              error: 'No se pudo determinar el productor autenticado',
            },
            { status: 502 }
          );
        }

        const account = await createConnectAccount({
          sellerId: producerId,
          email,
          firstName,
          lastName,
          businessName,
          website,
        });

        resolvedAccountId = account.id;

        // Vincular inmediatamente la cuenta recién creada en BD.
        // Si esto falla, no devolvemos clientSecret (vería el error en la rama de catch).
        // Esto cierra la ventana en la que un refetch de client_secret a mitad de sesión
        // no encontraba la cuenta reconocida en BD (causaba 403).
        // Reintentamos hasta 3 veces con 300ms entre intentos para cubrir
        // blips transitorios de red en el paso de persistencia.
        try {
          await linkAccountWithRetry(accessToken, resolvedAccountId);
        } catch (linkError) {
          // La cuenta se creó en Stripe pero el vínculo en BD falló.
          // Loguear para auditoría/reconciliación manual.
          console.error('[stripe-idempotency] CREATE_SUCCEEDED_LINK_FAILED', {
            stripeAccountId: resolvedAccountId,
            attempts: 3,
          });
          throw new Error(
            'No se pudo vincular la cuenta Stripe recien creada con el productor'
          );
        }
      }
    }

    // Generar la sesión de cuenta
    const session = await createAccountSession(resolvedAccountId);

    // IMPORTANTE: No loguear ni retornar el clientSecret en logs o console
    return NextResponse.json({
      success: true,
      data: {
        accountId: resolvedAccountId,
        clientSecret: session.clientSecret,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating account session:', message);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear la sesión de onboarding de Stripe',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 },
    );
  }
}
