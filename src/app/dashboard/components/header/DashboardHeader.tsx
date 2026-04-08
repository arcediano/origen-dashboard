// 📁 /src/app/dashboard/components/header/DashboardHeader.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';
import { getDashboardPageTitle, getDashboardSectionLabel } from '@/constants/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ShoppingBag } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  userAvatar?: string;
}

export function DashboardHeader({ 
  onMenuClick: _onMenuClick,
  userName = 'María Martínez',
  userEmail = 'maria@origen.es',
  userInitials = 'MM',
  userAvatar
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resolvedName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    }
    return userName;
  }, [user?.firstName, user?.lastName, userName]);

  const resolvedEmail = user?.email ?? userEmail;
  const resolvedInitials = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || userInitials;
    }
    return userInitials;
  }, [user?.firstName, user?.lastName, userInitials]);

  const pageTitle = getDashboardPageTitle(pathname);
  const sectionLabel = getDashboardSectionLabel(pathname);

  const handleLogout = () => {
    // La lógica de logout (API call + redirect) está en UserMenu
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 transition-all duration-300',
      isScrolled 
        ? 'bg-surface-alt/95 backdrop-blur-xl border-b border-border shadow-sm' 
        : 'bg-surface-alt/85 backdrop-blur-md border-b border-border-subtle'
    )} role="banner" aria-label="Cabecera del dashboard">
      <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 flex-1 py-4">
            <div className="mb-1 hidden md:block">
              <DashboardBreadcrumb />
            </div>
            <div className="min-w-0">
              {sectionLabel && (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {sectionLabel}
                </p>
              )}
              <h1 className="truncate text-lg font-semibold text-origen-bosque">
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 xl:flex" aria-label="Accesos rápidos del dashboard">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-medium text-origen-bosque transition-colors hover:bg-origen-crema/50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Pedidos
          </Link>
          <Link
            href="/dashboard/products/create"
            className="inline-flex items-center gap-2 rounded-xl bg-origen-bosque px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-origen-pino"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo producto
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 py-4">
          <NotificationBell />
          <UserMenu
            userName={resolvedName}
            userEmail={resolvedEmail}
            userInitials={resolvedInitials}
            userAvatar={userAvatar}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}