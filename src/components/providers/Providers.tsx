'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { MaintenanceGate } from '@/components/features/maintenance/MaintenanceGate';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <MaintenanceGate>{children}</MaintenanceGate>
    </AuthProvider>
  );
}
