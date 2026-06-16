'use client';

/**
 * @component ReviewKPIs
 * @description Cuatro KPIs compactos de la cabecera de la pantalla de reseñas.
 * Extraído de ReviewStats (eliminado). Paleta "Bosque Comercial" v5.5.
 */

import React from 'react';
import { MessageSquare, CheckCircle, ThumbsUp, Star } from 'lucide-react';
import { StatGrid } from '@/components/shared/StatGrid';
import type { StatGridItem } from '@/components/shared/StatGrid';
import type { ReviewStats } from '@/types/review';

interface ReviewKPIsProps {
  stats: ReviewStats;
  className?: string;
}

export function ReviewKPIs({ stats, className }: ReviewKPIsProps) {
  const kpis: StatGridItem[] = [
    { label: 'Total reseñas', value: stats.total, icon: <MessageSquare />, variant: 'pradera' },
    { label: 'Pendientes', value: stats.pending, icon: <Star />, variant: 'mandarina' },
    { label: 'Respondidas', value: stats.total - stats.pending, icon: <CheckCircle />, variant: 'hoja' },
    { label: 'Votos útiles', value: stats.helpful, icon: <ThumbsUp />, variant: 'bosque' },
  ];
  return <StatGrid items={kpis} columns={4} className={className} />;
}
