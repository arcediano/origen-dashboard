'use client';

/**
 * @component ReviewStats
 * @description Bloque de estadísticas de la pantalla de reseñas.
 *
 * Layout:
 *   - Mobile: grid 2×2 con StatGrid (4 KPIs compactos) + ReviewSummary
 *     con desglose de estrellas en formato vertical debajo
 *   - Desktop (≥lg): fila combinada — ReviewSummary a la izquierda (ancho
 *     fijo ~280px) + StatGrid a la derecha ocupando el resto
 *
 * Paleta "Bosque Comercial" v5.5.
 */

import React from 'react';
import { MessageSquare, CheckCircle, ThumbsUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid, ReviewSummary } from '@arcediano/ux-library';
import type { StatGridItem } from '@arcediano/ux-library';
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
      // respondidas = aprobadas + rechazadas + reportadas − pending (las que
      // ya tienen alguna acción tomada). Se aproxima como total - pending.
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
    <div className={cn('space-y-4 lg:space-y-0 lg:flex lg:items-start lg:gap-6', className)}>
      {/* ── ReviewSummary: rating medio + barras de desglose ── */}
      <div className="lg:w-[280px] lg:flex-shrink-0">
        <ReviewSummary
          average={stats.averageRating}
          total={stats.total}
          breakdown={breakdown}
          className="bg-surface-alt border border-border-subtle rounded-xl p-4"
        />
      </div>

      {/* ── StatGrid: 4 KPIs compactos ── */}
      <div className="flex-1">
        <StatGrid items={kpis} columns={4} className="h-full" />
      </div>
    </div>
  );
}
