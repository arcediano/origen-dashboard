/**
 * @component ReviewCard
 * @description Tarjeta compacta de reseña para lista móvil.
 *              Avatar pequeño, rating inline con nombre, respuesta colapsada.
 *              Usa ReviewResponseSheet para responder en móvil.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
import type { Review } from '@/types/review';
import { ReviewResponseSheet } from './ReviewResponseSheet';
import { SwipeableRow } from '@/components/shared/mobile';

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Review['status'],
  { label: string; icon: React.ElementType; cls: string }
> = {
  pending:  { label: 'Pendiente',  icon: Clock,       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Aprobada',   icon: CheckCircle2,cls: 'bg-origen-pastel text-origen-bosque border-origen-pradera/30' },
  rejected: { label: 'Rechazada',  icon: XCircle,     cls: 'bg-red-50 text-red-700 border-red-200' },
  flagged:  { label: 'Reportada',  icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'w-3 h-3',
            s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
          )}
        />
      ))}
    </span>
  );
}

function StatusChip({ status }: { status: Review['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        cfg.cls,
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export interface ReviewCardProps {
  review:    Review;
  onRespond?: (reviewId: string, text: string) => void;
  onFlag?:    (reviewId: string) => void;
  className?: string;
}

export function ReviewCard({ review, onRespond, onFlag, className }: ReviewCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const isLong = review.content.length > 150;

  const timeAgo = formatDistanceToNow(review.createdAt, {
    locale: es,
    addSuffix: true,
  });

  const swipeActions = [
    ...(!review.response ? [{
      label:   'Responder',
      icon:    MessageSquare,
      color:   'bosque' as const,
      onPress: () => setSheetOpen(true),
    }] : []),
    {
      label:   'Reportar',
      icon:    Flag,
      color:   'red' as const,
      onPress: () => onFlag?.(review.id),
    },
  ];

  return (
    <>
      <SwipeableRow actions={swipeActions} className="border-b border-border-subtle last:border-0">
      <motion.div
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'px-4 py-3.5',
          className,
        )}
      >
        {/* Fila 1: Avatar + nombre + rating + estado */}
        <div className="flex items-start gap-2.5 mb-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={review.authorAvatar} alt={review.authorName} />
            <AvatarFallback className="bg-origen-pastel text-origen-bosque text-xs font-semibold">
              {review.authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-origen-bosque truncate">
                {review.authorName}
              </span>
              <StatusChip status={review.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} />
              <span className="text-[10px] text-text-subtle">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Título + target */}
        <p className="text-xs font-medium text-origen-bosque mb-1">{review.title}</p>
        <p className="text-[10px] text-text-subtle mb-2 truncate">
          {review.type === 'product' ? 'Producto: ' : 'Productor: '}
          <span className="text-origen-pino">{review.targetName}</span>
        </p>

        {/* Contenido */}
        <p className={cn('text-xs text-text-subtle leading-relaxed', !expanded && isLong && 'line-clamp-2')}>
          {review.content}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[11px] text-origen-pradera mt-1"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> Ver menos</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Ver más</>
            )}
          </button>
        )}

        {/* Respuesta existente */}
        {review.response && (
          <div className="mt-2.5 pl-3 border-l-2 border-origen-pradera/30">
            <p className="text-[10px] font-medium text-origen-bosque mb-0.5">
              {review.response.authorName}
            </p>
            <p className="text-[11px] text-text-subtle line-clamp-2">
              {review.response.content}
            </p>
          </div>
        )}

        {/* Hint swipe + acciones rápidas */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-text-disabled select-none">← desliza para acciones</span>
          {!review.response && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-origen-pastel text-origen-bosque text-xs font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Responder
            </button>
          )}
        </div>
      </motion.div>
      </SwipeableRow>

      {/* Bottom sheet — solo móvil */}
      <ReviewResponseSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(text) => onRespond?.(review.id, text)}
        reviewAuthor={review.authorName}
      />
    </>
  );
}
