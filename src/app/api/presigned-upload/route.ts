/**
 * Route Handler: GET /api/presigned-upload
 *
 * Proxy server-side para obtener una URL prefirmada de S3 a través del gateway.
 * Lee el cookie HttpOnly `accessToken` (inaccesible desde JS del browser) y lo
 * envía como `Authorization: Bearer <token>` al gateway.
 *
 * Flujo:
 *   Browser (GET ?mimeType=...&entityType=...) → Next.js Route Handler
 *     → Gateway GET /api/v1/media/presigned-upload
 *       → media-service GET /media/presigned-upload
 *         → S3 SDK genera presigned PUT URL
 *
 * Respuesta: { key, uploadUrl, publicUrl }
 * El browser usa `uploadUrl` para hacer PUT directamente a S3 sin pasar por el servidor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GATEWAY_URL =
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
  'http://localhost:3000';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'No autenticado' },
      { status: 401 },
    );
  }

  const { searchParams } = req.nextUrl;
  const mimeType    = searchParams.get('mimeType');
  const entityType  = searchParams.get('entityType');
  const entityId    = searchParams.get('entityId');
  const category    = searchParams.get('category');

  if (!mimeType || !entityType) {
    return NextResponse.json(
      { success: false, message: 'mimeType y entityType son obligatorios' },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({ mimeType, entityType });
  if (entityId) params.set('entityId', entityId);
  if (category)  params.set('category', category);

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(
      `${GATEWAY_URL}/api/v1/media/presigned-upload?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error conectando con el servidor' },
      { status: 502 },
    );
  }

  const data = await gatewayRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: gatewayRes.status });
}
