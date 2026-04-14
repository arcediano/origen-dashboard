/**
 * API Route: POST /api/stripe/connect
 *
 * Crea una cuenta Stripe Connect Express para el productor y devuelve
 * la URL de onboarding a la que redirigir al usuario.
 *
 * Flujo:
 *   1. Recibe { businessName?, email? } desde el componente step-stripe
 *   2. Crea la cuenta Express en Stripe
 *   3. Genera el Account Link con URLs de retorno que incluyen el accountId
 *   4. Devuelve { accountId, onboardingUrl }
 *
 * El guardado del stripeAccountId en la BD lo realiza el cliente (step-stripe)
 * llamando a saveStep6() antes de redirigir a Stripe, para garantizar que
 * el ID queda persistido incluso si el usuario abandona el flujo de Stripe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConnectAccount, createAccountLinkWithBase } from '@/lib/stripe/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    // Validar que el token corresponde a un productor autenticado
    const onboardingRes = await fetch(`${GATEWAY_URL}/api/v1/producers/onboarding/data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (onboardingRes.status === 401 || onboardingRes.status === 403) {
      return NextResponse.json(
        { success: false, error: 'Sesión inválida' },
        { status: 401 },
      );
    }

    if (!onboardingRes.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo validar la sesión del productor' },
        { status: 502 },
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, businessName, website } = body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      businessName?: string;
      website?: string;
      source?: 'onboarding' | 'account_payments';
    };
    const source = body?.source === 'account_payments' ? 'account_payments' : 'onboarding';

    const account = await createConnectAccount({
      sellerId: `producer-${Date.now()}`,
      email,
      firstName,
      lastName,
      businessName,
      website,
    });

    // Generar el Account Link con URLs de retorno que incluyen el accountId
    const accountLink = await createAccountLinkWithBase(account.id, baseUrl, source);

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creando cuenta Stripe Connect:', message);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al iniciar la conexión con Stripe',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 },
    );
  }
}
