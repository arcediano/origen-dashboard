/**
 * @component ReviewStats
 * @description Estadísticas de reseñas para usuarios
 * 
 * MÉTRICAS MOSTRADAS:
 * - Total reseñas
 * - Valoración media
 * - Reseñas con respuesta
 * - Reseñas útiles
 */

'use client';

import React from 'react';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  // Calcular métricas adicionales
  const respondedCount = stats.total - stats.pending; // Simplificación, en real sería un campo específico
  const helpfulPercentage = stats.total > 0 
    ? Math.round((stats.helpful / (stats.helpful + stats.notHelpful)) * 100) 
    : 0;

  const statsCards = [
    {
      label: 'Total reseñas',
      value: stats.total,
      icon: MessageSquare,
      color: 'pradera',
      bg: 'from-origen-pradera/5 to-transparent',
      border: 'border-origen-pradera/10',
      iconColor: 'text-origen-pradera'
    },
    {
      label: 'Valoración media',
      value: stats.averageRating.toFixed(1),
      unit: '/5',
      icon: Star,
      color: 'amber',
      bg: 'from-amber-50/50 to-transparent',
      border: 'border-amber-100',
      iconColor: 'text-amber-500',
      secondaryInfo: {
        label: 'de 5',
        value: ''
      }
    },
    {
      label: 'Respondidas',
      value: respondedCount,
      icon: CheckCircle,
      color: 'green',
      bg: 'from-green-50/50 to-transparent',
      border: 'border-green-100',
      iconColor: 'text-green-500',
      secondaryInfo: {
        label: 'con respuesta',
        value: stats.total > 0 ? `${Math.round((respondedCount / stats.total) * 100)}%` : '0%'
      }
    },
    {
      label: 'Útiles',
      value: stats.helpful,
      icon: ThumbsUp,
      color: 'blue',
      bg: 'from-blue-50/50 to-transparent',
      border: 'border-blue-100',
      iconColor: 'text-blue-500',
      secondaryInfo: {
        label: 'votos positivos',
        value: helpfulPercentage > 0 ? `${helpfulPercentage}%` : ''
      }
    }
  ];

  return (
    <div className={cn(
      'grid grid-cols-2 md:grid-cols-4 gap-4',
      className
    )}>
      {statsCards.map((card, index) => (
        <div
          key={index}
          className={cn(
            'p-4 rounded-xl bg-gradient-to-br',
            card.bg,
            'border',
            card.border
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <card.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', card.iconColor)} />
              <span className="text-xs font-medium text-text-subtle">{card.label}</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
            <p className="text-xl sm:text-2xl font-bold text-origen-bosque">
              {card.value}
            </p>
            {card.unit && (
              <span className="text-xs text-text-subtle">{card.unit}</span>
            )}
          </div>
          
          {card.secondaryInfo && (
            <div className="flex items-center gap-1 mt-2 text-xs text-text-subtle">
              <TrendingUp className="w-3 h-3 text-text-subtle" />
              <span>{card.secondaryInfo.value}</span>
              <span>{card.secondaryInfo.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}