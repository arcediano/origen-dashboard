// 📁 /src/app/dashboard/components/header/DashboardHeader.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';
import { getDashboardPageTitle, getDashboardSectionLabel } from '@/constants/sidebar';
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

  const pageTitle = getDashboardPageTitle(pathname);
  const sectionLabel = getDashboardSectionLabel(pathname);

  const handleLogout = () => {
    // La lógica de logout (API call + redirect) está en UserMenu
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 transition-all duration-300',
      isScrolled 
        ? 'bg-surface-alt/90 backdrop-blur-xl border-b border-border shadow-md' 
        : 'bg-surface-alt/75 backdrop-blur-md border-b border-border-subtle'
    )}>
      <div className="flex items-center justify-between gap-6 px-6 lg:px-8 min-h-[76px]">
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

        <div className="flex items-center gap-3 flex-shrink-0 py-4">
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