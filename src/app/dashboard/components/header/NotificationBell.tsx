/**
 * @component NotificationBell
 * @description Campana de notificaciones con badge y desplegable
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { Bell, Sparkles } from 'lucide-react';
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
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones solo una vez
  useEffect(() => {
    if (!hasLoaded && !initialNotifications.length) {
      loadNotifications();
    }
  }, [hasLoaded, initialNotifications]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchUnreadNotifications();
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
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
        buttonRef.current?.contains(target) ||
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

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  }, []);

  const toggleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="relative notifications-menu">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={cn(
          'relative text-gray-700 hover:text-origen-bosque hover:bg-origen-pradera/10 transition-all',
          isOpen && 'bg-origen-pradera/10 text-origen-menta'
        )}
        onClick={toggleOpen}
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg bg-origen-menta shadow-menta-glow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-origen-crema to-white px-4 py-3 border-b border-gray-100">
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
                    className="text-xs text-origen-menta hover:text-origen-pradera transition-colors font-medium"
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
                  <p className="text-sm text-gray-400">Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-origen-crema flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-origen-pradera/40" />
                  </div>
                  <p className="text-sm text-gray-500">¡Todo al día!</p>
                  <p className="text-xs text-gray-400 mt-1">No hay notificaciones nuevas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onClose={close}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-2 bg-gray-50/50">
              <Link
                href="/dashboard/notificaciones"
                className="block w-full text-center text-xs text-gray-600 hover:text-origen-bosque py-2 transition-colors font-medium"
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