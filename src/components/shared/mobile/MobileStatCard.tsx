/**
 * @component MobileStatCard
 * @description Tarjeta KPI compacta para vista en grid 2×N en móvil.
 *              Diseñada para caber en grid-cols-2 sin desbordar en iPhone SE (375px).
 *
 * Tokens Origen v3.0: fuentes, colores semánticos, bordes suaves.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type StatCardAccent =
  | 'pradera'   // verde menta — métricas positivas
  | 'bosque'    // verde oscuro — total/primario
  | 'amber'     // ámbar — advertencias / stock bajo
  | 'red'       // rojo — errores / cancelados
  | 'blue'      // azul — información
  | 'green';    // verde intenso — entregados

export interface MobileStatCardProps {
  label:        string;
  value:        string | number;
  icon:         React.ElementType;
  accent?:      StatCardAccent;
  /** Info secundaria, ej: "12% este mes" */
  secondary?:   string;
  /** Clase adicional */
  className?:   string;
  /** Estado de carga — muestra skeleton */
  isLoading?:   boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ACCENT_MAP: Record<StatCardAccent, { icon: string; border: string; bg: string }> = {
  pradera: { icon: 'text-origen-pradera',  border: 'border-l-origen-pradera',  bg: 'from-origen-pradera/5 to-transparent'  },
  bosque:  { icon: 'text-origen-bosque',   border: 'border-l-origen-bosque',   bg: 'from-origen-bosque/5 to-transparent'   },
  amber:   { icon: 'text-amber-500',       border: 'border-l-amber-400',       bg: 'from-amber-50/50 to-transparent'       },
  red:     { icon: 'text-red-500',         border: 'border-l-red-400',         bg: 'from-red-50/50 to-transparent'         },
  blue:    { icon: 'text-blue-500',        border: 'border-l-blue-400',        bg: 'from-blue-50/50 to-transparent'        },
  green:   { icon: 'text-green-500',       border: 'border-l-green-400',       bg: 'from-green-50/50 to-transparent'       },
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-3 rounded-xl border border-border-subtle border-l-4 border-l-border-subtle animate-pulse">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-4 h-4 rounded bg-gray-200" />
        <div className="w-16 h-3 rounded bg-gray-200" />
      </div>
      <div className="w-12 h-5 rounded bg-gray-200" />
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Tarjeta KPI compacta diseñada para grid de 2 columnas en móvil.
 * - Icono pequeño + etiqueta en fila
 * - Valor en `text-lg font-bold` (evita overflow en 2 cols)
 * - Info secundaria opcional en `text-[11px]`
 * - Acento de color izquierdo `border-l-4`
 */
export function MobileStatCard({
  label,
  value,
  icon: Icon,
  accent = 'pradera',
  secondary,
  className,
  isLoading = false,
}: MobileStatCardProps) {
  if (isLoading) return <Skeleton />;

  const styles = ACCENT_MAP[accent];

  return (
    <div
      className={cn(
        'p-3 rounded-xl bg-gradient-to-br',
        styles.bg,
        'border border-border-subtle border-l-4',
        styles.border,
        className,
      )}
    >
      {/* Icono + etiqueta */}
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('w-4 h-4 flex-shrink-0', styles.icon)} />
        <span className="text-[11px] font-medium text-text-subtle leading-tight truncate">
          {label}
        </span>
      </div>

      {/* Valor */}
      <p className="text-lg font-bold text-origen-bosque leading-none">
        {value}
      </p>

      {/* Info secundaria */}
      {secondary && (
        <p className="text-[11px] text-text-subtle mt-1 truncate">{secondary}</p>
      )}
    </div>
  );
}
