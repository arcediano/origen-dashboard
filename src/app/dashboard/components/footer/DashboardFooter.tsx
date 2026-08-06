/**
 * @component DashboardFooter
 * @description Pie de página mínimo del dashboard — copyright, versión, enlaces
 * legales y estado del sistema. Sin métricas de marketing ni trust signals
 * (R8: "Footer de aplicación: solo legal, copyright y versión").
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'mt-auto border-t border-border-subtle bg-surface-alt',
        className
      )}
    >
      <div className="px-4 py-3 lg:px-8 lg:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Copyright + versión */}
        <p className="text-[11px] lg:text-xs text-text-subtle">
          © {currentYear} Origen · v2.0
        </p>

        {/* Enlaces legales */}
        <div className="flex items-center gap-4">
          <Link href="/privacidad" className="text-[11px] lg:text-xs text-text-subtle hover:text-origen-pradera transition-colors">
            Privacidad
          </Link>
          <Link href="/terminos" className="text-[11px] lg:text-xs text-text-subtle hover:text-origen-pradera transition-colors">
            Términos
          </Link>
          <Link href="/cookies" className="text-[11px] lg:text-xs text-text-subtle hover:text-origen-pradera transition-colors">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
