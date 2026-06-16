'use client';

/**
 * @component ReviewHeader
 * @description Cabecera de la pantalla de reseñas: ReviewSummary a la izquierda
 * (280px fijo) + 4 KPIs en grid 2×2 a la derecha.
 *
 * Desktop (≥lg): fila horizontal — summary izquierda, stats derecha.
 * Móvil (<lg): solo el grid 2×2 de stats (ReviewSummary oculto).
 *
 * Paleta "Bosque Comercial" v5.5.
 */

import React from 'react';
import { MessageSquare, CheckCircle, ThumbsUp, Star } from 'lucide-react';
import { ReviewSummary } from '@arcediano/ux-library';
import { StatGrid } from '@/components/shared/StatGrid';
import type { StatGridItem } from '@/components/shared/StatGrid';
import type { ReviewStats } from '@/types/review';

interface ReviewHeaderProps {
  stats: ReviewStats;
  className?: string;
}

export function ReviewHeader({ stats, className }: ReviewHeaderProps) {
  const kpis: StatGridItem[] = [
    { label: 'Total reseñas', value: stats.total,                      icon: <MessageSquare />, variant: 'pradera'   },
    { label: 'Pendientes',    value: stats.pending,                    icon: <Star />,          variant: 'mandarina' },
    { label: 'Respondidas',   value: stats.total - stats.pending,      icon: <CheckCircle />,   variant: 'hoja'      },
    { label: 'Votos útiles',  value: stats.helpful,                    icon: <ThumbsUp />,      variant: 'bosque'    },
  ];

  const breakdown = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: stats.byRating[s as keyof typeof stats.byRating] ?? 0,
  }));

  return (
    <div className={`flex flex-col lg:flex-row lg:items-start lg:gap-6 ${className ?? ''}`}>
      {/* ReviewSummary — solo desktop, ocupa 50% */}
      <div className="hidden lg:block lg:w-1/2">
        <ReviewSummary
          average={stats.averageRating}
          total={stats.total}
          breakdown={breakdown}
          className="bg-surface-alt border border-border-subtle rounded-xl p-4"
        />
      </div>

      {/* 4 KPIs en grid 2×2 — siempre visible, ocupa 50% en desktop */}
      <div className="w-full lg:w-1/2">
        <StatGrid items={kpis} columns={2} />
      </div>
    </div>
  );
}
