'use client';

import Link from 'next/link';
import { ChevronRight, CreditCard, HelpCircle, KeyRound, MonitorCog, Settings2, Store } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';

export default function AccountPage() {
  const accountSections = [
    {
      title: 'Seguridad',
      description: 'Cambia tu contrasena y activa verificacion en dos pasos.',
      href: '/dashboard/security',
      icon: KeyRound,
      meta: 'Proteccion',
    },
    {
      title: 'Cobros',
      description: 'Revisa Stripe, verificacion y estado de tus cobros.',
      href: '/dashboard/configuracion/pagos',
      icon: CreditCard,
      meta: 'Pagos',
    },
    {
      title: 'Perfil comercial',
      description: 'Actualiza la identidad comercial de tu tienda y tus documentos.',
      href: '/dashboard/profile',
      icon: Store,
      meta: 'Perfil comercial',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Cuenta"
        description="Gestiona en un unico lugar tu seguridad, cobros y preferencias"
        badgeIcon={Settings2}
        badgeText="Cuenta"
        tooltip="Cuenta"
        tooltipDetailed="Este espacio concentra tareas personales y de configuracion, sin duplicar notificaciones."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-6">
        <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <MonitorCog className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Una sola entrada para toda tu cuenta</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Aqui se concentran tareas personales y configuracion. Notificaciones se gestionan desde la campana.</p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          {accountSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className={`flex items-center gap-4 p-4 hover:bg-surface-alt transition-colors ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-origen-pradera/10 flex-shrink-0">
                  <Icon className="h-5 w-5 text-origen-pradera" />
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

        <div>
          <Card className="rounded-2xl border border-border-subtle shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-origen-pradera" />
                Soporte y ayuda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/ayuda" className="flex items-center justify-between rounded-xl border border-border-subtle p-4 transition-colors hover:bg-surface-alt">
                <div>
                  <p className="text-sm font-medium text-origen-bosque">Centro de ayuda</p>
                  <p className="mt-1 text-xs text-muted-foreground">Resuelve dudas sobre pedidos, cobros y configuracion.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-subtle" />
              </Link>
              <Link href="/dashboard/security" className="flex items-center justify-between rounded-xl border border-border-subtle p-4 transition-colors hover:bg-surface-alt">
                <div>
                  <p className="text-sm font-medium text-origen-bosque">Revisar seguridad</p>
                  <p className="mt-1 text-xs text-muted-foreground">Contrasena, 2FA y proteccion de acceso.</p>
                </div>
                <KeyRound className="h-4 w-4 text-text-subtle" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
