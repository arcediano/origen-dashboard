import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '@/middleware';

describe('src/middleware — x-pathname, CSP y protección de rutas (middleware único)', () => {
  it('propaga la ruta al layout raíz sin redirigir ni exigir sesión en /mantenimiento', async () => {
    const res = await middleware(new NextRequest('http://localhost/mantenimiento'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-request-x-pathname')).toBe('/mantenimiento');
  });

  it('añade la CSP con nonce y la propaga en la petición', async () => {
    const res = await middleware(new NextRequest('http://localhost/mantenimiento'));
    const csp = res.headers.get('Content-Security-Policy') ?? '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+'/);
    expect(csp).toContain('blob:');
    expect(res.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
  });

  it('connect-src incluye los dominios de telemetría de Stripe.js (sin ellos, el Payment Element se queda cargando para siempre)', async () => {
    const res = await middleware(new NextRequest('http://localhost/mantenimiento'));
    const csp = res.headers.get('Content-Security-Policy') ?? '';
    const connectSrc = csp.split(';').find((d) => d.trim().startsWith('connect-src')) ?? '';
    for (const domain of [
      'https://api.stripe.com',
      'https://js.stripe.com',
      'https://m.stripe.com',
      'https://m.stripe.network',
      'https://r.stripe.com',
    ]) {
      expect(connectSrc).toContain(domain);
    }
  });

  it('una ruta protegida sin cookie redirige a /auth/login', async () => {
    const res = await middleware(new NextRequest('http://localhost/dashboard/orders'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
  });

  it('el matcher excluye assets y ficheros con extensión', () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test('/mantenimiento')).toBe(true);
    expect(re.test('/dashboard/orders')).toBe(true);
    expect(re.test('/_next/static/x.js')).toBe(false);
    expect(re.test('/origen-icon.svg')).toBe(false);
  });

  it('el matcher excluye /api/ — el proxy al gateway no necesita JWT/CSP/x-pathname', () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test('/api/v1/auth/login')).toBe(false);
    expect(re.test('/api/upload')).toBe(false);
  });
});
