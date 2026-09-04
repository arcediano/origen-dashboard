/**
 * @page ConfiguracionPage
 * @description Hub de configuraciones — punto de entrada con subsecciones,
 * mismo patrón que /dashboard/account (Mi cuenta). Antes esta ruta mostraba
 * directamente las preferencias de notificaciones; ese contenido se movió a
 * /dashboard/configuracion/notificaciones para dejar sitio a "Métodos de
 * envío" (ya existía como página propia en /configuracion/envios, sin
 * enlazar desde ningún punto de la navegación).
 */

'use client';

import Link from 'next/link';
import { Bell, ChevronRight, Settings2, Truck } from 'lucide-react';
import { appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD, Card, CardIconHeader } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';

export default function ConfiguracionPage() {
  const configuracionSections = [
    {
      title: 'Notificaciones',
      description: 'Elige por qué canal (email o push) quieres recibir cada tipo de aviso.',
      href: '/dashboard/configuracion/notificaciones',
      icon: Bell,
      meta: 'Comunicación',
    },
    {
      title: 'Métodos de envío',
      description: 'Modifica los métodos de envío, zonas y logística que configuraste en el onboarding.',
      href: '/dashboard/configuracion/envios',
      icon: Truck,
      meta: 'Logística',
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Configuraciones"
        description="Gestiona en un único lugar tus preferencias de comunicación y envío"
        badgeIcon={Settings2}
        badgeText="Configuraciones"
        tooltip="Configuraciones"
        tooltipDetailed="Este espacio concentra las preferencias que puedes ajustar en cualquier momento, sin tocar tu cuenta ni tu perfil comercial."
      />

      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8 space-y-6`}>
        <Card variant="section" padding="md">
          <CardIconHeader
            icon={<Settings2 className="h-5 w-5 text-hoja-tinta" />}
            title="Preferencias configurables"
            description="Notificaciones y envíos se gestionan aquí. Seguridad, cobros y perfil comercial se gestionan desde Mi cuenta."
          />
        </Card>

        <Card className="rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          {configuracionSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className={`flex items-center gap-4 p-4 hover:bg-surface-alt transition-colors ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-origen-pradera/10 flex-shrink-0">
                  <Icon className="h-5 w-5 text-hoja-tinta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-origen-bosque">{section.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{section.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-subtle flex-shrink-0" />
              </Link>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
