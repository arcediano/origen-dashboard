/**
 * @file jwt-cookie.ts
 * @description Helper para generar un accessToken JWT RS256 firmado con la clave
 * de test y establecerlo como cookie HttpOnly antes de cada test E2E protegido.
 *
 * La clave privada aquí es SOLO para tests. La clave pública correspondiente
 * se configura en JWT_PUBLIC_KEY dentro de .env.local para que el middleware
 * pueda verificar los tokens generados por este helper.
 *
 * NUNCA usar estas claves en producción.
 */

import { SignJWT, importPKCS8 } from 'jose';
import type { BrowserContext, Page } from '@playwright/test';

// ─── TEST RSA PRIVATE KEY (matches JWT_PUBLIC_KEY in .env.local) ──────────────
const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDf/aA5MBTiGLHs
IVBSzavEohufkFS9mARkUg1Ps2X4NsdtVFFhymrQBYCcxs7XWRvyuMJE1bTgcmiU
rCK4KlCSvqknWmX+ax2uqkD2joxQfzF/oWzI6vMqunyWeUyRnk5jtD4kjX7CDle4
rKtKGGAbtV62aVP0XQXUxNI/uZiTdVVK/f9pwAQkVWGMogauxVpEP4IJkFeS45lX
dWOuFTS6r0IUhv+7/BxUQJWnPfLBJC1vniFOTDHmRoA6VUVZxsHO5DW+fOpk+Sj+
yPJWEJGdXVVr/0EUIDpqViKA/6HBiL1rM4qaXR5XIUBp00lgyeEDIlxpJciFWK+i
+xKRBvT1AgMBAAECggEACFEat0tH8Z+b6gbQPH+mGa/9n8gawJg5zLiYBYlfIOWp
Zy+fsfNAUg1r2bMvQ1aFfInlrlHTdhecnUb8jXAGYkLk28qcfONHTKpfrSGP2v4a
1wCMaucAAZ2MOlFL4yBIpgt8PzYA932gcWf5fpydfPBLRJfWmTBj1gmhpBVLfmlM
FfmMcJ+SaLkGo46S6Ea6h4maACw/rZDgw+IXitPn5FGx7SvfCnkpLA2PyBSqx/js
nKcxOtA/u6WQKUZqJcHwNOif4pvJorGFAPf2JgQAukICMtUjsk406z4BVtpd1cGf
/KxEZdmxpj3tFaE0ncm7ASaN0SY38uyD6UDmOrIPIQKBgQD9AqSnqdcV4It483Pe
OQVx1giih64ptbMhsSU7HjgZ4rVPE+449GDbreF/OTn3o1kWWsREfmrt/WlMmE1C
kAUs+nJddlauKbE+yzkH4qjkCf5oDNi0Mh4o7s3eAF/Hljl07/rD+5gvEHEdsVM8
IMbFYgYfj8pn+zrOOuB2RWsEzQKBgQDiozLGIZQnsgmPaM6LDPFqaXIGREWMVZvd
jZA+xKY39gtt2dcjqIzrTt7yfPL+paQPyGOrUvmixXFY3uINKfyKaOyjUcHYqMfP
WC0jqZGDNveyTn42bDD8b9d8sg76nyxsyXc82wUI3j7XFa3fh5j690aNt8snsa/r
RydEqYDwyQKBgQCqKJjsWgFZqUaj9be7gMX0pWnxRScQzi7HPgg4Fj7Myff+Uv0o
ONLba7n4glhGAAnuSuUs24i2vnOPG+76ETop4dYAnZH2V/voq2yTrRDBLSd4ewtT
RVGbXd/+qmnAJXxG9Q7Ft/PF010ABz5fdfu4zBAqMd6CyCfogxhq8ozjEQKBgGC4
p1WZRQI/4AadAvCi4HC6eZglEM1YR8GgxbuT7yAY2D3UZxVnvGQ777frDUUR6dd2
fNrD+Ze2za3QyQY3Mfjb2InGvYS6WzOo/PKoTlqCXelxyDlvqORC0uL7lprszWfL
/yAwlJB5ULY4IVExLF+Gokye8IuLMHmnjyGleUrJAoGALOXUUeGSlvXlsGuP7Ir7
2olYU8/xlcOzitWdTM+16JvUj4c+B/aVihpmn/9/6YyyDqoWNI6OM1bmH/OWTClc
dynlFFdrYA1NSub/CP9L09uyXmAFvkidKl5DVglSClkjDlEBiSJJtO6IhBctG09B
H5vTBsLy4Yhd5Bl/wnVAsmI=
-----END PRIVATE KEY-----`;

let _cachedPrivateKey: Awaited<ReturnType<typeof importPKCS8>> | null = null;

async function getTestPrivateKey() {
  if (!_cachedPrivateKey) {
    _cachedPrivateKey = await importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256');
  }
  return _cachedPrivateKey;
}

/**
 * Genera un JWT RS256 de test con payload de productor.
 * Expira en 1 hora.
 */
export async function generateTestJwt(userId = 42): Promise<string> {
  const privateKey = await getTestPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: String(userId),
    id: userId,
    email: 'productor@test.es',
    role: 'PRODUCER',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600) // 1 hora
    .sign(privateKey);
}

/**
 * Establece el accessToken JWT como cookie en el contexto del navegador.
 * Debe llamarse ANTES de navegar a cualquier ruta protegida.
 */
export async function setAuthCookie(
  context: BrowserContext,
  baseURL = 'http://localhost:3001',
): Promise<void> {
  const token = await generateTestJwt();

  await context.addCookies([
    {
      name: 'accessToken',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Shortcut: establece el cookie de auth a partir del objeto `page`.
 */
export async function authenticatePage(page: Page, baseURL = 'http://localhost:3001'): Promise<void> {
  await setAuthCookie(page.context(), baseURL);
}
