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
import { createAccountLink } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body as { accountId?: string };

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId es requerido' },
        { status: 400 },
      );
    }

    const accountLink = await createAccountLink(accountId);

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
