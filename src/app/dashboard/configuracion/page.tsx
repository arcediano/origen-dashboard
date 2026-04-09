/**
 * @page ConfiguracionPage
 * @description Configuraciones de notificaciones (solo preferencias)
 */

'use client';

import { useState } from 'react';
import { Bell, Megaphone, Package, Save, ShoppingBag, Star, Smartphone, Mail } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, Button } from '@arcediano/ux-library';
import { NotificationToggleRow } from '@/app/dashboard/notifications/components/NotificationToggleRow';
import { gatewayClient } from '@/lib/api/client';

export default function ConfiguracionPage() {
  const [emailSettings, setEmailSettings] = useState({
    orders: true,
    reviews: true,
    marketing: false,
    stock: true,
  });

  const [pushSettings, setPushSettings] = useState({
    orders: true,
    lowStock: true,
    reviews: true,
    campaigns: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    let saveOk = false;
    try {
      await gatewayClient.put('/notifications/preferences', {
        preferences: [
          {
            eventType: 'NEW_ORDER',
            email: emailSettings.orders,
            inApp: true,
            push: pushSettings.orders,
            frequency: 'INSTANT',
          },
          {
            eventType: 'NEW_REVIEW',
            email: emailSettings.reviews,
            inApp: true,
            push: pushSettings.reviews,
            frequency: 'INSTANT',
          },
          {
            eventType: 'REVIEW_REPLY',
            email: emailSettings.reviews,
            inApp: true,
            push: pushSettings.reviews,
            frequency: 'INSTANT',
          },
          {
            eventType: 'PRODUCT_LOW_STOCK',
            email: emailSettings.stock,
            inApp: true,
            push: pushSettings.lowStock,
            frequency: 'INSTANT',
          },
          {
            eventType: 'PROMOTION_CREATED',
            email: emailSettings.marketing,
            inApp: true,
            push: pushSettings.campaigns,
            frequency: 'INSTANT',
          },
        ],
      });
      saveOk = true;
    } catch (error) {
      console.error('[configuracion] Error guardando preferencias:', error);
    }

    if (saveOk) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
        <PageHeader
          title="Configuraciones"
          description="Define como quieres recibir tus notificaciones"
          badgeIcon={Bell}
          badgeText="Preferencias"
          tooltip="Configuraciones"
          tooltipDetailed="Activa o desactiva notificaciones por canal: email o push."
        />

        <div className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
          <div className="grid gap-3 lg:hidden">
            <div className="rounded-2xl border border-origen-pradera/20 bg-surface-alt p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-origen-bosque" />
                <p className="text-sm font-semibold text-origen-bosque">Email</p>
              </div>
              <p className="text-xs text-text-subtle">Recibiras avisos en tu bandeja de correo.</p>
            </div>
            <div className="rounded-2xl border border-origen-pradera/20 bg-surface-alt p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-origen-bosque" />
                <p className="text-sm font-semibold text-origen-bosque">Push</p>
              </div>
              <p className="text-xs text-text-subtle">Recibiras avisos directos en el dispositivo.</p>
            </div>
          </div>

          <Card variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="px-4 pb-2 pt-4 sm:px-6">
                  <h3 className="text-sm font-semibold text-origen-bosque">Email</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Avisos que recibes por correo.</p>
                </div>
                <div className="px-4 pb-2 pt-4 sm:px-6 lg:border-l lg:border-border-subtle">
                  <h3 className="text-sm font-semibold text-origen-bosque">Push</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Avisos directos en la app/dispositivo.</p>
                </div>

                <div className="px-4 sm:px-6 divide-y divide-border-subtle">
                  <NotificationToggleRow
                    icon={ShoppingBag}
                    title="Nuevos pedidos"
                    description="Email cuando llegue un nuevo pedido"
                    checked={emailSettings.orders}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, orders: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Star}
                    title="Nuevas resenas"
                    description="Email cuando recibas una resena"
                    checked={emailSettings.reviews}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, reviews: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Package}
                    title="Stock bajo"
                    description="Email cuando un producto este por agotarse"
                    checked={emailSettings.stock}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, stock: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Megaphone}
                    title="Marketing y promociones"
                    description="Email con novedades y campanas"
                    checked={emailSettings.marketing}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, marketing: v }))}
                    divider={false}
                  />
                </div>

                <div className="px-4 sm:px-6 divide-y divide-border-subtle lg:border-l lg:border-border-subtle">
                  <NotificationToggleRow
                    icon={ShoppingBag}
                    title="Nuevos pedidos"
                    description="Push para nuevos pedidos"
                    checked={pushSettings.orders}
                    onChange={(v) => setPushSettings((s) => ({ ...s, orders: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Package}
                    title="Stock bajo"
                    description="Push para alertas de inventario"
                    checked={pushSettings.lowStock}
                    onChange={(v) => setPushSettings((s) => ({ ...s, lowStock: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Star}
                    title="Nuevas resenas"
                    description="Push cuando recibas una resena"
                    checked={pushSettings.reviews}
                    onChange={(v) => setPushSettings((s) => ({ ...s, reviews: v }))}
                    divider={false}
                  />
                  <NotificationToggleRow
                    icon={Megaphone}
                    title="Campanas"
                    description="Push de resultados y actualizaciones"
                    checked={pushSettings.campaigns}
                    onChange={(v) => setPushSettings((s) => ({ ...s, campaigns: v }))}
                    divider={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="hidden lg:flex lg:justify-end">
            <Button onClick={handleSave}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>{saved ? 'Preferencias guardadas' : 'Guardar preferencias'}</span>
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`
          fixed bottom-[calc(88px+env(safe-area-inset-bottom))]
          left-4 right-4
          lg:hidden z-30
        `}
      >
        <button
          onClick={handleSave}
          className={
            saved
              ? 'w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold shadow-lg transition-colors bg-origen-pradera text-white'
              : 'w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold shadow-lg transition-colors bg-origen-bosque text-white active:bg-origen-pino'
          }
        >
          <Save className="w-4 h-4" />
          {saved ? 'Guardado' : 'Guardar preferencias'}
        </button>
      </div>
    </>
  );
}
