/**
 * @page NotificationsPage
 * @description Preferencias de notificaciones — HV06 mobile-first
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Inbox,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent } from '@arcediano/ux-library';
import { Button } from '@arcediano/ux-library';
import { NotificationToggleRow } from './components/NotificationToggleRow';
import { SegmentedControl, type SegmentItem } from './components/SegmentedControl';
import { gatewayClient } from '@/lib/api/client';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/notifications';
import type { Notification } from '@/types/notification';

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────

const SEGMENTS: SegmentItem[] = [
  { value: 'inbox', label: 'Bandeja', icon: Inbox },
  { value: 'preferences', label: 'Preferencias', icon: Bell },
];

const PREFERENCE_SEGMENTS: SegmentItem[] = [
  { value: 'email', label: 'Email',       icon: Mail       },
  { value: 'push',  label: 'Push',        icon: Smartphone },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const initialView = viewParam === 'preferences' ? 'preferences' : 'inbox';

  const [activeView, setActiveView] = useState<'inbox' | 'preferences'>(initialView);
  const [activeTab, setActiveTab] = useState<'email' | 'push'>('email');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isInboxUpdating, setIsInboxUpdating] = useState(false);

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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadInbox = async () => {
    setIsInboxLoading(true);
    try {
      const response = await fetchNotifications({ page: 1, limit: 30 });
      if (response.data) {
        setNotifications(response.data.notifications);
      }
    } finally {
      setIsInboxLoading(false);
    }
  };

  useEffect(() => {
    void loadInbox();
  }, []);

  useEffect(() => {
    const normalizedView = viewParam === 'preferences' ? 'preferences' : 'inbox';
    if (viewParam !== normalizedView) {
      router.replace(`/dashboard/notifications?view=${normalizedView}`, { scroll: false });
    }
    setActiveView(normalizedView);
  }, [viewParam, router]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('[notifications] Error marcando notificación como leída:', error);
      void loadInbox();
    }
  };

  const handleMarkAll = async () => {
    if (!unreadCount || isInboxUpdating) return;
    setIsInboxUpdating(true);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('[notifications] Error marcando todas como leídas:', error);
      void loadInbox();
    } finally {
      setIsInboxUpdating(false);
    }
  };

  const handleViewChange = (view: 'inbox' | 'preferences') => {
    setActiveView(view);
    router.replace(`/dashboard/notifications?view=${view}`, { scroll: false });
  };

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
        className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema"
      >
        <PageHeader
          title="Notificaciones"
          description="Gestiona tu bandeja y cómo quieres recibir avisos"
          badgeIcon={Bell}
          badgeText={activeView === 'inbox' ? 'Bandeja' : 'Preferencias'}
          tooltip="Notificaciones"
          tooltipDetailed="Define qué avisos llegan a la campana y cómo quieres recibirlos."
          actions={
            activeView === 'preferences' ? (
              <div className="hidden lg:block">
                <Button onClick={handleSave}>
                  <span className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Guardar preferencias</span>
                  </span>
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="outline" onClick={() => void loadInbox()}>
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                  </span>
                </Button>
                <Button onClick={handleMarkAll} disabled={!unreadCount || isInboxUpdating}>
                  <span className="inline-flex items-center gap-2">
                    <CheckCheck className="w-4 h-4" />
                    <span>Marcar todas</span>
                  </span>
                </Button>
              </div>
            )
          }
        />

        <div className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8">

        {/* Vista principal */}
        <SegmentedControl
          items={SEGMENTS}
          active={activeView}
          onChange={(v) => handleViewChange(v as 'inbox' | 'preferences')}
          className="max-w-lg"
        />

        {activeView === 'inbox' && (
          <Card variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-border-subtle px-4 py-3 text-sm text-muted-foreground sm:px-6">
                Tienes <span className="font-semibold text-origen-bosque">{unreadCount}</span> notificación(es) sin leer.
              </div>
              {isInboxLoading ? (
                <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">Cargando notificaciones...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">No hay notificaciones por ahora.</div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeView === 'preferences' && (
          <>
            <SegmentedControl
              items={PREFERENCE_SEGMENTS}
              active={activeTab}
              onChange={(v) => setActiveTab(v as 'email' | 'push')}
              className="max-w-lg"
            />

            <Card variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
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
          </>
        )}

        {/* Espacio extra en móvil para el botón sticky */}
        <div className="h-4 lg:hidden" />
        </div>
      </motion.div>

      {/* ── Botón guardar sticky en móvil ── */}
      {activeView === 'preferences' && (
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
      )}
    </>
  );
}
