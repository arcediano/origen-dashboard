/**
 * @page NotificationsPage
 * @description Bandeja de notificaciones + configuración de canales (email / push).
 *              Tab "Bandeja": listado con filtros.
 *              Tab "Configuración": preferencias por tipo de evento.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Search, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, DateRangeInput } from '@arcediano/ux-library';
import { FilterBottomSheet } from '@/components/shared/mobile';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';
import { SegmentedControl } from './components/SegmentedControl';
import { NotificationsPreferencesPanel } from './components/NotificationsPreferencesPanel';
import { fetchNotifications, markNotificationAsRead } from '@/lib/api/notifications';
import type { Notification } from '@/types/notification';

type NotificationsTab = 'inbox' | 'preferences';
type NotificationTypeFilter = 'all' | 'operativas' | 'cuenta' | 'marketing';
type ReadFilter = 'all' | 'unread' | 'read';

function normalizeDateBoundary(value: string, mode: 'from' | 'to'): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (mode === 'to') {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationsTab>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count += 1;
    if (readFilter !== 'all') count += 1;
    if (dateFrom) count += 1;
    if (dateTo) count += 1;
    return count;
  }, [typeFilter, readFilter, dateFrom, dateTo]);

  const hasInvalidDateRange = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    const from = new Date(`${dateFrom}T00:00:00`).getTime();
    const to = new Date(`${dateTo}T23:59:59`).getTime();
    return from > to;
  }, [dateFrom, dateTo]);

  const filteredNotifications = useMemo(() => {
    if (hasInvalidDateRange) return [];

    const search = searchQuery.trim().toLowerCase();
    const fromBoundary = normalizeDateBoundary(dateFrom, 'from');
    const toBoundary = normalizeDateBoundary(dateTo, 'to');

    const byFilter = notifications.filter((notification) => {
      const category = notification.category;

      if (search) {
        const inTitle = notification.title.toLowerCase().includes(search);
        const inDescription = notification.description.toLowerCase().includes(search);
        if (!inTitle && !inDescription) return false;
      }

      if (typeFilter === 'operativas' && !(category === 'ORDER' || category === 'PRODUCT' || category === 'REVIEW')) return false;
      if (typeFilter === 'cuenta' && !(category === 'ACCOUNT' || category === 'SYSTEM')) return false;
      if (typeFilter === 'marketing' && category !== 'MARKETING') return false;

      if (readFilter === 'unread' && notification.read) return false;
      if (readFilter === 'read' && !notification.read) return false;

      if (fromBoundary && notification.timestamp < fromBoundary) return false;
      if (toBoundary && notification.timestamp > toBoundary) return false;

      return true;
    });

    return [...byFilter].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [notifications, searchQuery, typeFilter, readFilter, dateFrom, dateTo, hasInvalidDateRange]);

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const today = filteredNotifications.filter((notification) => notification.timestamp >= startOfToday);
    const older = filteredNotifications.filter((notification) => notification.timestamp < startOfToday);

    return [
      { key: 'today', label: 'Hoy', items: today },
      { key: 'older', label: 'Anteriores', items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const loadInbox = async () => {
    setIsInboxLoading(true);
    try {
      const response = await fetchNotifications({ page: 1, limit: 50 });
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

  const handleMarkAsRead = async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('[notifications] Error marcando notificacion como leida:', error);
      void loadInbox();
    }
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setReadFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Notificaciones"
        description="Bandeja de actividad y configuración de alertas"
        badgeIcon={Bell}
        badgeText="Notificaciones"
        tooltip="Notificaciones"
        tooltipDetailed="Gestiona tu bandeja de entrada y configura cómo recibes cada tipo de alerta."
      />

      <div className="container mx-auto space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">

        {/* ── Tabs ── */}
        <SegmentedControl
          layoutId="notifications-tabs"
          items={[
            { value: 'inbox',       label: 'Bandeja',        icon: Bell      },
            { value: 'preferences', label: 'Configuración',  icon: Settings2 },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as NotificationsTab)}
        />

        {/* ── Tab: Configuración ── */}
        {activeTab === 'preferences' && (
          <NotificationsPreferencesPanel />
        )}

        {/* ── Tab: Bandeja ── */}
        {activeTab === 'inbox' && (
        <Card id="notifications-inbox" variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por titulo o detalle..."
                    className="w-full h-10 pl-9 pr-8 text-sm bg-surface-alt border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-colors"
                    aria-label="Buscar notificaciones"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-origen-bosque transition-colors"
                      aria-label="Limpiar busqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className={
                    activeFilterCount > 0
                      ? 'lg:hidden flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors bg-origen-bosque border-origen-bosque text-white'
                      : 'lg:hidden flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors bg-surface-alt border-border text-origen-bosque'
                  }
                  aria-label="Abrir filtros"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as NotificationTypeFilter)}
                  className="h-10 rounded-xl border border-border-subtle bg-surface-alt px-3 text-sm text-origen-bosque focus:outline-none focus:ring-1 focus:ring-origen-pradera/30"
                  aria-label="Filtrar por tipo"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="operativas">Operativas</option>
                  <option value="cuenta">Cuenta y sistema</option>
                  <option value="marketing">Marketing</option>
                </select>

                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
                  className="h-10 rounded-xl border border-border-subtle bg-surface-alt px-3 text-sm text-origen-bosque focus:outline-none focus:ring-1 focus:ring-origen-pradera/30"
                  aria-label="Filtrar por estado de lectura"
                >
                  <option value="all">Leidas y no leidas</option>
                  <option value="unread">Solo no leidas</option>
                  <option value="read">Solo leidas</option>
                </select>

                <DateRangeInput
                  labelFrom="Desde"
                  labelTo="Hasta"
                  valueFrom={dateFrom}
                  valueTo={dateTo}
                  onChangeFrom={setDateFrom}
                  onChangeTo={setDateTo}
                  inputSize="sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Pendientes: <span className="font-semibold text-origen-bosque">{unreadCount}</span>
                </p>
              </div>
            </div>

            {isInboxLoading ? (
              <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">Cargando notificaciones...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-text-subtle sm:px-6">No hay notificaciones para estos filtros.</div>
            ) : (
              <div>
                {groupedNotifications.map((group) => (
                  <div key={group.key}>
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-6">
                      {group.label}
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {group.items.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )} {/* end activeTab === 'inbox' */}
      </div>

      {/* FilterBottomSheet — siempre montado (portal), visible solo cuando isFilterOpen */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtros de notificaciones"
        sections={[
          {
            type: 'chips',
            id: 'type',
            title: 'Tipo',
            options: [
              { label: 'Todos', value: 'all' },
              { label: 'Operativas', value: 'operativas' },
              { label: 'Cuenta y sistema', value: 'cuenta' },
              { label: 'Marketing', value: 'marketing' },
            ],
            value: typeFilter,
            onChange: (value) => setTypeFilter(value as NotificationTypeFilter),
          },
          {
            type: 'chips',
            id: 'read',
            title: 'Estado de lectura',
            options: [
              { label: 'Todas', value: 'all' },
              { label: 'No leidas', value: 'unread' },
              { label: 'Leidas', value: 'read' },
            ],
            value: readFilter,
            onChange: (value) => setReadFilter(value as ReadFilter),
          },
          {
            type: 'daterange',
            id: 'date',
            title: 'Rango de fechas',
            valueFrom: dateFrom,
            valueTo: dateTo,
            onChangeFrom: setDateFrom,
            onChangeTo: setDateTo,
          },
        ]}
        onClearAll={clearFilters}
        resultCount={filteredNotifications.length}
        resultLabel="notificaciones"
      />
    </div>
  );
}
