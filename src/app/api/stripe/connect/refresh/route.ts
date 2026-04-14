/**
 * API Route: POST /api/stripe/connect/refresh
 *
 * Genera un nuevo Account Link para una cuenta Stripe ya existente.
 * Se usa cuando el enlace anterior ha caducado (Stripe los expira en ~5 min).
 *
 * Body: { accountId: string }
 * Respuesta: { success: true, data: { onboardingUrl: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAccountLinkWithBase } from '@/lib/stripe/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

function isValidStripeAccountId(accountId: string): boolean {
  return /^acct_[A-Za-z0-9]+$/.test(accountId);
}

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

    const body = await request.json();
    const { accountId, source } = body as {
      accountId?: string;
      source?: 'onboarding' | 'account_payments';
    };
    const normalizedSource = source === 'account_payments' ? 'account_payments' : 'onboarding';

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId es requerido' },
        { status: 400 },
      );
    }

    if (!isValidStripeAccountId(accountId)) {
      return NextResponse.json(
        { success: false, error: 'accountId inválido' },
        { status: 400 },
      );
    }

    const onboardingRes = await fetch(`${GATEWAY_URL}/api/v1/producers/onboarding/data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!onboardingRes.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo validar la cuenta Stripe del usuario' },
        { status: 502 },
      );
    }

    const onboardingJson = await onboardingRes.json() as {
      data?: { payment?: { stripeAccountId?: string | null } };
    };
    const ownedAccountId = onboardingJson?.data?.payment?.stripeAccountId;

    if (!ownedAccountId || ownedAccountId !== accountId) {
      return NextResponse.json(
        { success: false, error: 'Cuenta Stripe no autorizada para este usuario' },
        { status: 403 },
      );
    }

    const accountLink = await createAccountLinkWithBase(accountId, baseUrl, normalizedSource);

    return NextResponse.json({
      success: true,
      data: { onboardingUrl: accountLink.url },
    });
  } catch (error) {
    console.error('Error renovando Account Link de Stripe:', error);
    return NextResponse.json(
      { success: false, error: 'Error al renovar el enlace de Stripe' },
      { status: 500 },
    );
  }
}
