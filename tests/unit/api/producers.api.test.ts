/**
 * @file producers.api.test.ts
 * @description Tests de integración para src/lib/api/producers.ts.
 * Usa MSW para interceptar las llamadas a fetchMyProfile.
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { fetchMyProfile } from '@/lib/api/producers';
import {
  mockProducerProfile,
  producerErrorHandler,
  producerUnauthorizedHandler,
} from '../../mocks/handlers/producers.handlers';
import { TEST_API_BASE } from '../../mocks/api-base';

const BASE = TEST_API_BASE;

describe('fetchMyProfile', () => {
  it('devuelve status 200 y los datos del perfil', async () => {
    const result = await fetchMyProfile();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('mapea id y name correctamente', async () => {
    const result = await fetchMyProfile();
    expect(result.data!.id).toBe(mockProducerProfile.id);
    expect(result.data!.name).toBe(mockProducerProfile.name);
  });

  it('mapea location correctamente', async () => {
    const result = await fetchMyProfile();
    expect(result.data!.location).toBe(mockProducerProfile.location);
  });

  it('profileCompletenessScore es un número', async () => {
    const result = await fetchMyProfile();
    expect(typeof result.data!.profileCompletenessScore).toBe('number');
  });

  it('accountStatus es un valor válido', async () => {
    const result = await fetchMyProfile();
    const validStatuses = ['active', 'pending', 'suspended'];
    expect(validStatuses).toContain(result.data!.accountStatus);
  });

  it('devuelve error cuando la API responde 500', async () => {
    server.use(producerErrorHandler);
    const result = await fetchMyProfile();
    expect(result.error).toBeDefined();
    expect(result.status).toBeGreaterThanOrEqual(500);
    expect(result.data).toBeUndefined();
  });

  it('devuelve status 401 cuando no está autenticado', async () => {
    server.use(producerUnauthorizedHandler);
    const result = await fetchMyProfile();
    expect(result.status).toBe(401);
    expect(result.error).toBeDefined();
  });

  it('devuelve error descriptivo cuando la API responde con mensaje', async () => {
    server.use(
      http.get(`${BASE}/producers/me`, () =>
        HttpResponse.json(
          { message: 'Productor no encontrado' },
          { status: 404 },
        ),
      ),
    );
    const result = await fetchMyProfile();
    expect(result.status).toBe(404);
    expect(result.error).toContain('Productor no encontrado');
  });

  it('avatarUrl puede ser vacío o string', async () => {
    const result = await fetchMyProfile();
    expect(
      result.data!.avatarUrl === undefined ||
        typeof result.data!.avatarUrl === 'string',
    ).toBe(true);
  });
});
