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
import { createConnectAccount, createAccountLink } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, businessName } = body as {
      email?: string;
      businessName?: string;
    };

    // Crear cuenta Express en Stripe (email y businessName son opcionales —
    // Stripe los solicitará durante el onboarding si no se proporcionan)
    const account = await createConnectAccount(
      `producer-${Date.now()}`, // sellerId interno — identificador único provisional
      email ?? '',
      businessName ?? '',
    );

    // Generar el Account Link con URLs de retorno que incluyen el accountId
    const accountLink = await createAccountLink(account.id);

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      },
    });
  } catch (error) {
    console.error('Error creando cuenta Stripe Connect:', error);
    return NextResponse.json(
      { success: false, error: 'Error al iniciar la conexión con Stripe' },
      { status: 500 },
    );
  }
}
