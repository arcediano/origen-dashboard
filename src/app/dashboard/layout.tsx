/**
 * @layout DashboardLayout
 * @description Layout principal con banner flotante ultra compacto y gestión optimizada de autenticación
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/app/dashboard/components/sidebar/DashboardSidebar';
import { DashboardHeader } from '@/app/dashboard/components/header/DashboardHeader';
import { BottomTabBar, MobileTopBar, MobilePageTransition } from '@/components/features/dashboard/components/mobile';
import { SessionExpiredModal } from '@/components/features/auth/components/session-expired-modal';
import { cn } from '@/lib/utils';
import { type SellerStatus } from '@/types/seller';
import { useAuth } from '@/contexts/AuthContext';

// Datos mock - @todo: GET /api/producer/status
const MOCK_PRODUCER_STATUS = {
  status: 'pending_verification' as SellerStatus,
  details: {
    documentsVerified: 3,
    totalDocuments: 7,
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContentWrapper>{children}</DashboardContentWrapper>;
}

function DashboardContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { isAuthenticated, isProducer, isLoading: authLoading, user } = useAuth();

  const buildLoginRedirectUrl = () => {
    if (typeof window === 'undefined') return '/auth/login';

    const rawNotice = window.sessionStorage.getItem('auth:logout-notice');
    if (!rawNotice) return '/auth/login';

    try {
      const parsed = JSON.parse(rawNotice) as { reason?: string; message?: string };
      if (!parsed?.reason || !parsed?.message) return '/auth/login';
      return `/auth/login?reason=${encodeURIComponent(parsed.reason)}&message=${encodeURIComponent(parsed.message)}`;
    } catch {
      return '/auth/login';
    }
  };

  // Debug: Log del estado de autenticación (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DashboardLayout] Estado auth:', {
        isLoading: authLoading,
        isAuthenticated,
        isProducer,
        userRole: user?.role,
        userId: user?.id,
      });
    }
  }, [authLoading, isAuthenticated, isProducer, user]);

  // Redirigir si no está autenticado o no es productor (después de verificar que la carga terminó)
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // BUG FIX: antes solo se redirigía si isAuthenticated && !isProducer,
      // dejando a usuarios no autenticados con pantalla en blanco.
      router.replace(buildLoginRedirectUrl());
      return;
    }

    if (!isProducer) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DashboardLayout] Redirigiendo a login - no es productor');
      }
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, isProducer, router]);

  // Manejar evento de sesión expirada
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleExpired = () => setSessionExpired(true);
    window.addEventListener('session:expired', handleExpired);
    return () => window.removeEventListener('session:expired', handleExpired);
  }, [isAuthenticated]);

  // Inicializar responsive y montar componente
  useEffect(() => {
    if (!isAuthenticated || !isProducer) return;
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isAuthenticated, isProducer]);

  // Mostrar spinner mientras se valida la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAF5] via-white to-[#F0F7F0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-origen-bosque border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;
  if (!isAuthenticated || !isProducer) return null;

  return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-alt to-surface">
      <SessionExpiredModal isOpen={sessionExpired} />

      {/* Sidebar — solo desktop */}
      <DashboardSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Header desktop */}
      <div className="hidden lg:ml-72 lg:block">
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>

      {/* Header móvil nativo */}
      <MobileTopBar onMenuOpen={() => setIsMobileMenuOpen(true)} />

      <main className={cn(
        "transition-all duration-300",
        // Desktop: desplazar por sidebar
        !isMobile && "lg:ml-72",
        // Mobile: espacio para header fijo (56px) y barra flotante (72px + safe-area + margen)
        isMobile && "pt-14 pb-[calc(88px+env(safe-area-inset-bottom))]"
      )}>
        <MobilePageTransition>
          <div className="w-full">
            {children}
          </div>
        </MobilePageTransition>
      </main>

      {/* Bottom tab bar — solo móvil */}
      <BottomTabBar />
    </div>
  );
}
