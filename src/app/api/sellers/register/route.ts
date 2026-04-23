/**
 * API Route: Registro de vendedor
 * @route POST /api/sellers/register
 * @description Reenvía el registro al gateway → producers-service + auth-service.
 *              El gateway ejecuta la transacción completa en 4 pasos:
 *                1. Crea RegistrationRequest en producers-service
 *                2. Crea usuario en auth-service (PRODUCER role)
 *                3. Vincula authUserId al RegistrationRequest
 *                4. Envía email de confirmación (fire-and-forget)
 */

import { NextRequest, NextResponse } from 'next/server';
import { initialRegistrationSchema } from '@/lib/validations/seller';

const GATEWAY_URL =
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
  'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar en Next.js antes de enviar al gateway
    const validatedData = initialRegistrationSchema.parse(body);

    const response = await fetch(`${GATEWAY_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:          validatedData.contactName,
        lastName:           validatedData.contactSurname,
        email:              validatedData.email,
        phone:              validatedData.phone,
        password:           validatedData.password,
        businessName:       validatedData.businessName,
        businessType:       validatedData.businessType,
        producerCategory:   validatedData.producerCategory,
        street:             validatedData.street,
        streetNumber:       validatedData.streetNumber,
        streetComplement:   validatedData.streetComplement,
        province:           validatedData.province,
        municipio:          validatedData.municipio,
        postalCode:         validatedData.postalCode,
        whyOrigin:          validatedData.whyOrigin,
        acceptsTerms:       validatedData.acceptsTerms,
        acceptsPrivacy:     validatedData.acceptsPrivacy,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data?.message ?? 'Error al procesar la solicitud' },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error en registro:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
