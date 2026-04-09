'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, ChevronRight, CreditCard, HelpCircle, KeyRound, MonitorCog, Settings2, Store } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Label, Toggle } from '@arcediano/ux-library';

export default function AccountPage() {
  const [preferences, setPreferences] = useState({
    compactMode: false,
    reduceMotion: false,
    emailDigest: true,
  });

  const accountSections = [
    {
      title: 'Notificaciones',
      description: 'Consulta la bandeja y ajusta cómo quieres recibir avisos.',
      href: '/dashboard/notifications',
      icon: Bell,
      meta: 'Actividad',
    },
    {
      title: 'Seguridad',
      description: 'Cambia tu contraseña y activa verificación en dos pasos.',
      href: '/dashboard/security',
      icon: KeyRound,
      meta: 'Protección',
    },
    {
      title: 'Cobros',
      description: 'Revisa Stripe, verificación y estado de tus cobros.',
      href: '/dashboard/configuracion/pagos',
      icon: CreditCard,
      meta: 'Pagos',
    },
    {
      title: 'Negocio',
      description: 'Actualiza la identidad comercial de tu tienda y tus documentos.',
      href: '/dashboard/profile',
      icon: Store,
      meta: 'Perfil',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Cuenta"
        description="Gestiona en un único lugar tu seguridad, notificaciones, cobros y preferencias"
        badgeIcon={Settings2}
        badgeText="Cuenta"
        tooltip="Cuenta"
        tooltipDetailed="Este espacio concentra las tareas personales y de configuración para evitar duplicidades entre perfil, ajustes y seguridad."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-6">
        <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <MonitorCog className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Una sola entrada para toda tu cuenta</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Aquí se concentran las tareas personales y de configuración. El negocio y la operación se gestionan fuera de este bloque.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {accountSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} className="h-full rounded-2xl border border-border-subtle shadow-sm transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-5 w-5 text-origen-pradera" />
                        <span>{section.title}</span>
                      </CardTitle>
                      <Badge variant="neutral" size="xs">{section.meta}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex h-full flex-col pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {section.description}
                    </p>
                    <div className="flex-1" />
                    <div className="mt-4 flex justify-end">
                      <Link href={section.href}>
                        <Button variant="outline" size="sm">
                          <span className="inline-flex items-center gap-1">
                            Ver detalles
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorCog className="h-5 w-5 text-origen-pradera" />
                  Preferencias de interfaz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-surface-alt p-4">
                  <div>
                    <Label className="text-sm font-medium text-origen-bosque">Modo compacto</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Reduce densidad visual en tablas y listas.</p>
                  </div>
                  <Toggle checked={preferences.compactMode} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, compactMode: checked }))} variant="leaf" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-alt p-4">
                  <div>
                    <Label className="text-sm font-medium text-origen-bosque">Reducir movimiento</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Disminuye animaciones para una experiencia más estable.</p>
                  </div>
                  <Toggle checked={preferences.reduceMotion} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, reduceMotion: checked }))} variant="leaf" size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-alt p-4">
                  <div>
                    <Label className="text-sm font-medium text-origen-bosque">Resumen diario por email</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Recibe un digest con pedidos, incidencias y cobros.</p>
                  </div>
                  <Toggle checked={preferences.emailDigest} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, emailDigest: checked }))} variant="leaf" size="sm" />
                </div>
                <Button className="w-full">
                  <span className="inline-flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span>Guardar preferencias</span>
                  </span>
                </Button>
              </CardContent>
            </Card>

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
                    <p className="mt-1 text-xs text-muted-foreground">Resuelve dudas sobre pedidos, cobros y configuración.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-subtle" />
                </Link>
                <Link href="/dashboard/security" className="flex items-center justify-between rounded-xl border border-border-subtle p-4 transition-colors hover:bg-surface-alt">
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">Revisar seguridad</p>
                    <p className="mt-1 text-xs text-muted-foreground">Contraseña, 2FA y protección de acceso.</p>
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