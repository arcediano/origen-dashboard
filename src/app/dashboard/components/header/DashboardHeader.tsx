// 📁 /src/app/dashboard/components/header/DashboardHeader.tsx
'use client';

import * as React from 'react'; // AÑADIR
import { useState, useEffect } from 'react'; // AÑADIR
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MobileMenu } from './MobileMenu';
import { HeaderLogo } from './HeaderLogo';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  userAvatar?: string;
}

export function DashboardHeader({ 
  onMenuClick, 
  userName = 'María Martínez',
  userEmail = 'maria@origen.es',
  userInitials = 'MM',
  userAvatar
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para obtener el título de la página basado en la ruta
  const getPageTitle = (path: string): string => {
    if (path.includes('/profile/business')) return 'Mi Negocio';
    if (path.includes('/profile/settings')) return 'Configuración';
    if (path.includes('/profile/certifications')) return 'Certificaciones';
    if (path.includes('/profile')) return 'Mi Perfil';
    if (path.includes('/products')) return 'Mis Productos';
    if (path.includes('/orders')) return 'Pedidos';
    return 'Dashboard';
  };

  const handleLogout = () => {
    // La lógica de logout (API call + redirect) está en UserMenu
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 transition-all duration-300',
      isScrolled 
        ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-md' 
        : 'bg-white/50 backdrop-blur-sm border-b border-gray-100'
    )}>
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        {/* Zona Izquierda: Menú móvil + Breadcrumb + Título */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <MobileMenu onClick={onMenuClick!} />
          <div className="hidden lg:block">
            <HeaderLogo />
          </div>
          <div className="flex flex-col min-w-0">
            {/* Breadcrumb para desktop */}
            <div className="hidden md:block">
              <DashboardBreadcrumb />
            </div>
            {/* Título de página para móvil (cuando no hay breadcrumb) */}
            <h1 className="md:hidden text-lg font-semibold text-origen-bosque truncate">
              {getPageTitle(pathname)}
            </h1>
          </div>
        </div>

        {/* Zona Derecha: Notificaciones y Usuario */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <NotificationBell />
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            userAvatar={userAvatar}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}