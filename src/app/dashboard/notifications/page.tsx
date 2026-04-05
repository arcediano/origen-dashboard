/**
 * @page NotificationsPage
 * @description Preferencias de notificaciones — HV06 mobile-first
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  ShoppingBag,
  Star,
  Package,
  Megaphone,
  Save,
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent } from '@arcediano/ux-library';
import { Button } from '@arcediano/ux-library';
import { NotificationToggleRow } from './components/NotificationToggleRow';
import { SegmentedControl, type SegmentItem } from './components/SegmentedControl';
import { gatewayClient } from '@/lib/api/client';

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────

const SEGMENTS: SegmentItem[] = [
  { value: 'email', label: 'Email',       icon: Mail       },
  { value: 'push',  label: 'Push',        icon: Smartphone },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'push'>('email');

  const [emailSettings, setEmailSettings] = useState({
    orders:    true,
    reviews:   true,
    marketing: false,
    stock:     true,
  });

  const [pushSettings, setPushSettings] = useState({
    orders:    true,
    lowStock:  true,
    reviews:   true,
    campaigns: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await gatewayClient.put('/notifications/preferences', {
        preferences: [
          { eventType: 'NEW_ORDER',   channel: 'EMAIL', enabled: emailSettings.orders },
          { eventType: 'NEW_REVIEW',  channel: 'EMAIL', enabled: emailSettings.reviews },
          { eventType: 'MARKETING',   channel: 'EMAIL', enabled: emailSettings.marketing },
          { eventType: 'LOW_STOCK',   channel: 'EMAIL', enabled: emailSettings.stock },
          { eventType: 'NEW_ORDER',   channel: 'PUSH',  enabled: pushSettings.orders },
          { eventType: 'LOW_STOCK',   channel: 'PUSH',  enabled: pushSettings.lowStock },
          { eventType: 'NEW_REVIEW',  channel: 'PUSH',  enabled: pushSettings.reviews },
          { eventType: 'CAMPAIGN',    channel: 'PUSH',  enabled: pushSettings.campaigns },
        ],
      });
    } catch (err) {
      console.error('[notifications] Error guardando preferencias:', err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8"
      >
        <PageHeader
          title="Notificaciones"
          description="Configura cómo y cuándo quieres recibir notificaciones"
          badgeIcon={Bell}
          badgeText="Preferencias"
          tooltip="Notificaciones"
          tooltipDetailed="Elige qué notificaciones recibir por email y push."
          actions={
            /* Botón guardar — solo visible en desktop (lg+) */
            <div className="hidden lg:block">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar preferencias
              </Button>
            </div>
          }
        />

        {/* Control segmentado (reemplaza TabsList) */}
        <SegmentedControl
          items={SEGMENTS}
          active={activeTab}
          onChange={(v) => setActiveTab(v as 'email' | 'push')}
          className="max-w-md"
        />

        {/* Contenido del tab activo */}
        <Card variant="elevated">
          <CardContent className="p-0">
            {activeTab === 'email' && (
              <div className="px-4 sm:px-6 divide-y divide-border-subtle">
                <NotificationToggleRow
                  icon={ShoppingBag}
                  title="Nuevos pedidos"
                  description="Recibe un email cuando llegue un nuevo pedido"
                  checked={emailSettings.orders}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, orders: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Star}
                  title="Nuevas reseñas"
                  description="Cuando un cliente deje una reseña"
                  checked={emailSettings.reviews}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, reviews: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Package}
                  title="Stock bajo"
                  description="Alertas cuando un producto esté por agotarse"
                  checked={emailSettings.stock}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, stock: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Megaphone}
                  title="Marketing y promociones"
                  description="Ofertas, novedades y recomendaciones"
                  checked={emailSettings.marketing}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, marketing: v }))}
                  divider={false}
                />
              </div>
            )}

            {activeTab === 'push' && (
              <div className="px-4 sm:px-6 divide-y divide-border-subtle">
                <NotificationToggleRow
                  icon={ShoppingBag}
                  title="Nuevos pedidos"
                  description="Notificación push para nuevos pedidos"
                  checked={pushSettings.orders}
                  onChange={(v) => setPushSettings((s) => ({ ...s, orders: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Package}
                  title="Stock bajo"
                  description="Alertas de inventario en tiempo real"
                  checked={pushSettings.lowStock}
                  onChange={(v) => setPushSettings((s) => ({ ...s, lowStock: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Star}
                  title="Nuevas reseñas"
                  description="Notificaciones cuando recibas una reseña"
                  checked={pushSettings.reviews}
                  onChange={(v) => setPushSettings((s) => ({ ...s, reviews: v }))}
                  divider={false}
                />
                <NotificationToggleRow
                  icon={Megaphone}
                  title="Campañas"
                  description="Resultados y actualizaciones de campañas"
                  checked={pushSettings.campaigns}
                  onChange={(v) => setPushSettings((s) => ({ ...s, campaigns: v }))}
                  divider={false}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Espacio extra en móvil para el botón sticky */}
        <div className="h-4 lg:hidden" />
      </motion.div>

      {/* ── Botón guardar sticky en móvil ── */}
      <div
        className={`
          fixed bottom-[calc(88px+env(safe-area-inset-bottom))]
          left-4 right-4
          lg:hidden z-30
        `}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className={`
            w-full flex items-center justify-center gap-2
            rounded-2xl py-3.5
            text-sm font-semibold shadow-lg
            transition-colors
            ${saved
              ? 'bg-origen-pradera text-white'
              : 'bg-origen-bosque text-white active:bg-origen-pino'}
          `}
        >
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : 'Guardar preferencias'}
        </motion.button>
      </div>
    </>
  );
}