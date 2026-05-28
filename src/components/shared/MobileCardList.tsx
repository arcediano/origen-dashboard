/**
 * @file MobileCardList.tsx
 * @description Named wrapper para listas de tarjetas en mobile.
 * Encapsula el estilo canónico del dashboard (rounded-2xl, border-border-subtle,
 * bg-surface-alt, shadow-subtle) evitando que se repita en cada sección.
 *
 * @migration Cuando @arcediano/ux-library >= 0.2.17 esté instalado, reemplazar
 * por: import { MobileCardList } from '@arcediano/ux-library';
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileCardListProps {
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  skeletonCount?: number;
  renderSkeleton?: () => React.ReactNode;
}

export function MobileCardList({
  children,
  className,
  isLoading = false,
  skeletonCount = 5,
  renderSkeleton,
}: MobileCardListProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-subtle',
        className,
      )}
      aria-busy={isLoading || undefined}
    >
      {isLoading && renderSkeleton
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
          ))
        : children}
    </div>
  );
}
