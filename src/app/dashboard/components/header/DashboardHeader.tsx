// 📁 /src/app/dashboard/components/header/DashboardHeader.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';
import { useAuth } from '@/contexts/AuthContext';

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

  const handleLogout = () => {
    // La lógica de logout (API call + redirect) está en UserMenu
  };

  return (
    <>
      {/* Skip link — teclado y lectores de pantalla */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface focus:text-origen-bosque focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-origen-pradera focus:outline-none"
      >
        Saltar al contenido principal
      </a>
      <header className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        isScrolled
          ? 'bg-surface-alt/95 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-surface-alt/85 backdrop-blur-md border-b border-border-subtle'
      )} aria-label="Cabecera del dashboard">
      <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 flex-1 py-5">
            <div className="min-w-0 overflow-hidden">
              <DashboardBreadcrumb />
            </div>
          </div>
        </div>

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
    </header>    </>  );
}