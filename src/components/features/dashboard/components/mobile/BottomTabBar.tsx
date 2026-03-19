/**
 * @component BottomTabBar
 * @description Barra de navegación inferior nativa para móvil
 * Patrón iOS/Android: 5 tabs fijos, badge de notificaciones, active state animado.
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
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-50',
        'bg-surface-alt/95 backdrop-blur-xl',
        'border-t border-border-subtle',
        'shadow-[0_-4px_24px_rgba(27,67,50,0.08)]',
        // Safe area para iPhone X+
        'pb-safe',
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex-1 relative"
              onMouseDown={() => setPressedTab(tab.id)}
              onMouseUp={() => setPressedTab(null)}
              onTouchStart={() => setPressedTab(tab.id)}
              onTouchEnd={() => setPressedTab(null)}
            >
              <motion.div
                animate={{
                  scale: pressedTab === tab.id ? 0.88 : 1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex flex-col items-center justify-center h-full gap-0.5 pt-1"
              >
                {/* Active pill indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="bottomTabActivePill"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-origen-bosque"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container with active background */}
                <div className="relative">
                  <motion.div
                    animate={{
                      backgroundColor: active ? 'hsl(var(--bosque) / 0.08)' : 'transparent',
                    }}
                    className="w-10 h-6 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-all duration-200',
                        active
                          ? 'text-origen-bosque stroke-[2.5px]'
                          : 'text-text-subtle stroke-[1.5px]'
                      )}
                    />
                  </motion.div>

                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'absolute -top-1 -right-1',
                        'min-w-[16px] h-4 px-1',
                        'rounded-full text-[9px] font-bold text-white',
                        'flex items-center justify-center',
                        'bg-origen-menta shadow-sm',
                      )}
                    >
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none transition-all duration-200',
                    active ? 'text-origen-bosque' : 'text-text-subtle'
                  )}
                >
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
