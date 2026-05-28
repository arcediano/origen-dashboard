'use client';

import { MessageSquare, Star, CheckCircle, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatGrid } from '@/components/shared/StatGrid';
import type { StatGridItem } from '@/components/shared/StatGrid';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  const items: StatGridItem[] = [
    { label: 'Total reseñas',    value: stats.total,                          icon: <MessageSquare />, variant: 'pradera' },
    { label: 'Valoración media', value: `${stats.averageRating.toFixed(1)}/5`, icon: <Star />,          variant: 'mandarina' },
    { label: 'Respondidas',      value: stats.total - stats.pending,           icon: <CheckCircle />,   variant: 'hoja' },
    { label: 'Útiles',           value: stats.helpful,                         icon: <ThumbsUp />,      variant: 'bosque' },
  ];

  return <StatGrid items={items} columns={4} className={cn(className)} />;
}

