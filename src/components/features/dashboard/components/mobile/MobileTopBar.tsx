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

const ROOT_TABS = [
  '/dashboard',
  '/dashboard/products',
  '/dashboard/orders',
  '/dashboard/reviews',
  '/dashboard/profile',
];

function isRootTab(pathname: string): boolean {
  return ROOT_TABS.some(t => pathname === t);
}

// Títulos solo para sub-páginas (no para tabs raíz — esas tienen PageHeader en el contenido)
const SUB_PAGE_TITLES: Record<string, string> = {
  '/dashboard/products/create': 'Nuevo producto',
  '/dashboard/profile/personal': 'Datos personales',
  '/dashboard/profile/business': 'Mi negocio',
  '/dashboard/profile/settings': 'Ajustes',
  '/dashboard/profile/certifications': 'Certificaciones',
  '/dashboard/notifications': 'Notificaciones',
  '/dashboard/configuracion': 'Configuración',
  '/dashboard/configuracion/perfil': 'Perfil público',
  '/dashboard/configuracion/envios': 'Envíos',
  '/dashboard/configuracion/pagos': 'Pagos',
  '/dashboard/configuracion/notificaciones': 'Notificaciones',
  '/dashboard/configuracion/privacidad': 'Privacidad',
  '/dashboard/configuracion/idioma': 'Idioma y región',
  '/dashboard/security': 'Seguridad',
  '/dashboard/business': 'Mi negocio',
};

function getSubPageTitle(pathname: string): string {
  if (SUB_PAGE_TITLES[pathname]) return SUB_PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/products/') && pathname.endsWith('/edit')) return 'Editar producto';
  if (pathname.startsWith('/dashboard/orders/')) return 'Detalle del pedido';
  // Detalle de producto: /dashboard/products/[id] (no es create ni edit)
  if (
    pathname.startsWith('/dashboard/products/') &&
    !pathname.endsWith('/edit') &&
    pathname !== '/dashboard/products/create'
  ) return 'Detalle del producto';
  return '';
}

interface MobileTopBarProps {
  notificationCount?: number;
}

export function MobileTopBar({ notificationCount = 0 }: MobileTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!mounted) return null;

  const isRoot = isRootTab(pathname);
  const subTitle = getSubPageTitle(pathname);

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
            /* ── TABS RAÍZ: solo wordmark de marca ── */
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
              <span className="text-[17px] font-bold text-origen-bosque tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                origen.
              </span>
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

        {/* Zona derecha — campana de notificaciones (el perfil está en la BottomTabBar) */}
        <motion.div whileTap={{ scale: 0.82 }} className="flex-shrink-0">
          <Link
            href="/dashboard/notifications"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-origen-pradera/10 transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-foreground stroke-[1.8]" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-surface-alt" />
            )}
          </Link>
        </motion.div>

      </div>
    </header>
  );
}
