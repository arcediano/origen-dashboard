/**
 * @page NotificationsPage
 * @description Centro de actividad (bandeja + preferencias) — mobile-first
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
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
import { gatewayClient } from '@/lib/api/client';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/notifications';
import type { Notification } from '@/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const initialView = viewParam === 'preferences' ? 'preferences' : 'inbox';

  const [activeView, setActiveView] = useState<'inbox' | 'preferences'>(initialView);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isInboxUpdating, setIsInboxUpdating] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'operativas' | 'cuenta' | 'marketing'>('all');

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

  const filteredNotifications = useMemo(() => {
    const byFilter = notifications.filter((notification) => {
      const category = notification.category;
      if (activityFilter === 'all') return true;
      if (activityFilter === 'operativas') return category === 'ORDER' || category === 'PRODUCT' || category === 'REVIEW';
      if (activityFilter === 'cuenta') return category === 'ACCOUNT' || category === 'SYSTEM';
      return category === 'MARKETING';
    });

    const priorityScore: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    return [...byFilter].sort((a, b) => {
      // Priorizar no leídas
      if (a.read !== b.read) return a.read ? 1 : -1;

      // Luego prioridad de negocio/canonica
      const aPriority = priorityScore[a.priority ?? 'MEDIUM'] ?? 2;
      const bPriority = priorityScore[b.priority ?? 'MEDIUM'] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Último criterio: más recientes primero
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [notifications, activityFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: notifications.length,
      operativas: notifications.filter((n) => n.category === 'ORDER' || n.category === 'PRODUCT' || n.category === 'REVIEW').length,
      cuenta: notifications.filter((n) => n.category === 'ACCOUNT' || n.category === 'SYSTEM').length,
      marketing: notifications.filter((n) => n.category === 'MARKETING').length,
    };
  }, [notifications]);

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

    const targetId = view === 'inbox' ? 'notifications-inbox' : 'notifications-preferences';
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
        <PageHeader
          title="Notificaciones"
          description="Centro de actividad para revisar eventos y definir cómo quieres recibir avisos"
          badgeIcon={Bell}
          badgeText="Centro de actividad"
          tooltip="Notificaciones"
          tooltipDetailed="Define qué avisos llegan a la campana y cómo quieres recibirlos, sin navegar entre múltiples tabs."
        />

        <div className="container mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleViewChange('inbox')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                activeView === 'inbox'
                  ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                  : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Bandeja
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('preferences')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                activeView === 'preferences'
                  ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                  : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Preferencias
              </span>
            </button>
          </div>

          <Card id="notifications-inbox" variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActivityFilter('all')}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activityFilter === 'all'
                        ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                        : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
                    }`}
                  >
                    Todo ({filterCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('operativas')}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activityFilter === 'operativas'
                        ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                        : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
                    }`}
                  >
                    Operativas ({filterCounts.operativas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('cuenta')}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activityFilter === 'cuenta'
                        ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                        : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
                    }`}
                  >
                    Cuenta y sistema ({filterCounts.cuenta})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('marketing')}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activityFilter === 'marketing'
                        ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                        : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
                    }`}
                  >
                    Marketing ({filterCounts.marketing})
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Tienes <span className="font-semibold text-origen-bosque">{unreadCount}</span> notificación(es) sin leer.
                  </p>
                  <div className="flex items-center gap-2">
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
                </div>
              </div>
              {isInboxLoading ? (
                <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">Cargando notificaciones...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">No hay notificaciones por ahora.</div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {filteredNotifications.map((notification) => (
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

          <Card id="notifications-preferences" variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
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

                  <div className="px-4 sm:px-6 divide-y divide-border-subtle lg:border-l lg:border-border-subtle">
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

          {/* Espacio extra en móvil para el botón sticky */}
          <div className="h-4 lg:hidden" />
        </div>
      </div>

      {/* ── Botón guardar sticky en móvil ── */}
      <div
        className={`
          fixed bottom-[calc(88px+env(safe-area-inset-bottom))]
          left-4 right-4
          lg:hidden z-30
        `}
      >
        <button
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
        </button>
      </div>
    </>
  );
}
