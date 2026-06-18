/**
 * @page NotificationsPage
 * @description Bandeja de notificaciones + configuración de canales (email / push).
 *              Tab "Bandeja": listado con filtros.
 *              Tab "Configuración": preferencias por tipo de evento.
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import {
  Card,
  CardContent,
  FilterToolbar,
  FilterPanel,
  ActiveFilterChips,
  SearchInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DateInput,
  Spinner,
  EmptyState,
  PageLoader,
  PageError,
  useIsMobile,
  Button,
  type ActiveFilterChip,
  type FilterSection,
} from '@arcediano/ux-library';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';

import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api/notifications';
import type { Notification } from '@/types/notification';


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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const isFirstLoadRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile(1024);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

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

    // Calcular inicio de semana (lunes)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));

    // Calcular inicio de mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Agrupar notificaciones
    const today = filteredNotifications.filter(
      (notification) => notification.timestamp >= startOfToday
    );
    const thisWeek = filteredNotifications.filter(
      (notification) =>
        notification.timestamp >= startOfWeek && notification.timestamp < startOfToday
    );
    const thisMonth = filteredNotifications.filter(
      (notification) =>
        notification.timestamp >= startOfMonth && notification.timestamp < startOfWeek
    );
    const older = filteredNotifications.filter(
      (notification) => notification.timestamp < startOfMonth
    );

    return [
      { key: 'today', label: 'Hoy', items: today },
      { key: 'thisWeek', label: 'Esta semana', items: thisWeek },
      { key: 'thisMonth', label: 'Este mes', items: thisMonth },
      { key: 'older', label: 'Anteriores', items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const loadInbox = async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setIsInboxLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await fetchNotifications({ page: pageNum, limit: 20 });
      if (response.data) {
        const newNotifications = response.data.notifications;
        setNotifications(prev =>
          append ? [...prev, ...newNotifications] : newNotifications
        );
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      } else {
        setError('No se pudieron cargar las notificaciones.');
      }
    } catch (err) {
      console.error('[notifications] Error loading inbox:', err);
      setError('Error al cargar las notificaciones. Intenta de nuevo.');
    } finally {
      setIsInboxLoading(false);
      setIsLoadingMore(false);
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
    }
  };

  // Carga inicial + recarga cuando cambian filtros
  useEffect(() => {
    void loadInbox(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, readFilter, dateFrom, dateTo]);

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
      void loadInbox(page, false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    // Optimistic update
    const snapshot = notifications.slice();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
    setIsMarkingAll(true);

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('[notifications] Error marcando todas como leídas:', error);
      // Rollback on error
      setNotifications(snapshot);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || isInboxLoading) return;
    void loadInbox(page + 1, true);
  };

  // Handlers de filtro — batchean setIsInboxLoading(true) con el cambio de estado
  // para que React renderice skeleton y lista filtrada en el mismo ciclo,
  // evitando que la lista filtrada aparezca un frame antes del skeleton.
  const applyTypeFilter = (v: string) => {
    if (!isFirstLoadRef.current) setIsInboxLoading(true);
    setTypeFilter(v as NotificationTypeFilter);
  };
  const applyReadFilter = (v: string) => {
    if (!isFirstLoadRef.current) setIsInboxLoading(true);
    setReadFilter(v as ReadFilter);
  };
  const applyDateFrom = (v: string) => {
    if (!isFirstLoadRef.current) setIsInboxLoading(true);
    setDateFrom(v);
  };
  const applyDateTo = (v: string) => {
    if (!isFirstLoadRef.current) setIsInboxLoading(true);
    setDateTo(v);
  };

  const clearFilters = () => {
    if (!isFirstLoadRef.current) setIsInboxLoading(true);
    setTypeFilter('all');
    setReadFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // ── Chips de filtros activos ───────────────────────────────────────────────

  const TYPE_LABELS: Record<string, string> = {
    operativas: 'Operativas',
    cuenta:     'Cuenta y sistema',
    marketing:  'Marketing',
  };

  const READ_LABELS: Record<string, string> = {
    unread: 'Solo no leídas',
    read:   'Solo leídas',
  };

  const activeChips: ActiveFilterChip[] = [
    ...(typeFilter !== 'all' ? [{
      id: 'type',
      label: TYPE_LABELS[typeFilter] ?? typeFilter,
      onRemove: () => applyTypeFilter('all'),
    }] : []),
    ...(readFilter !== 'all' ? [{
      id: 'read',
      label: READ_LABELS[readFilter] ?? readFilter,
      onRemove: () => applyReadFilter('all'),
    }] : []),
    ...(dateFrom ? [{
      id: 'dateFrom',
      label: `Desde: ${dateFrom}`,
      onRemove: () => applyDateFrom(''),
    }] : []),
    ...(dateTo ? [{
      id: 'dateTo',
      label: `Hasta: ${dateTo}`,
      onRemove: () => applyDateTo(''),
    }] : []),
  ];

  // ── Secciones del panel de filtros ────────────────────────────────────────

  const filterSections: FilterSection[] = [
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
      onChange: applyTypeFilter,
    },
    {
      type: 'chips',
      id: 'read',
      title: 'Estado de lectura',
      options: [
        { label: 'Todas', value: 'all' },
        { label: 'No leídas', value: 'unread' },
        { label: 'Leídas', value: 'read' },
      ],
      value: readFilter,
      onChange: applyReadFilter,
    },
    {
      type: 'daterange',
      id: 'date',
      title: 'Rango de fechas',
      valueFrom: dateFrom,
      valueTo: dateTo,
      onChangeFrom: applyDateFrom,
      onChangeTo: applyDateTo,
    },
  ];

  if (isFirstLoadRef.current && isInboxLoading) {
    return <PageLoader />;
  }

  if (error && !isInboxLoading) {
    return <PageError message={error} onRetry={loadInbox} />;
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Notificaciones"
        description="Bandeja de actividad y configuración de alertas"
        badgeIcon={Bell}
        badgeText="Notificaciones"
        tooltip="Notificaciones"
        tooltipDetailed="Gestiona tu bandeja de entrada y configura cómo recibes cada tipo de alerta."
      />

      <div className="container mx-auto space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">

        {/* ── Filtros ───────────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {/* Desktop (≥lg): controles inline siempre visibles */}
          <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border-subtle rounded-xl px-3 py-2 shadow-sm">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por título o detalle..."
              aria-label="Buscar notificaciones"
              className="min-w-[200px] flex-1"
              size="md"
              clearable
            />

            <Select value={typeFilter} onValueChange={applyTypeFilter} className="w-auto">
              <SelectTrigger className="min-w-[160px] max-w-[180px] h-10" tone="subtle">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="operativas">Operativas</SelectItem>
                <SelectItem value="cuenta">Cuenta y sistema</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={readFilter} onValueChange={applyReadFilter} className="w-auto">
              <SelectTrigger className="min-w-[130px] max-w-[150px] h-10" tone="subtle">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-text-subtle whitespace-nowrap">Desde</span>
              <DateInput
                value={dateFrom}
                onChange={(e) => applyDateFrom(e.target.value)}
                inputSize="sm"
                className="w-[148px]"
                aria-label="Fecha desde"
              />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-text-subtle whitespace-nowrap">Hasta</span>
              <DateInput
                value={dateTo}
                onChange={(e) => applyDateTo(e.target.value)}
                inputSize="sm"
                className="w-[148px]"
                aria-label="Fecha hasta"
              />
            </div>
          </div>

          {/* Móvil/tablet (<lg): barra con botón "Filtros" */}
          <div className="lg:hidden">
            <FilterToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar por título o detalle..."
              searchAriaLabel="Buscar notificaciones"
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setIsFilterOpen(true)}
              filtersButtonRef={filtersButtonRef}
            />
          </div>

          {/* Chips de filtros activos — ambos breakpoints */}
          {activeChips.length > 0 && (
            <div className="flex items-center gap-2 bg-origen-nube border border-dashed border-origen-bosque/20 rounded-xl px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap flex-shrink-0">
                Activos:
              </span>
              <ActiveFilterChips chips={activeChips} onClearAll={clearFilters} />
            </div>
          )}
        </div>

        {/* Card principal */}
        <Card id="notifications-inbox" variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    No leídos: <span className="font-semibold text-origen-bosque">{unreadCount}</span>
                  </p>
                  {unreadCount > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAll}
                    >
                      Marcar todas como leídas
                    </Button>
                  )}
                </div>
              </div>

              {isInboxLoading ? (
                <div className="flex items-center justify-center py-12" aria-busy="true">
                  <Spinner size="md" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={<Bell className="w-6 h-6" />}
                  title="Sin notificaciones"
                  description={
                    searchQuery || activeFilterCount > 0
                      ? "No hay notificaciones que coincidan con los filtros seleccionados."
                      : "No tienes notificaciones en este momento."
                  }
                />
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

                  {/* Botón Cargar más */}
                  {hasMore && !isInboxLoading && (
                    <div className="px-4 py-3 text-center border-t border-border-subtle sm:px-6">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* FilterPanel — montado solo en móvil/tablet (<lg), como en Products/Orders/Reviews */}
      {isMobile && (
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          triggerRef={filtersButtonRef}
          sections={filterSections}
          onClearAll={clearFilters}
          resultCount={filteredNotifications.length}
          resultLabel="notificaciones"
        />
      )}
    </div>
  );
}
