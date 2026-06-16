'use client';

/**
 * @component ReviewStats
 * @description Bloque de estadísticas de la pantalla de reseñas.
 *
 * Layout:
 *   - Móvil: grid 2×2 con 4 KPIs compactos (StatGrid). ReviewSummary
 *     oculto en móvil — solo visible en desktop (≥lg).
 *   - Desktop (≥lg): fila combinada — ReviewSummary a la izquierda
 *     (ancho fijo 280px) + StatGrid a la derecha ocupando el resto.
 *
 * Paleta "Bosque Comercial" v5.5.
 */

import React from 'react';
import { MessageSquare, CheckCircle, ThumbsUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@/components/shared/StatGrid';
import { ReviewSummary } from '@arcediano/ux-library';
import type { StatGridItem } from '@/components/shared/StatGrid';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  const kpis: StatGridItem[] = [
    {
      label:   'Total reseñas',
      value:   stats.total,
      icon:    <MessageSquare />,
      variant: 'pradera',
    },
    {
      label:   'Pendientes',
      value:   stats.pending,
      icon:    <Star />,
      variant: 'mandarina',
    },
    {
      label:   'Respondidas',
      // respondidas = total - pending (las que ya tienen alguna acción tomada)
      value:   stats.total - stats.pending,
      icon:    <CheckCircle />,
      variant: 'hoja',
    },
    {
      label:   'Votos útiles',
      value:   stats.helpful,
      icon:    <ThumbsUp />,
      variant: 'bosque',
    },
  ];

  // Desglose por estrella para ReviewSummary
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: stats.byRating[s as keyof typeof stats.byRating] ?? 0,
  }));

  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-start lg:gap-6', className)}>
      {/* ── ReviewSummary: rating medio + barras de desglose ──
          Oculto en móvil — solo visible en desktop (≥lg).            */}
      <div className="hidden lg:block lg:w-[280px] lg:flex-shrink-0">
        <ReviewSummary
          average={stats.averageRating}
          total={stats.total}
          breakdown={breakdown}
          className="bg-surface-alt border border-border-subtle rounded-xl p-4"
        />
      </div>

      {/* ── StatGrid: 4 KPIs compactos — visible en todos los breakpoints ── */}
      <div className="flex-1 min-w-0">
        <StatGrid items={kpis} columns={4} />
      </div>
    </div>
  );
}
