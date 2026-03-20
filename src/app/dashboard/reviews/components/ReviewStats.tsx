'use client';

import { MessageSquare, Star, CheckCircle, ThumbsUp } from 'lucide-react';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4${className ? ` ${className}` : ''}`}>
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
        bg="from-amber-400/10 to-transparent"
        border="border-amber-200/50"
        iconColor="text-amber-500"
      />
      <SoftStatCard
        label="Respondidas"
        value={stats.total - stats.pending}
        icon={CheckCircle}
        bg="from-origen-hoja/5 to-transparent"
        border="border-origen-hoja/10"
        iconColor="text-origen-hoja"
      />
      <SoftStatCard
        label="Útiles"
        value={stats.helpful}
        icon={ThumbsUp}
        bg="from-blue-400/10 to-transparent"
        border="border-blue-200/50"
        iconColor="text-blue-500"
      />
    </div>
  );
}
