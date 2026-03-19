'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientación de la línea separadora */
  orientation?: 'horizontal' | 'vertical';
  /** Si es puramente decorativo (no semántico) */
  decorative?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Línea separadora visual. No requiere Radix UI — es un div estilizado.
 *
 * @example
 * <Separator />
 * <Separator orientation="vertical" className="h-6" />
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  ),
);

Separator.displayName = 'Separator';

export { Separator };
