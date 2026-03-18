/**
 * API Route: GET /api/stripe/status?accountId=acct_xxx
 *
 * Verifica el estado de una cuenta Stripe Connect Express.
 * Usado por la página /onboarding/stripe/complete para confirmar
 * que el productor ha completado el onboarding en Stripe antes
 * de marcar la conexión como activa en la BD.
 *
 * Respuesta:
 *   { chargesEnabled, payoutsEnabled, detailsSubmitted }
 *
 *   - detailsSubmitted: true → el productor completó el formulario de Stripe
 *   - chargesEnabled: true → la cuenta puede recibir pagos (verificación completa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAccountStatus } from '@/lib/stripe/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: 'accountId es requerido' },
      { status: 400 },
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
