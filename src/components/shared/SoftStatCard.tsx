/**
 * @component SoftStatCard
 * @description Tarjeta KPI de tono suave — fondo translúcido con borde sutil.
 *
 * Mismo lenguaje visual que las tarjetas de la sección de reseñas:
 * gradiente muy tenue, borde casi invisible, icono con color sin relleno intenso.
 */

'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SoftStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Clases Tailwind del fondo (bg-gradient-to-br + colores) */
  bg: string;
  /** Clase del borde  */
  border: string;
  /** Clase del color del icono */
  iconColor: string;
  className?: string;
}

export function SoftStatCard({
  label,
  value,
  icon: Icon,
  bg,
  border,
  iconColor,
  className,
}: SoftStatCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-gradient-to-br border',
        bg,
        border,
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />
        <span className="text-xs font-medium text-text-subtle leading-tight">{label}</span>
      </div>
      <p className="text-2xl font-bold text-origen-bosque tabular-nums leading-none">{value}</p>
    </div>
  );
}
