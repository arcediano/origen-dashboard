/**
 * Next.js Middleware — Protección de rutas con validación JWT local (RS256)
 *
 * Se ejecuta ANTES de que Next.js renderice cualquier página.
 * Corre en Edge Runtime (V8 Isolates) — sin Node.js APIs, sin filesystem.
 *
 * FLUJO DE VALIDACIÓN:
 *   1. Comprueba si existe la cookie accessToken (HttpOnly, invisible en JS)
 *   2. Verifica la firma del JWT con la clave pública RS256 (operación local,
 *      sin ninguna llamada de red al gateway ni al auth-service)
 *   3. Comprueba que el token no haya expirado (jose lo hace automáticamente)
 *
 * ¿POR QUÉ CLAVE PÚBLICA Y NO SECRETA?
 *   Con HS256 (simétrico) el middleware necesitaría el mismo secreto que firma
 *   los tokens → exposición de la clave de firma.
 *   Con RS256 (asimétrico):
 *     - PRIVATE KEY: solo en auth-service, solo firma.
 *     - PUBLIC KEY: se puede compartir libremente, solo verifica.
 *   El middleware solo necesita la PUBLIC KEY → no puede forjar tokens.
 *
 * VARIABLE DE ENTORNO REQUERIDA (server-side, sin prefijo NEXT_PUBLIC_):
 *   JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIj...\n-----END PUBLIC KEY-----
 *   Los saltos de línea del PEM deben codificarse como \n en el .env.
 *
 * POLÍTICA DE SEGURIDAD (app de administración):
 *   Token expirado o inválido → redirect a /auth/login (fail-secure).
 *   NO se intenta renovar el token automáticamente.
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, importSPKI, type CryptoKey, type KeyObject } from 'jose';

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];
const AUTH_PREFIXES      = ['/auth/login', '/auth/register'];

// ─── CSP CON NONCE ────────────────────────────────────────────────────────────
/**
 * Construye el header Content-Security-Policy con nonce por request.
 *
 * NOTA: style-src mantiene 'unsafe-inline' porque:
 * - next/font inyecta <style> inline con @font-face (compatible con nonce)
 * - El proyecto usa style={{...}} directamente en 24 archivos .tsx
 * - framer-motion y recharts escriben estilos inline en tiempo de ejecución
 * - La directiva nonce-* en style-src NO cubre el atributo style="..."
 *   (limitación del estándar CSP, no de Next.js)
 * - Los valores de esos estilos son dinámicos (animaciones, gráficos), imposible
 *   usar hashes CSP como alternativa
 * → Mantener 'unsafe-inline' es necesario y documentado explícitamente.
 *
 * El script de hidratación de Next.js y los <style> de next/font serán
 * detectados automáticamente por Next.js App Router e inyectados con el
 * nonce, sin que sea necesario tocar el código de la app.
 */
function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://connect-js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://connect-js.stripe.com https://js.stripe.com https://hooks.stripe.com",
    "img-src 'self' data: https://storage.googleapis.com https://res.cloudinary.com https://*.cloudfront.net https://*.amazonaws.com https://images.unsplash.com https://*.stripe.com",
    "connect-src 'self' https://api.stripe.com https://connect-js.stripe.com",
  ].join('; ');
}

// ─── CACHÉ DE CLAVE PÚBLICA ───────────────────────────────────────────────────
// La clave pública se importa una sola vez por instancia del Edge Worker y se
// cachea en memoria. Reimportarla en cada request sería innecesariamente costoso.

type PublicKey = CryptoKey | KeyObject;
let _cachedPublicKey: PublicKey | null = null;

async function getPublicKey(): Promise<PublicKey | null> {
  if (_cachedPublicKey) return _cachedPublicKey;

  const rawPem = process.env.JWT_PUBLIC_KEY;
  if (!rawPem) {
    console.error('[middleware] JWT_PUBLIC_KEY no configurada — fail-secure: todas las sesiones rechazadas');
    return null;
  }

  try {
    // Los .env codifican los saltos de línea PEM como \n literal — normalizarlos
    const pem = rawPem.replace(/\\n/g, '\n');
    _cachedPublicKey = await importSPKI(pem, 'RS256');
    return _cachedPublicKey;
  } catch (err) {
    console.error('[middleware] Error importando JWT_PUBLIC_KEY:', err);
    return null;
  }
}

// ─── VALIDACIÓN JWT ───────────────────────────────────────────────────────────

/**
 * Verifica la firma y la expiración del token JWT usando la clave pública RS256.
 * Operación local — sin llamadas de red.
 *
 * @returns true  → token válido y no expirado
 * @returns false → token inválido, expirado, o clave no disponible
 */
async function isValidToken(token: string): Promise<boolean> {
  const publicKey = await getPublicKey();

  // Sin clave pública configurada: fail-secure
  if (!publicKey) return false;

  try {
    await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      // jose comprueba automáticamente `exp` (expiración) y `nbf` (not before)
    });
    return true;
  } catch {
    // JWTExpired, JWTInvalid, JWTClaimValidationFailed, etc.
    return false;
  }
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── CSP CON NONCE ────────────────────────────────────────────────────────────
  // Generar nonce criptográfico por request (Edge Runtime tiene Web Crypto API)
  // Usar crypto.getRandomValues() + btoa() para máxima compatibilidad con Edge Runtime
  const nonceBuffer = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...nonceBuffer));
  const cspHeader = buildCspHeader(nonce);

  // Preparar headers para propagar el nonce hacia Next.js App Router
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  // ───────────────────────────────────────────────────────────────────────────────

  const accessTokenCookie = request.cookies.get('accessToken');
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage  = AUTH_PREFIXES.some(p => pathname.startsWith(p));

  // ── 1. Ruta protegida sin cookie → redirect inmediato (sin validar JWT) ─────
  if (isProtected && !accessTokenCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // ── 2. Ruta protegida con cookie → validar JWT ───────────────────────────────
  if (isProtected && accessTokenCookie) {
    const valid = await isValidToken(accessTokenCookie.value);

    if (!valid) {
      // Token expirado o manipulado → redirigir al login con mensaje
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('reason', 'expired');
      loginUrl.searchParams.set(
        'message',
        encodeURIComponent('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.')
      );
      const response = NextResponse.redirect(loginUrl);
      // Eliminar la cookie inválida para no volver a evaluarla
      response.cookies.delete('accessToken');
      response.headers.set('Content-Security-Policy', cspHeader);
      return response;
    }
  }

  // ── 3. Página de auth con sesión activa → redirigir al dashboard ─────────────
  if (isAuthPage && accessTokenCookie) {
    const valid = await isValidToken(accessTokenCookie.value);
    if (valid) {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.headers.set('Content-Security-Policy', cspHeader);
      return response;
    }
    // Token presente pero inválido: dejar pasar al login (se limpiará allí)
  }

  // ─── CSP CON NONCE (continuación) ─────────────────────────────────────────────
  // Propagar el nonce tanto en request (para que Next.js lo detecte y lo aplique
  // a <script> y <style> que inyecta internamente) como en response (que es lo
  // que efectivamente llega al navegador).
  //
  // NOTA FUTURA: Si en el futuro se añade un <script> o <style> manual en JSX,
  // ese script/style necesitará recibir el nonce vía la prop `nonce` leyendo
  // headers() en un Server Component y pasándolo explícitamente. Por ahora,
  // no hay scripts/estilos manuales en el código, por lo que Next.js lo maneja
  // automáticamente.
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
  // ───────────────────────────────────────────────────────────────────────────────
}

export const config = {
  // Matcher ampliado para cubrir todas las rutas de páginas HTML (App Router),
  // excluyendo assets estáticos, imágenes optimizadas y archivos internos de Next.js.
  // Patrón recomendado por Next.js para middleware que debe ejecutarse en todas las
  // páginas pero no en recursos estáticos.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
