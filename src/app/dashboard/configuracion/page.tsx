/**
 * @page ConfiguracionPage
 * @description Página de configuración del dashboard
 * 
 * @data-services
 * - GET /api/producer/settings - Obtener configuración
 * - PUT /api/producer/settings - Actualizar configuración
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/atoms/card';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { 
  User, 
  Truck, 
  CreditCard, 
  Bell, 
  Shield, 
  Globe,
  Settings,
  ChevronRight 
} from 'lucide-react';

export default function ConfiguracionPage() {
  const sections = [
    { 
      icon: User, 
      title: 'Perfil público', 
      description: 'Información de tu negocio', 
      href: '/dashboard/configuracion/profile' 
    },
    { 
      icon: Truck, 
      title: 'Envíos', 
      description: 'Métodos y zonas de entrega', 
      href: '/dashboard/configuracion/envios' 
    },
    { 
      icon: CreditCard, 
      title: 'Pagos', 
      description: 'Stripe y facturación', 
      href: '/dashboard/configuracion/pagos' 
    },
    { 
      icon: Bell, 
      title: 'Notificaciones', 
      description: 'Alertas y comunicaciones', 
      href: '/dashboard/configuracion/notificaciones' 
    },
    { 
      icon: Shield, 
      title: 'Privacidad', 
      description: 'Datos y seguridad', 
      href: '/dashboard/configuracion/privacidad' 
    },
    { 
      icon: Globe, 
      title: 'Idioma y región', 
      description: 'Preferencias regionales', 
      href: '/dashboard/configuracion/idioma' 
    }
  ];

  return (
    <div className="w-full">

      {/* Cabecera */}
      <PageHeader
        title="Configuración"
        description="Administra tu cuenta y preferencias"
        badgeIcon={Settings}
        badgeText="Ajustes"
        tooltip="Configuración"
        tooltipDetailed="Gestiona todos los aspectos de tu cuenta desde esta sección."
      />

      {/* Contenido */}
      <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">

        {/* Móvil: lista nativa de navegación */}
        <div className="lg:hidden rounded-2xl border border-border-subtle overflow-hidden bg-surface divide-y divide-border-subtle">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link
                key={index}
                href={section.href}
                className="flex items-center gap-3 px-4 py-4 active:bg-surface-alt transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-origen-pradera" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-origen-bosque leading-tight">{section.title}</p>
                  <p className="text-xs text-text-subtle mt-0.5">{section.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Desktop: grid de cards */}
        <div className="hidden lg:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link key={index} href={section.href}>
                <Card className="p-6 bg-surface-alt border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-origen-pradera" />
                      </div>
                      <div>
                        <h3 className="font-medium text-origen-bosque group-hover:text-origen-pradera transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-subtle group-hover:text-origen-pradera transition-colors" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}