/**
 * API Route: POST /api/stripe/connect/dashboard-link
 *
 * Genera un login link para el Stripe Dashboard de una cuenta Connect.
 * Se utiliza para permitir que el productor edite su cuenta directamente en Stripe.
 *
 * Patrones de seguridad:
 *   - Valida accessToken desde cookies
 *   - Verifica que stripeAccountId pertenece al usuario vía /api/v1/producers/onboarding/data
 *   - Maneja el caso especial details_submitted=false → fallback a onboarding
 *
 * Body: { stripeAccountId: string }
 * Respuesta:
 *   - success=true, data: { dashboardUrl: string }
 *   - success=true, data: { requiresOnboarding: true } (si details_submitted=false)
 *   - success=true, data: { restricted: true, disabledReason: string } (si cuenta restringida)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDashboardLink } from '@/lib/stripe/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

function isValidStripeAccountId(accountId: string): boolean {
  return /^acct_[A-Za-z0-9]+$/.test(accountId);
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
    const { stripeAccountId } = body as {
      stripeAccountId?: string;
    };

    if (!stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'stripeAccountId es requerido' },
        { status: 400 },
      );
    }

    if (!isValidStripeAccountId(stripeAccountId)) {
      return NextResponse.json(
        { success: false, error: 'stripeAccountId inválido' },
        { status: 400 },
      );
    }

    // Validar que la cuenta Stripe pertenece al usuario
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

    if (!ownedAccountId || ownedAccountId !== stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'Cuenta Stripe no autorizada para este usuario' },
        { status: 403 },
      );
    }

    // Intentar crear dashboard link
    const result = await createDashboardLink(stripeAccountId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creando dashboard link de Stripe:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el enlace del panel de Stripe' },
      { status: 500 },
    );
  }
}
