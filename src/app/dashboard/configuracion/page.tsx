/**
 * @page ConfiguracionPage
 * @description Configuraciones de notificaciones — canales y preferencias por evento.
 */

'use client';

import { Bell } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { NotificationsPreferencesPanel } from '@/app/dashboard/notifications/components/NotificationsPreferencesPanel';

export default function ConfiguracionPage() {

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Configuraciones"
        description="Define como quieres recibir tus avisos por canal"
        badgeIcon={Bell}
        badgeText="Comunicacion"
        tooltip="Configuraciones"
        tooltipDetailed="Configura por cada tipo de aviso si quieres recibirlo por email o por push."
      />

      <div className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-10">
        <NotificationsPreferencesPanel />
      </div>
    </div>
  );
}
