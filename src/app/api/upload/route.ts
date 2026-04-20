/**
 * Route Handler: POST /api/upload
 *
 * Proxy server-side para subida de ficheros a S3 a través del gateway.
 * Se encarga de leer el cookie HttpOnly `accessToken` (inaccesible desde JS
 * del browser) y añadirlo como `Authorization: Bearer <token>` en la
 * petición al gateway.
 *
 * Flujo:
 *   Browser (FormData) → Next.js Route Handler → Gateway /api/v1/media/upload
 *
 * El browser no necesita credentials: 'include' para este endpoint porque
 * el Route Handler lee los cookies server-side y los reenvía manualmente.
 *
 * Estrategia de reenvío:
 * El body se lee como ArrayBuffer y se reenvía tal cual, preservando el
 * Content-Type original (multipart/form-data con su boundary). Esto evita
 * los problemas de re-serialización que ocurren al parsear y reconstruir el
 * FormData, especialmente con archivos grandes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API_GATEWAY_URL (server-only) tiene prioridad; si no está, cae a NEXT_PUBLIC_.
// Esto permite configurar la URL del gateway en Vercel como variable privada.
const GATEWAY_URL =
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
  'http://localhost:3000';

// Aumentar duración máxima para uploads de imágenes grandes en Vercel Pro
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Leer el accessToken del cookie HttpOnly server-side
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'No autenticado' },
      { status: 401 },
    );
  }

  // Leer el Content-Type original (incluye el multipart boundary)
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json(
      { success: false, message: 'Se esperaba multipart/form-data' },
      { status: 400 },
    );
  }

  // Leer el body como bytes sin re-parsear: preserva el boundary original
  let rawBody: ArrayBuffer;
  try {
    rawBody = await req.arrayBuffer();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error leyendo el cuerpo de la solicitud' },
      { status: 400 },
    );
  }

  // Reenviar al gateway con el token en el header Authorization
  // y el Content-Type original para que el parser multipart del gateway funcione
  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(`${GATEWAY_URL}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': contentType,
      },
      body: rawBody,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error conectando con el servidor de archivos' },
      { status: 502 },
    );
  }

  // Reenviar la respuesta del gateway al browser
  const data = await gatewayRes.json().catch(() => ({}));

  return NextResponse.json(data, { status: gatewayRes.status });
}
