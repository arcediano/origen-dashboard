/**
 * @component MobileTopBar
 * @description Header nativo para móvil — blurred, con safe-area, acciones contextuales.
 * Se muestra solo en pantallas < lg. Sustituye el DashboardHeader en móvil.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, ChevronLeft, Leaf } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/atoms/avatar';
import { useAuth } from '@/contexts/AuthContext';

// Mapa de títulos por ruta
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/dashboard/products': 'Productos',
  '/dashboard/products/create': 'Nuevo producto',
  '/dashboard/orders': 'Pedidos',
  '/dashboard/reviews': 'Reseñas',
  '/dashboard/profile': 'Mi perfil',
  '/dashboard/profile/personal': 'Datos personales',
  '/dashboard/profile/business': 'Mi negocio',
  '/dashboard/profile/settings': 'Ajustes',
  '/dashboard/profile/certifications': 'Certificaciones',
  '/dashboard/notifications': 'Notificaciones',
  '/dashboard/configuracion': 'Configuración',
  '/dashboard/security': 'Seguridad',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Rutas dinámicas
  if (pathname.startsWith('/dashboard/products/') && pathname.endsWith('/edit')) return 'Editar producto';
  if (pathname.startsWith('/dashboard/orders/')) return 'Detalle del pedido';
  return 'Dashboard';
}

function isRootTab(pathname: string): boolean {
  const rootTabs = ['/dashboard', '/dashboard/products', '/dashboard/orders', '/dashboard/reviews', '/dashboard/profile'];
  return rootTabs.some(t => pathname === t);
}

interface MobileTopBarProps {
  notificationCount?: number;
}

export function MobileTopBar({ notificationCount = 0 }: MobileTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!mounted) return null;

  const isRoot = isRootTab(pathname);
  const title = getPageTitle(pathname);
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'P';

  return (
    <header
      className={cn(
        'lg:hidden fixed top-0 inset-x-0 z-40',
        'transition-all duration-200',
        scrolled
          ? 'bg-surface-alt/90 backdrop-blur-xl shadow-sm border-b border-border-subtle'
          : 'bg-surface-alt/70 backdrop-blur-md',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center h-14 px-4 gap-3">

        {/* Botón atrás — solo en páginas de detalle */}
        {!isRoot ? (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => router.back()}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-surface hover:bg-origen-pradera/10 transition-colors',
              'text-origen-bosque flex-shrink-0',
            )}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        ) : (
          /* Logo en tabs raíz */
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-origen-bosque to-origen-pino flex-shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Título */}
        <div className="flex-1 min-w-0">
          <motion.h1
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'font-semibold truncate',
              isRoot ? 'text-base text-origen-bosque' : 'text-sm text-foreground',
            )}
          >
            {title}
          </motion.h1>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bell */}
          <motion.div whileTap={{ scale: 0.85 }}>
            <Link
              href="/dashboard/notifications"
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-origen-pradera/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground stroke-[1.8]" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-origen-menta" />
              )}
            </Link>
          </motion.div>

          {/* Avatar */}
          <motion.div whileTap={{ scale: 0.85 }}>
            <Link href="/dashboard/profile">
              <Avatar className="w-8 h-8 ring-2 ring-origen-pradera/30">
                <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
