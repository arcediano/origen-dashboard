/**
 * @component OrganicScoreBadge
 * @description Muestra el score orgánico [0–1] del producto como un badge con
 *              color semántico y tooltip explicativo.
 *
 * Niveles:
 *   ≥ 0.80  → Excelente  (verde pradera)
 *   ≥ 0.60  → Bueno      (verde hoja)
 *   ≥ 0.40  → Regular    (mandarina)
 *   < 0.40  → Bajo       (rojo sutil)
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { Leaf } from 'lucide-react';
import { Tooltip } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

interface OrganicScoreBadgeProps {
  score: number;             // [0, 1]
  showLabel?: boolean;       // mostrar texto "Orgánico" además del número
  size?: 'sm' | 'md';
  className?: string;
}

function getLevel(score: number) {
  if (score >= 0.8) return { label: 'Excelente', color: 'bg-origen-pradera/15 text-origen-pradera border-origen-pradera/30' };
  if (score >= 0.6) return { label: 'Bueno',     color: 'bg-origen-hoja/15 text-origen-hoja border-origen-hoja/30' };
  if (score >= 0.4) return { label: 'Regular',   color: 'bg-origen-mandarina/10 text-origen-mandarina border-origen-mandarina/30' };
  return               { label: 'Bajo',       color: 'bg-feedback-danger-subtle text-feedback-danger-text border-feedback-danger/30' };
}

export function OrganicScoreBadge({ score, showLabel = false, size = 'sm', className }: OrganicScoreBadgeProps) {
  const { label, color } = getLevel(score);
  const pct = Math.round(score * 100);

  return (
    <Tooltip
      content={`Score orgánico: ${pct}% — ${label}. Basado en rating, completitud del perfil, calidad de imagen, stock, antigüedad y ventas.`}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border font-semibold tabular-nums',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
          color,
          className,
        )}
      >
        <Leaf className={cn('shrink-0', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
        {showLabel && <span className="hidden sm:inline">{label}&nbsp;</span>}
        {pct}%
      </span>
    </Tooltip>
  );
}
