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
import { 
  User, 
  Truck, 
  CreditCard, 
  Bell, 
  Shield, 
  Globe,
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
      {/* Cabecera de página */}
      <div className="px-6 lg:px-8 py-6 border-b border-border/50 bg-surface-alt/30">
        <div>
          <h1 className="text-2xl font-semibold text-origen-bosque">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">Administra tu cuenta y preferencias</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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