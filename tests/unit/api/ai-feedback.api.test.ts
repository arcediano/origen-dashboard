import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { TEST_API_BASE } from '../../mocks/api-base';
import { getAiFeedback } from '@/lib/api/products';

describe('getAiFeedback', () => {
  it('devuelve los problemas detectados por la IA', async () => {
    server.use(
      http.get(`${TEST_API_BASE}/products/p1/ai-feedback`, () =>
        HttpResponse.json({
          kind: 'NEEDS_CORRECTION',
          problems: [{ field: 'fullDescription', message: 'Quita el enlace' }],
          attempt: 2,
          createdAt: '2026-11-17T10:00:00Z',
        }),
      ),
    );
    const res = await getAiFeedback('p1');
    expect(res.data?.kind).toBe('NEEDS_CORRECTION');
    expect(res.data?.problems[0].message).toBe('Quita el enlace');
    expect(res.data?.attempt).toBe(2);
  });

  it('devuelve null si no hay nada pendiente de corregir', async () => {
    server.use(http.get(`${TEST_API_BASE}/products/p2/ai-feedback`, () => HttpResponse.json(null)));
    const res = await getAiFeedback('p2');
    expect(res.data).toBeNull();
    expect(res.error).toBeUndefined();
  });

  it('un error del servidor se devuelve como error, sin lanzar', async () => {
    server.use(
      http.get(`${TEST_API_BASE}/products/p3/ai-feedback`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const res = await getAiFeedback('p3');
    expect(res.error).toBeTruthy();
  });
});
