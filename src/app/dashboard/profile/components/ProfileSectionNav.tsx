'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const PROFILE_NAV_ITEMS = [
  { href: '/dashboard/profile/personal', label: 'Datos personales' },
  { href: '/dashboard/profile/business', label: 'Negocio' },
  { href: '/dashboard/profile/certifications', label: 'Certificaciones' },
] as const;

interface ProfileSectionNavProps {
  className?: string;
}

export function ProfileSectionNav({ className }: ProfileSectionNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de perfil comercial"
      className={cn('grid grid-cols-3 gap-2 sm:flex sm:flex-nowrap sm:overflow-x-auto sm:scrollbar-none sm:pb-1', className)}
    >
      {PROFILE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-xl border px-2.5 py-2 text-center text-[12px] leading-tight font-semibold transition-colors sm:px-3 sm:text-sm',
              isActive
                ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                : 'border-border-subtle bg-surface text-text-subtle hover:border-origen-pradera/40 hover:text-origen-bosque'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
