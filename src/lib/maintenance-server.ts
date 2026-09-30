/**
 * Modo mantenimiento — utilidades solo de servidor
 * (layout raíz y rutas API internas de Next).
 */

import { NextResponse } from 'next/server';
import {
  getMaintenanceMessage,
  isMaintenanceResponse,
  parseSiteStatus,
  type SiteStatus,
} from '@/lib/maintenance';

const SITE_STATUS_TIMEOUT_MS = 3000;

function gatewayUrl(): string {
  return (
    process.env.API_GATEWAY_URL ??
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
    'http://localhost:3000'
  );
}

/**
 * Consulta GET /api/v1/site-status sin caché.
 * FAIL-OPEN: ante cualquier fallo (red, timeout, 4xx/5xx, cuerpo inesperado)
 * devuelve null y la app funciona con normalidad.
 */
export async function fetchSiteStatus(): Promise<SiteStatus | null> {
  try {
    const res = await fetch(`${gatewayUrl()}/api/v1/site-status`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(SITE_STATUS_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseSiteStatus(await res.json());
  } catch {
    return null;
  }
}

/**
 * Si la respuesta del gateway es el 503 MAINTENANCE, devuelve la NextResponse
 * equivalente para propagarla al browser; en otro caso null.
 */
export async function maintenanceProxyResponse(
  gatewayRes: Response,
): Promise<NextResponse | null> {
  if (gatewayRes.status !== 503) return null;
  const data: unknown = await gatewayRes.clone().json().catch(() => null);
  if (!isMaintenanceResponse(gatewayRes.status, data)) return null;
  return NextResponse.json(
    { success: false, code: 'MAINTENANCE', message: getMaintenanceMessage(data) },
    { status: 503 },
  );
}
