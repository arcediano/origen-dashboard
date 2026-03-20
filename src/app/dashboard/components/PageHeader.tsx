/**
 * @file PageHeader.tsx
 * @description Cabecera de página reutilizable - VERSIÓN REDISEÑADA
 */

'use client';

import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/atoms/tooltip';

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
  badgeIcon: BadgeIcon,
  badgeText,
  tooltip,
  tooltipDetailed,
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

      {/* ── MÓVIL: header compacto estilo app (< lg) ── */}
      <div className="lg:hidden px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          {/* Izquierda: botón atrás + título */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-alt border border-border-subtle flex-shrink-0 active:opacity-70 transition-opacity"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-origen-bosque" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] leading-snug font-bold text-origen-bosque truncate">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
              )}
            </div>
          </div>
          {/* Derecha: acciones */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </div>
      </div>

      {/* ── DESKTOP: header decorativo completo (≥ lg) ── */}
      <div className="hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-b from-origen-pradera/[0.02] to-transparent pointer-events-none" />
        <div className={cn('relative container mx-auto px-6 py-8 sm:py-10', containerClassName)}>
          {/* Fila superior: badge + acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            {(BadgeIcon || badgeText) && (
              <div className="inline-flex items-center gap-2 bg-surface-alt px-4 py-2 rounded-full border border-origen-pradera/20 shadow-sm">
                {BadgeIcon && (
                  <div className="w-6 h-6 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                    <BadgeIcon className="w-3.5 h-3.5 text-origen-pradera" />
                  </div>
                )}
                {badgeText && (
                  <span className="text-sm font-medium text-origen-bosque">{badgeText}</span>
                )}
                {tooltip && tooltipDetailed && (
                  <Tooltip content={tooltip} detailed={tooltipDetailed} size="sm" />
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
          {/* Fila principal: título + botón volver */}
          <div className="flex items-start gap-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-alt border border-border hover:border-origen-pradera hover:bg-origen-pradera/5 transition-all shadow-sm hover:shadow-md group"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-text-subtle group-hover:text-origen-pradera transition-colors" />
              </button>
            )}
            <div className="flex-1">
              <div className="relative inline-block">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-origen-bosque leading-tight">{title}</h1>
              </div>
              {description && (
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}