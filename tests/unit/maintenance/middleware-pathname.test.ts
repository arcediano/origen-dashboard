import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '@/middleware';

describe('src/middleware — x-pathname', () => {
  it('propaga la ruta al layout raíz sin redirigir', () => {
    const res = middleware(new NextRequest('http://localhost/mantenimiento'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-request-x-pathname')).toBe('/mantenimiento');
  });

  it('el matcher excluye API, assets y ficheros con extensión', () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test('/mantenimiento')).toBe(true);
    expect(re.test('/dashboard/orders')).toBe(true);
    expect(re.test('/api/v1/site-status')).toBe(false);
    expect(re.test('/_next/static/x.js')).toBe(false);
    expect(re.test('/origen-icon.svg')).toBe(false);
  });
});
