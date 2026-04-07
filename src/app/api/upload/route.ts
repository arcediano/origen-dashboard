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
 * El browser ya no necesita credentials: 'include' para este endpoint porque
 * el Route Handler lee los cookies server-side y los reenvía manualmente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';

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

  // Obtener el FormData del request original
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error procesando el formulario' },
      { status: 400 },
    );
  }

  // Reenviar al gateway con el token en el header Authorization
  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(`${GATEWAY_URL}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Error conectando con el servidor de archivos' },
      { status: 502 },
    );
  }

  // Reenviar la respuesta del gateway al browser
  const data = await gatewayRes.json().catch(() => ({}));

  return NextResponse.json(data, { status: gatewayRes.status });
}
