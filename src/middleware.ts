/**
 * Middleware mínimo — expone la ruta actual al layout raíz (header x-pathname)
 * para que el redirect del modo mantenimiento no entre en bucle en /mantenimiento.
 * No consulta la red ni toca cookies/CSP.
 *
 * AVISO: el `middleware.ts` de la raíz del repo (JWT + CSP) NO se ejecuta, porque
 * con carpeta `src/` Next.js solo carga `src/middleware.ts`. Activar esa lógica es
 * una decisión aparte (impacta auth y CSP); si se hace, fusionarla con este archivo.
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Solo páginas: sin API, assets estáticos, imágenes optimizadas ni ficheros con extensión.
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
