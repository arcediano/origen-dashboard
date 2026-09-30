/**
 * /mantenimiento — pantalla de modo mantenimiento
 *
 * El layout raíz ya redirige al inicio si el modo NO está activo (nadie queda
 * atrapado aquí). Aquí solo se pinta la pantalla con el mensaje del administrador.
 * Sin navegación del panel y con noindex.
 */

import type { Metadata } from 'next';
import { MaintenanceScreen } from '@/components/features/maintenance/MaintenanceScreen';
import { fetchSiteStatus } from '@/lib/maintenance-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mantenimiento - Origen',
  robots: { index: false, follow: false },
};

export default async function MantenimientoPage() {
  const status = await fetchSiteStatus();
  return <MaintenanceScreen message={status?.maintenanceMessage} />;
}
