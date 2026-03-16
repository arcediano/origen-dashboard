/**
 * Cliente HTTP centralizado para el API Gateway
 *
 * Todos los módulos de API (products, orders, reviews, etc.) deben usar
 * este cliente en lugar de llamar a fetch directamente.
 *
 * Características:
 * - URL base tomada de NEXT_PUBLIC_API_GATEWAY_URL
 * - Envía cookies HttpOnly automáticamente (accessToken / refreshToken)
 *   que el gateway establece en el login
 * - Soporta uso en cliente (browser) y servidor (Server Components / Route Handlers)
 * - Manejo de errores uniforme: lanza GatewayError con status y mensaje
 *
 * Uso básico:
 * ```ts
 * import { gatewayClient } from '@/lib/api/client';
 *
 * // GET público
 * const products = await gatewayClient.get('/products');
 *
 * // POST autenticado (cookie se envía automáticamente en el browser)
 * const created = await gatewayClient.post('/products', body);
 *
 * // Desde un Server Component o Route Handler, pasar las cookies del request:
 * const products = await gatewayClient.get('/products', { cookies: req.headers.get('cookie') });
 * ```
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000';
const API_VERSION = 'v1';

// Declaración global para debounce de sesión expirada
declare global {
  interface Window {
    lastSessionExpiredTime?: number;
  }
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface RequestOptions {
  /**
   * Headers extra a incluir en la petición.
   * 'Content-Type' y 'Accept' ya están establecidos por defecto.
   */
  headers?: Record<string, string>;

  /**
   * Cookies a reenviar manualmente.
   * Necesario en Server Components / Route Handlers donde las cookies
   * del browser no se envían automáticamente.
   *
   * @example
   * // En un Route Handler:
   * const cookieHeader = request.headers.get('cookie') ?? '';
   * await gatewayClient.get('/products', { cookies: cookieHeader });
   */
  cookies?: string;

  /**
   * Query params como objeto — se serializan automáticamente.
   * @example { page: 1, limit: 20, search: 'queso' }
   */
  params?: Record<string, string | number | boolean | undefined | null>;

  /**
   * Opciones nativas de fetch (cache, next, signal, etc.)
   * Útil para controlar el caché de Next.js en Server Components.
   * @example { next: { revalidate: 60 } }
   */
  fetchOptions?: RequestInit;
}

/**
 * Error lanzado por el cliente cuando el gateway responde con un status de error.
 * Incluye el status HTTP y el mensaje del servicio.
 */
export class GatewayError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// ─── CLIENTE ──────────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  // Construir URL con query params
  const url = new URL(`/api/${API_VERSION}${path}`, BASE_URL);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Construir headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Reenvío manual de cookies (Server Components / Route Handlers)
  if (options.cookies) {
    headers['Cookie'] = options.cookies;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Enviar cookies HttpOnly del browser automáticamente en el cliente
    credentials: 'include',
    ...options.fetchOptions,
  });

  // Intentar parsear la respuesta como JSON
  let data: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const raw = (data as { message?: string | string[] })?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : (raw ?? `Error ${response.status} en ${method} ${path}`);

    // Notificar al dashboard que la sesión ha expirado (solo en el browser)
    // Implementamos debounce para evitar múltiples eventos 401
    // No disparar en páginas /auth/* donde el 401 es esperado (usuario no autenticado aún)
    if (response.status === 401 && typeof window !== 'undefined') {
      const isAuthPage = window.location.pathname.startsWith('/auth/');
      if (!isAuthPage) {
        if (!window.lastSessionExpiredTime) {
          window.lastSessionExpiredTime = 0;
        }

        const now = Date.now();
        const SESSION_EXPIRED_DEBOUNCE = 1000; // 1 segundo

        if (now - (window.lastSessionExpiredTime as number) > SESSION_EXPIRED_DEBOUNCE) {
          window.lastSessionExpiredTime = now;
          window.dispatchEvent(new CustomEvent('session:expired'));
        }
      }
    }

    throw new GatewayError(response.status, message, data);
  }

  return data as T;
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

export const gatewayClient = {
  /**
   * GET /api{path}
   * @example gatewayClient.get<Product[]>('/products', { params: { page: 1 } })
   */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  /**
   * POST /api{path}
   * @example gatewayClient.post('/auth/login', { email, password })
   */
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  /**
   * PUT /api{path}
   * @example gatewayClient.put(`/products/${id}`, updatedData)
   */
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },

  /**
   * PATCH /api{path}
   * @example gatewayClient.patch(`/products/${id}/stock`, { stock: 10 })
   */
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  /**
   * DELETE /api{path}
   * @example gatewayClient.delete(`/products/${id}`)
   */
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
};
