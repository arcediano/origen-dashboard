/**
 * Next.js Middleware — Protección de rutas a nivel de servidor
 *
 * Se ejecuta ANTES de que Next.js renderice cualquier página o API Route.
 * Protege /dashboard/* comprobando la presencia de la cookie accessToken
 * en la cabecera HTTP de la petición (los cookies HttpOnly son visibles
 * en el servidor, aunque no desde document.cookie en el navegador).
 *
 * IMPORTANTE: Esta capa no valida la firma del JWT (eso lo hace el gateway).
 * Su función es evitar que Next.js renderice contenido protegido para
 * peticiones sin sesión, reduciendo la superficie de exposición.
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_PREFIXES = ['/dashboard'];

// Rutas de autenticación (redirigen al dashboard si ya hay sesión)
const AUTH_PREFIXES = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Leer cookie accessToken desde la cabecera HTTP
  // (HttpOnly cookies son accesibles en el servidor vía request.cookies)
  const accessToken = request.cookies.get('accessToken');
  const isAuthenticated = !!accessToken;

  // ── Rutas protegidas ────────────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    // Guardar la URL original para redirigir tras login (opcional)
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Rutas de auth ───────────────────────────────────────────────────────────
  // Si el usuario ya tiene sesión y visita /auth/login o /auth/register,
  // redirigir directamente al dashboard para evitar doble sesión.
  const isAuthPage = AUTH_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Aplicar el middleware solo a:
   * - /dashboard y cualquier sub-ruta
   * - /auth/login y /auth/register
   *
   * Excluir explícitamente:
   * - Archivos estáticos (_next/static, _next/image, favicon, etc.)
   * - API Routes internas de Next.js (/api/*)
   */
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
