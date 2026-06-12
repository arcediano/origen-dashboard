/**
 * @component BottomTabBar
 * @description Barra de navegación inferior — ancho completo (edge-to-edge) con FAB central elevado.
 * Usa UXMobileBottomNav con variant="default" y central: true.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav as UXMobileBottomNav, type MobileBottomNavItem } from '@arcediano/ux-library';
import { MOBILE_ROOT_TABS, matchesNavigationItem } from '@/constants/sidebar';

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionBarOpen, setActionBarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Esconder la barra cuando el FilterBottomSheet esté abierto
  useEffect(() => {
    const handler = (e: Event) => {
      setFilterOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener('filter-sheet:toggle', handler);
    return () => window.removeEventListener('filter-sheet:toggle', handler);
  }, []);

  // Esconder la barra cuando una página tiene su propia barra de acciones contextual
  useEffect(() => {
    const handler = (e: Event) => {
      setActionBarOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener('page-action-bar:toggle', handler);
    return () => window.removeEventListener('page-action-bar:toggle', handler);
  }, []);

  if (!mounted) return null;

  const isActive = (tab: (typeof MOBILE_ROOT_TABS)[number]) => matchesNavigationItem(pathname, { matchPaths: tab.matchPaths });

  // Construir items para UXMobileBottomNav
  const items: MobileBottomNavItem[] = MOBILE_ROOT_TABS.map((tab) => {
    const Icon = tab.icon;
    return {
      id: tab.id,
      label: tab.label,
      icon: <Icon className="w-[22px] h-[22px]" />,
      badge: tab.badge && tab.badge > 0 ? tab.badge : undefined,
      central: tab.isCentral ? true : undefined,
    };
  });

  // Calcular activeId
  const activeId = MOBILE_ROOT_TABS.find(isActive)?.id;

  // onValueChange: navegar sin usar href
  const handleValueChange = (id: string) => {
    const tab = MOBILE_ROOT_TABS.find(t => t.id === id);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <AnimatePresence>
    {!filterOpen && !actionBarOpen && (
    <motion.div
      key="bottom-tab-bar"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-end"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
    >
      <UXMobileBottomNav
        items={items}
        activeId={activeId}
        onValueChange={handleValueChange}
        variant="default"
        fixed={false}
      />
    </motion.div>
    )}
    </AnimatePresence>
  );
}
