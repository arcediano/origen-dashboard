/**
 * @component MobileTopBar
 * @description Header nativo para móvil — solo logo en tabs raíz, back+título en sub-páginas.
 * Patrón profesional: la sección activa NO aparece en el header, sino en el contenido de la página.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, ChevronLeft, Leaf } from 'lucide-react';
import { getDashboardPageTitle, isRootMobileTab } from '@/constants/sidebar';
import { getUnreadCount } from '@/lib/api/notifications';

interface MobileTopBarProps {
  notificationCount?: number;
}

export function MobileTopBar({ notificationCount = 0 }: MobileTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [liveNotificationCount, setLiveNotificationCount] = useState(notificationCount);

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

  if (!mounted) return null;

  const isRoot = isRootMobileTab(pathname);
  const subTitle = getDashboardPageTitle(pathname);

  return (
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
                onClick={() => router.back()}
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

        {/* Zona derecha — acceso persistente a notificaciones */}
        <motion.div whileTap={{ scale: 0.82 }} className="flex-shrink-0">
          <Link
            href="/dashboard/notifications?view=inbox"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-origen-pradera/10 transition-colors"
            aria-label={liveNotificationCount > 0 ? `Notificaciones (${liveNotificationCount})` : 'Notificaciones'}
          >
            <Bell className="w-[18px] h-[18px] text-foreground stroke-[1.8]" />
            {liveNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-surface-alt" />
            )}
          </Link>
        </motion.div>

      </div>
    </header>
  );
}
