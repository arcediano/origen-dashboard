/**
 * @file PageHeader.tsx
 * @description Cabecera de página reutilizable - VERSIÓN REDISEÑADA
 */

'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badgeIcon?: React.ElementType;
  badgeText?: string;
  tooltip?: string;
  tooltipDetailed?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  containerClassName?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  showBackButton = false,
  onBack,
  className,
  containerClassName,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('relative', className)}>

      <div className={cn('container mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6', containerClassName)}>
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="mt-0.5 hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-alt text-text-subtle transition-colors hover:border-origen-pradera hover:bg-origen-pradera/5 hover:text-origen-pradera lg:inline-flex"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-semibold leading-tight text-origen-bosque sm:text-[26px] lg:text-[32px]">
                {title}
              </h1>
            {description && (
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {description}
                </p>
            )}
            </div>
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}

