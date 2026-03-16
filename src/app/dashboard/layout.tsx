/**
 * @layout DashboardLayout
 * @description Layout principal con banner flotante ultra compacto y gestión optimizada de autenticación
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/app/dashboard/components/sidebar/DashboardSidebar';
import { DashboardHeader } from '@/app/dashboard/components/header/DashboardHeader';
// import { StatusBanner } from '@/components/shared/status/StatusBanner';
import { SessionExpiredModal } from '@/components/features/auth/components/session-expired-modal';
import { cn } from '@/lib/utils';
import { type SellerStatus } from '@/types/seller';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

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

  // Debug: Log del estado de autenticación
  useEffect(() => {
    console.log('[DashboardLayout] Estado auth:', {
      isLoading: authLoading,
      isAuthenticated,
      isProducer,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [authLoading, isAuthenticated, isProducer, user]);

  // Redirigir si no es productor (después de verificar que está autenticado)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isProducer) {
      console.log('[DashboardLayout] Redirigiendo a login - no es productor');
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
          <p className="text-sm text-gray-600">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;
  if (!isAuthenticated || !isProducer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF5] via-white to-[#F0F7F0]">
      <SessionExpiredModal isOpen={sessionExpired} />
      <DashboardSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <main className={cn(
        "transition-all duration-300",
        !isMobile && "lg:ml-64"
      )}>
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* BANNER FLOTANTE ULTRA COMPACTO */}
        {/* <StatusBanner
          status={MOCK_PRODUCER_STATUS.status}
          details={MOCK_PRODUCER_STATUS.details}
          dismissible={true}
        /> */}

        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
