/**
 * @component NotificationBell
 * @description Campana de notificaciones con badge y desplegable
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@arcediano/ux-library';
import { AlertCircle, Bell, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem } from './NotificationItem';
import { fetchUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api/notifications';
import type { Notification } from '@/types/notification';

interface NotificationBellProps {
  initialNotifications?: Notification[];
}

export function NotificationBell({ initialNotifications = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(!initialNotifications.length);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones solo una vez
  useEffect(() => {
    if (!hasLoaded && !initialNotifications.length) {
      loadNotifications();
    }
  }, [hasLoaded, initialNotifications]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchUnreadNotifications();
      if (response.data) {
        setNotifications(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Manejador de clic fuera mejorado
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        buttonContainerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const previewNotifications = notifications.slice(0, 5);

  const groupedPreviewNotifications = (() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const today = previewNotifications.filter((notification) => notification.timestamp >= startOfToday);
    const older = previewNotifications.filter((notification) => notification.timestamp < startOfToday);

    return [
      { key: 'today', label: 'Hoy', items: today },
      { key: 'older', label: 'Anteriores', items: older },
    ].filter((group) => group.items.length > 0);
  })();

  const handleMarkAsRead = useCallback(async (id: string) => {
    // Optimistic: remove from list immediately (all fetched notifications are unread)
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      // On failure, reload to restore the correct state
      void loadNotifications();
    }
  }, [loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!unreadCount || isUpdating) return;
    // Snapshot for rollback in case of failure
    const snapshot = notifications.slice();
    setIsUpdating(true);
    setNotifications([]);
    setIsOpen(false);
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      // Rollback optimistic update
      setNotifications(snapshot);
    } finally {
      setIsUpdating(false);
    }
  }, [notifications, unreadCount, isUpdating]);

  const toggleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative notifications-menu">
      <div ref={buttonContainerRef}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative text-foreground hover:text-origen-bosque hover:bg-origen-pradera/10 transition-all',
            isOpen && 'bg-origen-pradera/10 text-origen-bosque'
          )}
          onClick={toggleOpen}
          aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount})` : 'Notificaciones'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls="notification-bell-panel"
        >
          <Bell className="w-5 h-5" />

          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-red-500 border-2 border-white"
              role="status"
              aria-live="polite"
              aria-label={`${unreadCount} notificaciones sin leer`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-alt rounded-xl shadow-xl border border-border-subtle overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
            id="notification-bell-panel"
            role="dialog"
            aria-label="Notificaciones recientes"
          >
            {/* Cabecera */}
              <div className="bg-gradient-to-r from-origen-crema to-surface-alt px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-origen-menta/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-origen-menta" />
                  </div>
                  <h3 className="text-sm font-semibold text-origen-bosque">Notificaciones</h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isUpdating}
                    className="text-xs text-origen-menta hover:text-origen-pradera transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[32rem] overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-origen-crema mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-text-subtle">Cargando...</p>
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">No se pudieron cargar</p>
                  <p className="text-xs text-text-subtle mt-1">las notificaciones</p>
                  <button
                    onClick={() => void loadNotifications()}
                    className="mt-3 text-xs text-origen-menta hover:text-origen-pradera transition-colors font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-origen-crema flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-origen-pradera/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">¡Todo al día!</p>
                  <p className="text-xs text-text-subtle mt-1">No hay notificaciones nuevas</p>
                </div>
              ) : (
                <div>
                  {groupedPreviewNotifications.map((group) => (
                    <div key={group.key}>
                      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {group.label}
                      </div>
                      <div className="divide-y divide-border-subtle">
                        {group.items.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onClose={close}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

              {!isLoading && !error && notifications.length > previewNotifications.length && (
                <div className="px-4 py-2 text-[11px] text-text-subtle border-t border-border-subtle">
                  Mostrando {previewNotifications.length} de {notifications.length} notificaciones no leídas.
                </div>
              )}

            {/* Footer */}
            <div className="border-t border-border-subtle p-2 bg-surface">
              <Link
                  href="/dashboard/notifications"
                className="block w-full text-center text-xs text-muted-foreground hover:text-origen-bosque py-2 transition-colors font-medium"
                onClick={close}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
