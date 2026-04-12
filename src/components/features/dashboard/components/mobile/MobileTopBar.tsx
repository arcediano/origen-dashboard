/**
 * @component MobileTopBar
 * @description Header nativo para móvil — solo logo en tabs raíz, back+título en sub-páginas.
 * Patrón profesional: la sección activa NO aparece en el header, sino en el contenido de la página.
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, ChevronLeft, Leaf, Sparkles } from 'lucide-react';
import { getDashboardPageTitle, isRootMobileTab } from '@/constants/sidebar';
import { fetchUnreadNotifications, markAllNotificationsAsRead, markNotificationAsRead, getUnreadCount } from '@/lib/api/notifications';
import { NotificationItem } from '@/app/dashboard/components/header/NotificationItem';
import type { Notification } from '@/types/notification';

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [liveNotificationCount, setLiveNotificationCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;

    const loadUnreadCount = async () => {
      const response = await getUnreadCount();
      if (active && response.data) {
        setLiveNotificationCount(response.data.count);
      }
    };

    void loadUnreadCount();

    return () => {
      active = false;
    };
  }, []);

  const openNotifications = useCallback(async () => {
    setIsNotifOpen(true);
    if (notifList.length === 0) {
      setNotifLoading(true);
      try {
        const response = await fetchUnreadNotifications();
        if (response.data) setNotifList(response.data);
      } catch {
        // silently fail
      } finally {
        setNotifLoading(false);
      }
    }
  }, [notifList.length]);

  const closeNotifications = useCallback(() => setIsNotifOpen(false), []);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifList(prev => prev.filter(n => n.id !== id));
    setLiveNotificationCount(prev => Math.max(0, prev - 1));
    void markNotificationAsRead(id);
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    if (isUpdatingAll) return;
    const snapshot = notifList.slice();
    setIsUpdatingAll(true);
    setNotifList([]);
    setLiveNotificationCount(0);
    setIsNotifOpen(false);
    try {
      await markAllNotificationsAsRead();
    } catch {
      setNotifList(snapshot);
    } finally {
      setIsUpdatingAll(false);
    }
  }, [notifList, isUpdatingAll]);

  if (!mounted) return null;

  const isRoot = isRootMobileTab(pathname);
  const subTitle = getDashboardPageTitle(pathname);

  const handleBackNavigation = () => {
    if (pathname.startsWith('/dashboard/configuracion/pagos')) {
      router.push('/dashboard/account');
      return;
    }
    router.back();
  };

  return (
    <>
    <header
      className={cn(
        'lg:hidden fixed top-0 inset-x-0 z-40',
        'transition-all duration-300',
        scrolled
          ? 'bg-surface-alt/94 backdrop-blur-xl shadow-sm border-b border-border-subtle'
          : 'bg-transparent',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center h-14 px-4">

        {/* Zona izquierda — logo O botón atrás */}
        <AnimatePresence mode="wait" initial={false}>
          {isRoot ? (
            /* ── TABS RAÍZ: marca compacta estilo app ── */
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-gradient-to-br from-origen-bosque to-origen-pino shadow-sm flex-shrink-0">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-[17px] font-bold text-origen-bosque tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                  origen.
                </span>
                <span className="block text-[11px] font-medium text-muted-foreground truncate">
                  Panel del productor
                </span>
              </div>
            </motion.div>
          ) : (
            /* ── SUB-PÁGINAS: back + título de la sub-página ── */
            <motion.div
              key="back"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={handleBackNavigation}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-alt/80 hover:bg-origen-pradera/10 transition-colors text-origen-bosque border border-border-subtle flex-shrink-0"
                type="button"
                aria-label="Volver"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
              {subTitle && (
                <motion.span
                  key={pathname}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: 0.05 }}
                  className="text-sm font-semibold text-foreground truncate"
                >
                  {subTitle}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zona derecha — campana de notificaciones */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => { void openNotifications(); }}
            className={cn(
              'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isNotifOpen
                ? 'bg-origen-pradera/10 text-origen-bosque'
                : 'hover:bg-origen-pradera/10 text-foreground',
            )}
            type="button"
            aria-label={liveNotificationCount > 0 ? `Notificaciones (${liveNotificationCount})` : 'Notificaciones'}
            aria-expanded={isNotifOpen}
          >
            <Bell className="w-[18px] h-[18px] stroke-[1.8]" />
            {liveNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 border border-white text-[10px] font-bold text-white flex items-center justify-center">
                {liveNotificationCount > 9 ? '9+' : liveNotificationCount}
              </span>
            )}
          </motion.button>
        </div>

      </div>
    </header>

    {/* Panel de notificaciones */}
    <AnimatePresence>
      {isNotifOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/20"
            style={{ top: '56px' }}
            onClick={closeNotifications}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden fixed inset-x-3 z-40 bg-surface-alt rounded-2xl shadow-xl border border-border-subtle overflow-hidden"
            style={{ top: 'calc(56px + 8px + env(safe-area-inset-top))' }}
            role="dialog"
            aria-label="Notificaciones recientes"
          >
            {/* Cabecera del panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-origen-crema to-surface-alt">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-origen-menta/10 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-origen-menta" />
                </div>
                <h3 className="text-sm font-semibold text-origen-bosque">Notificaciones</h3>
              </div>
              {liveNotificationCount > 0 && (
                <button
                  onClick={() => { void handleMarkAllAsRead(); }}
                  disabled={isUpdatingAll}
                  className="text-xs text-origen-menta hover:text-origen-pradera font-medium disabled:opacity-50 transition-colors"
                >
                  Marcar todas
                </button>
              )}
            </div>

            {/* Lista — máx 5 notificaciones */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifLoading ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-origen-crema mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-text-subtle">Cargando...</p>
                </div>
              ) : notifList.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-origen-crema flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-origen-pradera/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">¡Todo al día!</p>
                  <p className="text-xs text-text-subtle mt-1">No hay notificaciones nuevas</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {notifList.slice(0, 5).map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onClose={closeNotifications}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle p-2 bg-surface">
              <Link
                href="/dashboard/notifications"
                className="block w-full text-center text-xs text-muted-foreground hover:text-origen-bosque py-2 transition-colors font-medium"
                onClick={closeNotifications}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
