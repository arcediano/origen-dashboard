/**
 * MaintenanceGate — red de seguridad en cliente
 *
 * Instala el guard global de window.fetch: si cualquier petición del cliente
 * (login y refresh incluidos, subidas, fetch crudos) recibe el 503 MAINTENANCE
 * del gateway, navega a /mantenimiento sin cerrar la sesión ni refrescar token.
 * Sin polling ni reintentos.
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { installMaintenanceFetchGuard } from '@/lib/maintenance';

export function MaintenanceGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    installMaintenanceFetchGuard();
  }, []);

  return <>{children}</>;
}
