/**
 * @layout DashboardLayout
 * @description Layout principal con banner flotante ultra compacto
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/app/dashboard/components/sidebar/DashboardSidebar';
import { DashboardHeader } from '@/app/dashboard/components/header/DashboardHeader';
import { StatusBanner } from '@/components/shared/status/StatusBanner';
import { cn } from '@/lib/utils';
import { type SellerStatus } from '@/types/seller';
import { getCurrentUser } from '@/lib/api/auth';

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
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user.role !== 'PRODUCER') {
          router.replace('/auth/login');
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.replace('/auth/login'));
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [authorized]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF5] via-white to-[#F0F7F0]">
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
        <StatusBanner 
          status={MOCK_PRODUCER_STATUS.status}
          details={MOCK_PRODUCER_STATUS.details}
          dismissible={true}
        />
        
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}