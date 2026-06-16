/**
 * @component ReviewCard
 * @description Celda de lista nativa para reseñas en móvil (< lg).
 *
 * Diseño tipo "lista nativa" (iOS/Android):
 *   Línea 1: avatar + nombre + estrellas + badge de estado (todo en una fila)
 *   Línea 2: nombre del producto (texto secundario con acento de marca)
 *   Línea 3: extracto del texto (2 líneas, truncado)
 *   Línea 4: fecha + acción
 *   Separador visual entre celdas (border-b)
 *
 * Swipe actions: Responder + Reportar.
 * ReviewResponseSheet para responder (bottom sheet).
 *
 * Paleta "Bosque Comercial" v5.5.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
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
import { Avatar, AvatarFallback, AvatarImage } from '@arcediano/ux-library';
import { StarRating } from '@arcediano/ux-library';
import type { Review } from '@/types/review';
import { ReviewResponseSheet } from './ReviewResponseSheet';
import { SwipeableRow } from '@/components/shared/mobile';

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Review['status'],
  { label: string; icon: React.ElementType; cls: string }
> = {
  pending:  { label: 'Pendiente',  icon: Clock,        cls: 'bg-amber-50 text-amber-700 border-amber-300' },
  approved: { label: 'Aprobada',   icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-300' },
  rejected: { label: 'Rechazada',  icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-300' },
  flagged:  { label: 'Reportada',  icon: AlertCircle,  cls: 'bg-red-50 text-red-700 border-red-300' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: Review['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0',
        cfg.cls,
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden />
      {cfg.label}
    </span>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

export function ReviewCardSkeleton() {
  return (
    <div className="px-4 py-3.5 border-b border-border-subtle last:border-0 animate-pulse">
      {/* Línea 1: avatar + nombre + estado */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-origen-pastel/60 flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between gap-2">
          <div className="h-3.5 bg-origen-pastel rounded-lg w-1/3" />
          <div className="h-4 bg-origen-pastel/60 rounded-full w-16" />
        </div>
      </div>
      {/* Línea 2: estrellas + producto */}
      <div className="flex items-center gap-2 mb-2 ml-10.5">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(s => <div key={s} className="w-3 h-3 rounded bg-origen-pastel/60" />)}
        </div>
        <div className="h-2.5 bg-origen-pastel/50 rounded-lg w-28" />
      </div>
      {/* Línea 3-4: texto */}
      <div className="ml-10.5 space-y-1.5">
        <div className="h-2.5 bg-origen-pastel/40 rounded-lg w-full" />
        <div className="h-2.5 bg-origen-pastel/40 rounded-lg w-4/5" />
      </div>
      {/* Línea 5: fecha + acción */}
      <div className="flex items-center justify-between mt-3 ml-10.5">
        <div className="h-2.5 bg-origen-pastel/30 rounded-lg w-24" />
        <div className="h-6 bg-origen-pastel/40 rounded-lg w-20" />
      </div>
    </div>
  );
}

// ─── COMPONENTE ────────────────────────────────────────────────────────────────

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
      <SwipeableRow
        actions={swipeActions}
        className="border-b border-border-subtle last:border-0"
      >
        <motion.div
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn('px-4 py-3.5', className)}
        >
          {/* ── Fila 1: Avatar + nombre + badge estado ── */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={review.authorAvatar} alt={review.authorName} />
              <AvatarFallback className="bg-origen-pastel text-origen-bosque text-xs font-semibold">
                {review.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="text-sm font-semibold text-origen-bosque truncate">
                {review.authorName}
              </span>
              <StatusChip status={review.status} />
            </div>
          </div>

          {/* ── Fila 2: Estrellas + producto (indentado con el avatar) ── */}
          <div className="ml-[calc(2rem+10px)] flex items-center gap-2 mb-2">
            <StarRating value={review.rating} readOnly size="xs" />
            <span className="text-[10px] text-text-subtle truncate">
              {review.type === 'product' ? 'Producto: ' : 'Productor: '}
              <span className="text-origen-pino font-medium">{review.targetName}</span>
            </span>
          </div>

          {/* ── Fila 3: Título + texto (indentado) ── */}
          <div className="ml-[calc(2rem+10px)]">
            <p className="text-xs font-medium text-origen-bosque mb-1 leading-snug">
              {review.title}
            </p>
            <p className={cn(
              'text-xs text-text-subtle leading-relaxed',
              !expanded && isLong && 'line-clamp-2',
            )}>
              {review.content}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[11px] text-origen-pradera mt-1"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Ver menos</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Ver más</>
                )}
              </button>
            )}

            {/* ── Respuesta existente ── */}
            {review.response && (
              <div className="mt-2 pl-3 border-l-2 border-origen-pradera/30 bg-origen-nube/60 rounded-r-lg py-1.5">
                <p className="text-[10px] font-semibold text-origen-bosque mb-0.5">
                  {review.response.authorName}
                </p>
                <p className="text-[11px] text-text-subtle line-clamp-2">
                  {review.response.content}
                </p>
              </div>
            )}

            {/* ── Fila 4: Fecha + botón de acción ── */}
            <div className="flex items-center justify-between mt-3">
              <time
                dateTime={review.createdAt.toISOString()}
                className="text-[10px] text-text-disabled"
              >
                {timeAgo}
              </time>
              {!review.response && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-origen-pastel text-origen-bosque text-xs font-medium active:scale-95 transition-transform"
                >
                  <MessageSquare className="w-3.5 h-3.5" aria-hidden />
                  Responder
                </button>
              )}
            </div>
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
