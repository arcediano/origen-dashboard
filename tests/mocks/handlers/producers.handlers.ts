/**
 * @file producers.handlers.ts
 * @description MSW handlers para el endpoint GET /producers/me.
 * Usados en tests de integración de la API y los hooks.
 */

import { http, HttpResponse } from 'msw';
import type { ProducerProfile } from '@/components/features/dashboard/types';
import { TEST_API_BASE } from '../api-base';

const BASE = TEST_API_BASE;

// ─── Fixture ─────────────────────────────────────────────────────────────────

export const mockProducerProfile: ProducerProfile = {
  id: 'producer-001',
  code: 'ORG-PRD-001',
  name: 'Quesería Artesana Valle del Tajo',
  avatarUrl: '',
  coverImageUrl: '',
  location: 'Talavera de la Reina, Toledo',
  shortBio: 'El auténtico sabor de la tradición manchega desde 1985',
  categories: ['lácteos', 'quesos'],
  profileCompletenessScore: 72,
  accountStatus: 'active',
};

// ─── Handlers normales ────────────────────────────────────────────────────────

export const producersHandlers = [
  http.get(`${BASE}/producers/me`, () =>
    HttpResponse.json(mockProducerProfile),
  ),
];

// ─── Override handlers para escenarios específicos ───────────────────────────

export const producerErrorHandler = http.get(`${BASE}/producers/me`, () =>
  HttpResponse.json(
    { message: 'Internal server error' },
    { status: 500 },
  ),
);

export const producerUnauthorizedHandler = http.get(
  `${BASE}/producers/me`,
  () =>
    HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
);

export const producerCompleteHandler = http.get(`${BASE}/producers/me`, () =>
  HttpResponse.json({
    ...mockProducerProfile,
    profileCompletenessScore: 100,
    accountStatus: 'active',
  } satisfies ProducerProfile),
);

export const producerIncompleteHandler = http.get(`${BASE}/producers/me`, () =>
  HttpResponse.json({
    ...mockProducerProfile,
    profileCompletenessScore: 45,
    accountStatus: 'pending',
  } satisfies ProducerProfile),
);
