/**
 * @component BottomTabBar
 * @description Barra de navegación inferior — floating island con FAB central elevado.
 * Diseño premium: isla flotante con sombra, botón central tipo FAB con gradiente, active pill.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  User,
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  matchPaths?: string[];
  isCentral?: boolean;
}

const TABS: Tab[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: LayoutDashboard,
    href: '/dashboard',
    matchPaths: ['/dashboard'],
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: Package,
    href: '/dashboard/products',
    matchPaths: ['/dashboard/products', '/dashboard/inventario'],
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ShoppingBag,
    href: '/dashboard/orders',
    badge: 3,
    matchPaths: ['/dashboard/orders'],
    isCentral: true,
  },
  {
    id: 'resenas',
    label: 'Reseñas',
    icon: Star,
    href: '/dashboard/reviews',
    badge: 4,
    matchPaths: ['/dashboard/reviews'],
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    href: '/dashboard/profile',
    matchPaths: ['/dashboard/profile', '/dashboard/configuracion', '/dashboard/security'],
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isActive = (tab: Tab) => {
    if (tab.matchPaths) {
      return tab.matchPaths.some(p =>
        p === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(p)
      );
    }
    return pathname === tab.href;
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex justify-center items-end px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
    >
      {/* ── Floating island ── */}
      <div className={cn(
        'relative flex items-center w-full max-w-[360px]',
        'bg-surface-alt/96 backdrop-blur-2xl',
        'rounded-[28px]',
        'border border-white/60',
        'shadow-[0_10px_40px_rgba(27,67,50,0.18),0_2px_8px_rgba(27,67,50,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]',
        'h-[62px]',
      )}>

        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          /* ── TAB CENTRAL (FAB elevado) ── */
          if (tab.isCentral) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-end pb-1 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.86 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  {/* FAB pill — elevado por encima de la isla */}
                  <motion.div
                    animate={{
                      y: active ? -18 : -14,
                      boxShadow: active
                        ? '0 8px 24px rgba(27,67,50,0.45)'
                        : '0 4px 16px rgba(27,67,50,0.30)',
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className={cn(
                      'relative w-[54px] h-[54px] rounded-[16px] flex items-center justify-center',
                      active
                        ? 'bg-gradient-to-br from-origen-bosque via-origen-pino to-origen-hoja'
                        : 'bg-gradient-to-br from-origen-pino to-origen-bosque',
                    )}
                  >
                    {/* Brillo interior */}
                    <div className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/20 to-transparent" />

                    <motion.div
                      animate={{ rotate: active ? 0 : 0, scale: active ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      <Icon className="w-6 h-6 text-white stroke-[2.2] relative z-10" />
                    </motion.div>

                    {/* Badge */}
                    {tab.badge && tab.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-origen-menta border-2 border-surface-alt flex items-center justify-center shadow-sm"
                      >
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </motion.span>
                    )}
                  </motion.div>

                  {/* Label */}
                  <span className={cn(
                    'text-[10px] font-semibold leading-none transition-colors duration-200',
                    active ? 'text-origen-bosque' : 'text-text-subtle'
                  )}>
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            );
          }

          /* ── TABS NORMALES ── */
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex-1 flex items-center justify-center h-full relative"
            >
              <motion.div
                whileTap={{ scale: 0.80 }}
                transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                className="flex flex-col items-center gap-0.5 relative px-1"
              >
                {/* Active pill background */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="tabActivePill"
                      className="absolute -inset-x-3 -inset-y-1 rounded-2xl bg-origen-bosque/8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className="relative">
                  <motion.div
                    animate={{ y: active ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  >
                    <Icon className={cn(
                      'w-[22px] h-[22px] transition-all duration-200 relative z-10',
                      active
                        ? 'text-origen-bosque stroke-[2.3]'
                        : 'text-text-subtle stroke-[1.6]',
                    )} />
                  </motion.div>

                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full text-[8px] font-bold text-white bg-origen-menta flex items-center justify-center shadow-sm"
                    >
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-[10px] leading-none transition-all duration-200 relative z-10',
                  active ? 'font-semibold text-origen-bosque' : 'font-medium text-text-subtle'
                )}>
                  {tab.label}
                </span>
              </motion.div>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
