/**
 * Route Handler: GET /api/document-download
 *
 * Proxy server-side para obtener una URL prefirmada de S3 para un documento privado.
 * Lee el cookie HttpOnly `accessToken` (inaccesible desde JS del browser) y lo
 * envía como `Authorization: Bearer <token>` al gateway.
 *
 * Flujo:
 *   Browser (GET ?key=documents/...) → Next.js Route Handler
 *     → Gateway GET /api/v1/producers/me/documents/download-url?key=...
 *       → media-service GET /internal/media/signed-url?key=...&expiresIn=300
 *         → S3 SDK genera presigned GET URL (TTL 300 s)
 *
 * Respuesta: { downloadUrl: string }
 * El browser usa `downloadUrl` para abrir o descargar el documento directamente desde S3.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GATEWAY_URL =
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
  'http://localhost:3000';

if (!process.env.API_GATEWAY_URL && !process.env.NEXT_PUBLIC_API_GATEWAY_URL) {
  console.error('[document-download] ⚠️  Ninguna variable API_GATEWAY_URL configurada — usando localhost:3000');
}

/** Solo se permiten claves bajo el prefijo documents/ con caracteres seguros */
const DOCUMENT_KEY_REGEX = /^documents\/[\w\-.\/]+$/;

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'No autenticado' },
      { status: 401 },
    );
  }

  const key = req.nextUrl.searchParams.get('key');
  if (!key || !DOCUMENT_KEY_REGEX.test(key)) {
    return NextResponse.json(
      { success: false, message: 'Clave de documento inválida' },
      { status: 400 },
    );
  }

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(
      `${GATEWAY_URL}/api/v1/producers/me/documents/download-url?key=${encodeURIComponent(key)}`,
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
