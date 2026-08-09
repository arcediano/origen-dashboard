/**
 * ReadinessContext - Estado de "readiness" del productor (pagos, bloqueos de
 * publicación, etc.), compartido entre la home del dashboard y el menú de
 * usuario de la cabecera.
 *
 * Antes cada consumidor llamaba a getMyReadiness() por su cuenta (dashboard
 * home y DashboardHeader), duplicando la petición en cada carga de página.
 * Este contexto la resuelve una única vez por sesión de dashboard.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getMyReadiness } from '@/lib/api/onboarding';
import type { ProducerReadinessReport } from '@/lib/api/onboarding';
import { useAuth } from '@/contexts/AuthContext';

interface ReadinessContextType {
  readiness: ProducerReadinessReport | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ReadinessContext = createContext<ReadinessContextType | undefined>(undefined);

export function ReadinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [readiness, setReadiness] = useState<ProducerReadinessReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReadiness = useCallback(async () => {
    if (user?.role !== 'PRODUCER') {
      setIsLoading(false);
      return;
    }
    try {
      const report = await getMyReadiness();
      setReadiness(report);
    } catch (error) {
      console.error('Error fetching readiness:', error);
      // Silencioso — los consumidores (alertas de pago, UserMenu) funcionan
      // sin datos de readiness, simplemente no muestran esos avisos.
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void fetchReadiness();
  }, [fetchReadiness]);

  return (
    <ReadinessContext.Provider value={{ readiness, isLoading, refetch: fetchReadiness }}>
      {children}
    </ReadinessContext.Provider>
  );
}

export function useReadiness(): ReadinessContextType {
  const ctx = useContext(ReadinessContext);
  if (!ctx) {
    throw new Error('useReadiness debe usarse dentro de un ReadinessProvider');
  }
  return ctx;
}
