// 📁 /src/app/dashboard/components/header/HeaderLogo.tsx
'use client';

import Link from 'next/link';

export function HeaderLogo() {
  return (
    <div className="lg:hidden flex items-center">
      <Link href="/dashboard" aria-label="Origen — Inicio del dashboard" className="text-base font-semibold text-[#1B4332]">
        origen.
      </Link>
    </div>
  );
}