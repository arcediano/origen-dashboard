// 📁 /src/app/dashboard/components/header/DashboardBreadcrumb.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { getDashboardBreadcrumbs } from '@/constants/sidebar';

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-origen-pradera transition-colors"
            aria-label="Ir al inicio del dashboard"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </Link>
        </li>
        {breadcrumbs.slice(1).map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-text-subtle mx-1" />
            {index === breadcrumbs.slice(1).length - 1 ? (
              <span className="font-medium text-origen-bosque" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="text-muted-foreground hover:text-origen-pradera transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}