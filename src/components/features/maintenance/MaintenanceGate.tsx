/**
 * MaintenanceGate — red de seguridad en cliente
 *
 * Si cualquier petición del cliente recibe el 503 MAINTENANCE del gateway
 * (login y refresh incluidos), sustituye la app por la pantalla de mantenimiento
 * sin cerrar la sesión ni redirigir. Sin polling ni reintentos: el botón
 * "Reintentar" recarga la página, y el layout vuelve a consultar /site-status.
 */

'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  getMaintenanceState,
  getServerMaintenanceState,
  installMaintenanceFetchGuard,
  subscribeMaintenance,
} from '@/lib/maintenance';
import { MaintenanceScreen } from './MaintenanceScreen';

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { active, message } = useSyncExternalStore(
    subscribeMaintenance,
    getMaintenanceState,
    getServerMaintenanceState,
  );

  useEffect(() => {
    installMaintenanceFetchGuard();
  }, []);

  if (active) return <MaintenanceScreen message={message} />;
  return <>{children}</>;
}
