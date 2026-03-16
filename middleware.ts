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
import { jwtVerify, importSPKI, type KeyLike } from 'jose';

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ['/dashboard'];
const AUTH_PREFIXES      = ['/auth/login', '/auth/register'];

// ─── CACHÉ DE CLAVE PÚBLICA ───────────────────────────────────────────────────
// La clave pública se importa una sola vez por instancia del Edge Worker y se
// cachea en memoria. Reimportarla en cada request sería innecesariamente costoso.

let _cachedPublicKey: KeyLike | null = null;

async function getPublicKey(): Promise<KeyLike | null> {
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

  const accessTokenCookie = request.cookies.get('accessToken');
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage  = AUTH_PREFIXES.some(p => pathname.startsWith(p));

  // ── 1. Ruta protegida sin cookie → redirect inmediato (sin validar JWT) ─────
  if (isProtected && !accessTokenCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
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
      return response;
    }
  }

  // ── 3. Página de auth con sesión activa → redirigir al dashboard ─────────────
  if (isAuthPage && accessTokenCookie) {
    const valid = await isValidToken(accessTokenCookie.value);
    if (valid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Token presente pero inválido: dejar pasar al login (se limpiará allí)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
