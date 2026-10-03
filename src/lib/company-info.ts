/**
 * Datos de identificación de Origen (razón social, CIF, dirección, email),
 * tal como se registran en origen-admin → Configuración → Datos fiscales.
 * Solo servidor: alimentan las pantallas legales (/aviso-legal, /terminos,
 * /privacidad, /cookies). Fuente única: nunca se duplican a mano en el código.
 */

export interface CompanyInfo {
  businessName: string;
  taxId: string;
  address: string;
  email: string;
}

const TIMEOUT_MS = 3000;
/** Segundos de caché: un cambio en el admin llega a las pantallas legales en ≤ 5 min. */
export const COMPANY_INFO_REVALIDATE = 300;

const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function parseCompanyInfo(raw: unknown): CompanyInfo | null {
  const data = (raw as { data?: unknown } | null)?.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const info: CompanyInfo = {
    businessName: asText(d.businessName),
    taxId: asText(d.taxId),
    address: asText(d.address),
    email: asText(d.email),
  };
  // Sin razón social no hay identificación utilizable.
  return info.businessName ? info : null;
}

/**
 * GET /api/v1/orders/public/company-info. Ante cualquier fallo (red, timeout,
 * 4xx/5xx, cuerpo inesperado) devuelve null y las pantallas legales se
 * muestran igualmente, sin datos de identificación inventados.
 */
export async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
  const base = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/api/v1/orders/public/company-info`, {
      next: { revalidate: COMPANY_INFO_REVALIDATE },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseCompanyInfo(await res.json());
  } catch {
    return null;
  }
}

/** Líneas «Denominación social / CIF / Domicilio / Email» (solo las disponibles). */
export function companyIdentityItems(company: CompanyInfo | null): string[] {
  if (!company) return [];
  return [
    `Denominación social: ${company.businessName}`,
    company.taxId && `CIF: ${company.taxId}`,
    company.address && `Domicilio: ${company.address}`,
    company.email && `Email: ${company.email}`,
  ].filter((line): line is string => Boolean(line));
}

/** Bloque de contacto de las secciones; `undefined` si no hay email ni dirección. */
export function companyContact(
  company: CompanyInfo | null,
): { email: string; address: string } | undefined {
  if (!company || (!company.email && !company.address)) return undefined;
  return { email: company.email, address: company.address };
}
