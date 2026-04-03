/**
 * @file useProducerProfile.test.ts
 * @description Tests de integración para el hook useProducerProfile.
 * Usa MSW para interceptar las llamadas reales a fetchMyProfile.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import {
  mockProducerProfile,
  producerErrorHandler,
  producerCompleteHandler,
  producerIncompleteHandler,
} from '../../mocks/handlers/producers.handlers';
import { useProducerProfile } from '@/components/features/dashboard/hooks/use-producer-profile';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

describe('useProducerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('comienza en estado de carga con producer null', () => {
    const { result } = renderHook(() => useProducerProfile());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.producer).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('carga el perfil del productor desde la API real', async () => {
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.producer).not.toBeNull();
  });

  it('mapea todos los campos del perfil correctamente', async () => {
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const p = result.current.producer!;
    expect(p.id).toBe(mockProducerProfile.id);
    expect(p.name).toBe(mockProducerProfile.name);
    expect(p.location).toBe(mockProducerProfile.location);
    expect(p.profileCompletenessScore).toBe(mockProducerProfile.profileCompletenessScore);
    expect(p.accountStatus).toBe(mockProducerProfile.accountStatus);
  });

  it('profileCompletenessScore es un número 0-100', async () => {
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const score = result.current.producer!.profileCompletenessScore;
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('accountStatus es uno de los valores válidos', async () => {
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const validStatuses = ['active', 'pending', 'suspended'];
    expect(validStatuses).toContain(result.current.producer!.accountStatus);
  });

  it('establece error cuando la API responde 500', async () => {
    server.use(producerErrorHandler);
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.producer).toBeNull();
  });

  it('refetch vuelve a cargar el perfil correctamente', async () => {
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.producer).not.toBeNull();

    await result.current.refetch();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.producer).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('se recupera tras un error al hacer refetch con la API disponible', async () => {
    server.use(producerErrorHandler);
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();

    // La API vuelve a funcionar
    server.resetHandlers();

    await result.current.refetch();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.producer).not.toBeNull();
  });

  it('carga perfil al 100% con el handler completo', async () => {
    server.use(producerCompleteHandler);
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.producer!.profileCompletenessScore).toBe(100);
  });

  it('carga perfil incompleto con status pending', async () => {
    server.use(producerIncompleteHandler);
    const { result } = renderHook(() => useProducerProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.producer!.profileCompletenessScore).toBe(45);
    expect(result.current.producer!.accountStatus).toBe('pending');
  });

  it('expone la función refetch', () => {
    const { result } = renderHook(() => useProducerProfile());
    expect(typeof result.current.refetch).toBe('function');
  });
});
