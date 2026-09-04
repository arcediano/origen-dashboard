/**
 * @page ConfiguracionNotificacionesPage
 * @description Configuraciones de notificaciones — canales y preferencias por evento.
 * Movida desde /dashboard/configuracion (ahora hub de subsecciones, ver
 * /dashboard/configuracion/page.tsx) para dejar sitio a otras subsecciones
 * de configuración como "Métodos de envío".
 */

'use client';

import { Bell } from 'lucide-react';
import { appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { NotificationsPreferencesPanel } from '@/app/dashboard/notifications/components/NotificationsPreferencesPanel';

export default function ConfiguracionNotificacionesPage() {

  return (
    <div className="w-full">
      <PageHeader
        title="Notificaciones"
        description="Define cómo quieres recibir tus avisos por canal"
        badgeIcon={Bell}
        badgeText="Comunicación"
        tooltip="Notificaciones"
        tooltipDetailed="Configura por cada tipo de aviso si quieres recibirlo por email o por push."
      />

      <div className={`container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-10`}>
        <NotificationsPreferencesPanel />
      </div>
    </div>
  );
}
