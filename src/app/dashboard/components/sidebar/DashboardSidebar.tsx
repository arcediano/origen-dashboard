/**
 * @component DashboardSidebar
 * @description Navegación principal del dashboard, unificada para desktop y móvil.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@arcediano/ux-library';
import { HelpCircle, Leaf, LogOut, X } from 'lucide-react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { DASHBOARD_NAV_SECTIONS } from '@/constants/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/api/auth';

interface DashboardSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({ isMobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const router = useRouter();
  const { clearUser, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleItemClick = () => {
    onMobileClose?.();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // El logout local debe continuar aunque falle la llamada al gateway.
    } finally {
      clearUser();
      router.replace('/auth/login');
    }
  };

  if (!mounted) return null;

  const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Tu cuenta';
  const userEmail = user?.email ?? 'productor@origen.es';
  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'OR';

  const navSections = (
    <>
      {DASHBOARD_NAV_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-2">
          <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <SidebarMenuItem key={item.id} {...item} onItemClick={handleItemClick} />
            ))}
          </div>
        </section>
      ))}
    </>
  );

  const footer = (
    <div className="border-t border-border-subtle p-3">
      <Link
        href="/ayuda"
        onClick={handleItemClick}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-all hover:bg-surface"
      >
        <HelpCircle className="h-5 w-5 text-text-subtle" />
        <span>Ayuda</span>
      </Link>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
      >
        <LogOut className="h-5 w-5" />
        <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
      </button>
    </div>
  );

  if (isMobileOpen) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />

        <motion.aside
          initial={{ x: -360 }}
          animate={{ x: 0 }}
          exit={{ x: -360 }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="fixed left-0 top-0 z-50 flex h-full w-[calc(100vw-1rem)] max-w-[22rem] flex-col bg-surface-alt shadow-2xl lg:hidden"
        >
          <div className="border-b border-border-subtle px-5 pb-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
            <div className="mb-5 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={handleItemClick}>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-bosque via-origen-pino to-origen-hoja shadow-md">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="block text-base font-semibold text-origen-bosque">origen.</span>
                  <span className="block text-[11px] font-medium text-muted-foreground">Panel del productor</span>
                </div>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={onMobileClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera to-origen-hoja text-sm font-semibold text-white shadow-sm">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-origen-bosque">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">{navSections}</nav>
          {footer}
        </motion.aside>
      </>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border-subtle bg-surface-alt/95 backdrop-blur-xl shadow-xl lg:flex">
      <div className="border-b border-border-subtle px-5 py-6">
        <Link href="/dashboard" className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-bosque via-origen-pino to-origen-hoja shadow-md">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-lg font-semibold text-origen-bosque">origen.</span>
            <span className="block text-xs font-medium text-muted-foreground">Panel del productor</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">{navSections}</nav>
      {footer}
    </aside>
  );
}
