/**
 * @component ReviewStats
 * @description Estadísticas de reseñas — 4 KPIs en grid 2×2 (móvil) / 1×4 (desktop).
 */

'use client';

import { MessageSquare, Star, CheckCircle, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  const respondedCount = stats.total - stats.pending;

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      <SoftStatCard
        label="Total reseñas"
        value={stats.total}
        icon={MessageSquare}
        bg="from-origen-pradera/5 to-transparent"
        border="border-origen-pradera/10"
        iconColor="text-origen-pradera"
      />
      <SoftStatCard
        label="Valoración media"
        value={`${stats.averageRating.toFixed(1)}/5`}
        icon={Star}
        bg="from-amber-400/8 to-transparent"
        border="border-amber-200/60"
        iconColor="text-amber-500"
      />
      <SoftStatCard
        label="Respondidas"
        value={respondedCount}
        icon={CheckCircle}
        bg="from-origen-hoja/5 to-transparent"
        border="border-origen-hoja/10"
        iconColor="text-origen-hoja"
      />
      <SoftStatCard
        label="Útiles"
        value={stats.helpful}
        icon={ThumbsUp}
        bg="from-blue-400/8 to-transparent"
        border="border-blue-200/60"
        iconColor="text-blue-500"
      />
    </div>
  );
}
