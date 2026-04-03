/**
 * @file use-producer-profile.ts
 * @description Hook para obtener el perfil del productor autenticado desde la API real.
 * Llama a GET /api/v1/producers/me a través de fetchMyProfile.
 */

import { useState, useEffect } from 'react';
import type { ProducerProfile } from '../types';
import { fetchMyProfile } from '@/lib/api/producers';

interface UseProducerProfileResult {
  producer: ProducerProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducerProfile(): UseProducerProfileResult {
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchMyProfile();

      if (res.error || !res.data) {
        setError(res.error ?? 'Error al cargar el perfil');
      } else {
        setProducer(res.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar el perfil',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    producer,
    isLoading,
    error,
    refetch: loadProfile,
  };
}
