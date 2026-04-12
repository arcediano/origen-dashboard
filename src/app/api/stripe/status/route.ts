/**
 * API Route: GET /api/stripe/status?accountId=acct_xxx
 *
 * Verifica el estado de una cuenta Stripe Connect Express.
 * Usado por la página /onboarding/stripe/complete para confirmar
 * que el productor ha completado el onboarding en Stripe antes
 * de marcar la conexión como activa en la BD.
 *
 * Requiere autenticación (HttpOnly cookie accessToken) y verifica
 * que el accountId solicitado pertenece al productor autenticado.
 *
 * Respuesta:
 *   { chargesEnabled, payoutsEnabled, detailsSubmitted }
 *
 *   - detailsSubmitted: true → el productor completó el formulario de Stripe
 *   - chargesEnabled: true → la cuenta puede recibir pagos (verificación completa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAccountStatus } from '@/lib/stripe/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

function isValidStripeAccountId(accountId: string): boolean {
  return /^acct_[A-Za-z0-9]+$/.test(accountId);
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

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

  // Verificar que el accountId pertenece al productor autenticado
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

  try {
    const status = await checkAccountStatus(accountId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error verificando estado de cuenta Stripe:', error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar el estado de la cuenta Stripe' },
      { status: 500 },
    );
  }
}
