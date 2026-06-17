/**
 * @component ReviewsList
 * @description Lista de reseñas en desktop — Cards estándar de la librería.
 *
 * Paleta "Bosque Comercial" v5.5. Cada Card muestra:
 *   - Cabecera: avatar, nombre, estrella prominente, badge de estado, fecha
 *   - Subtítulo: nombre del producto/productor (como Badge leaf enlazable)
 *   - Cuerpo: texto colapsable a 3 líneas
 *   - Respuesta del productor con separación visual clara
 *   - Footer: votos útil/no útil + acciones (Responder, Reportar)
 *
 * isLoading=true muestra N filas skeleton en lugar del overlay Spinner.
 */

'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Avatar, AvatarFallback, AvatarImage, StarRating, Textarea, EmptyState } from '@arcediano/ux-library';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@arcediano/ux-library';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Flag,
  Send,
  X,
  MessageCircle,
} from 'lucide-react';
import type { Review } from '@/types/review';

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

export interface ReviewsListProps {
  reviews: Review[];
  onRespond?: (reviewId: string, response: string) => void;
  onFlag?: (reviewId: string, reason?: string) => void;
  onHelpful?: (reviewId: string, helpful: boolean) => void;
  className?: string;
  /** Cuando true muestra filas skeleton en lugar de las reseñas */
  isLoading?: boolean;
  /** Nº de filas skeleton a mostrar (por defecto 5) */
  skeletonCount?: number;
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Review['status'],
  { variant: 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ElementType; label: string }
> = {
  approved: { variant: 'success', icon: CheckCircle, label: 'Aprobada' },
  pending:  { variant: 'warning', icon: Clock,       label: 'Pendiente' },
  rejected: { variant: 'danger',  icon: AlertCircle, label: 'Rechazada' },
  flagged:  { variant: 'danger',  icon: AlertCircle, label: 'Reportada' },
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function ReviewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy aria-label="Cargando reseñas">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border-subtle bg-surface-alt p-4 sm:p-5"
        >
          {/* Cabecera */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-origen-pastel/60 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 bg-origen-pastel rounded-lg w-1/4" />
                <div className="h-5 bg-origen-pastel/60 rounded-full w-20" />
              </div>
              <div className="h-3 bg-origen-pastel/60 rounded-lg w-2/5" />
            </div>
          </div>
          {/* Badge producto */}
          <div className="h-5 bg-origen-pastel/40 rounded-full w-1/3 mb-3" />
          {/* Rating + título */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 rounded bg-origen-pastel/60" />)}
            </div>
            <div className="h-4 bg-origen-pastel rounded-lg w-1/3" />
          </div>
          {/* Texto */}
          <div className="space-y-1.5 mb-4">
            <div className="h-3 bg-origen-pastel/40 rounded-lg w-full" />
            <div className="h-3 bg-origen-pastel/40 rounded-lg w-5/6" />
            <div className="h-3 bg-origen-pastel/40 rounded-lg w-4/6" />
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div className="flex gap-3">
              <div className="h-7 bg-origen-pastel/40 rounded-lg w-14" />
              <div className="h-7 bg-origen-pastel/40 rounded-lg w-14" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 bg-origen-pastel/40 rounded-lg w-24" />
              <div className="h-7 bg-origen-pastel/40 rounded-lg w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function ReviewsList({
  reviews,
  onRespond,
  onFlag,
  onHelpful,
  className,
  isLoading = false,
  skeletonCount = 5,
}: ReviewsListProps) {
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [respondingTo, setRespondingTo]   = useState<string | null>(null);
  const [responseText, setResponseText]   = useState('');
  const [showFlagDialog, setShowFlagDialog] = useState<string | null>(null);
  const [flagReason, setFlagReason]       = useState('');

  // ── Estado de carga — skeleton ────────────────────────────────────────────
  if (isLoading) {
    return <ReviewsListSkeleton count={skeletonCount} />;
  }

  // ── Estado vacío ──────────────────────────────────────────────────────────
  if (reviews.length === 0) {
    return (
      <Card className="bg-surface border border-border-subtle">
        <EmptyState
          size="sm"
          icon={<MessageSquare className="w-6 h-6" />}
          title="No hay reseñas"
          description="No se encontraron reseñas con los filtros seleccionados."
        />
      </Card>
    );
  }

  const handleSubmitResponse = (reviewId: string) => {
    if (responseText.trim() && onRespond) {
      onRespond(reviewId, responseText);
      setRespondingTo(null);
      setResponseText('');
    }
  };

  const handleSubmitFlag = (reviewId: string) => {
    if (onFlag) {
      onFlag(reviewId, flagReason || undefined);
      setShowFlagDialog(null);
      setFlagReason('');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {reviews.map((review) => {
        const statusCfg = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = statusCfg.icon;
        const isExpanded = expandedId === review.id;

        return (
          <Card
            key={review.id}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <div className="p-4 sm:p-5">
              {/* ── Cabecera: avatar + autor + meta ── */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={review.authorAvatar} alt={review.authorName} />
                    <AvatarFallback className="bg-origen-pastel text-origen-bosque text-sm font-semibold">
                      {review.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-origen-bosque truncate">
                        {review.authorName}
                      </span>
                      {review.verifiedPurchase && (
                        <Badge variant="success" size="xs" icon={<CheckCircle className="w-3 h-3" />}>
                          Compra verificada
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-subtle mt-0.5">
                      <span>{review.type === 'product' ? 'Reseña de producto' : 'Reseña de productor'}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={review.createdAt.toISOString()}>
                        {formatDistanceToNow(review.createdAt, { locale: es, addSuffix: true })}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Badge estado — esquina superior derecha */}
                <div className="flex-shrink-0">
                  <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon className="w-3 h-3" />}>
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>

              {/* ── Producto / productor enlazable ── */}
              <div className="mb-3">
                <Badge variant="leaf" size="sm">
                  {review.type === 'product' ? 'Producto:' : 'Productor:'}{' '}
                  <span className="font-semibold">{review.targetName}</span>
                </Badge>
              </div>

              {/* ── Rating prominente + título ── */}
              <div className="flex items-center gap-2.5 mb-2">
                <StarRating value={review.rating} readOnly size="sm" />
                <span className="text-sm font-semibold text-origen-bosque leading-snug">
                  {review.title}
                </span>
              </div>

              {/* ── Contenido colapsable ── */}
              <p className={cn(
                'text-sm text-text-subtle leading-relaxed mb-2',
                !isExpanded && review.content.length > 200 && 'line-clamp-3',
              )}>
                {review.content}
              </p>
              {review.content.length > 200 && (
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-origen-pradera hover:text-origen-hoja transition-colors mb-2"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}

              {/* ── Imágenes adjuntas ── */}
              {review.images && review.images.length > 0 && (
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                  {review.images.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-lg bg-origen-crema/50 border border-border-subtle flex items-center justify-center overflow-hidden flex-shrink-0"
                      aria-label={`Imagen ${idx + 1} de la reseña`}
                    >
                      {imgSrc.startsWith('http') ? (
                        <img src={imgSrc} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-text-subtle" aria-hidden />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Respuesta del productor ── */}
              {review.response && (
                <div className="mt-3 p-3 bg-origen-nube border border-origen-pradera/15 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-origen-pastel flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3 h-3 text-origen-pino" aria-hidden />
                    </div>
                    <span className="text-xs font-semibold text-origen-bosque">
                      {review.response.authorName}
                    </span>
                    <span className="text-[10px] text-text-subtle">
                      {formatDistanceToNow(review.response.createdAt, { locale: es, addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-text-subtle leading-relaxed pl-7">
                    {review.response.content}
                  </p>
                </div>
              )}

              {/* ── Formulario de respuesta inline ── */}
              {respondingTo === review.id && (
                <div className="mt-3 p-3.5 bg-origen-crema/40 rounded-xl border border-origen-pradera/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-origen-bosque">Responder a esta reseña</span>
                    <button
                      type="button"
                      onClick={() => { setRespondingTo(null); setResponseText(''); }}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-text-subtle hover:bg-surface hover:text-origen-bosque transition-colors"
                      aria-label="Cerrar formulario de respuesta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Escribe tu respuesta pública..."
                    className="min-h-[80px] mb-3 text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitResponse(review.id)}
                      disabled={!responseText.trim()}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Enviar respuesta
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Diálogo de reporte inline ── */}
              {showFlagDialog === review.id && (
                <div className="mt-3 p-3.5 bg-surface-alt rounded-xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-origen-cereza">Reportar reseña</span>
                    <button
                      type="button"
                      onClick={() => { setShowFlagDialog(null); setFlagReason(''); }}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-text-subtle hover:bg-surface-alt transition-colors"
                      aria-label="Cerrar diálogo de reporte"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-text-subtle mb-3">¿Por qué quieres reportar esta reseña?</p>
                  <Select value={flagReason} onValueChange={setFlagReason}>
                    <SelectTrigger className="mb-3 text-sm">
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inappropriate">Contenido inapropiado</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="fake">Reseña falsa</SelectItem>
                      <SelectItem value="offensive">Lenguaje ofensivo</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowFlagDialog(null); setFlagReason(''); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSubmitFlag(review.id)}
                      disabled={!flagReason}
                      leftIcon={<Flag className="w-4 h-4" />}
                    >
                      Reportar
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Footer: votos + acciones ── */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                {/* Votos útil / no útil */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-subtle" aria-label={`Útil: ${review.helpful} votos`}>
                    <ThumbsUp className="w-3.5 h-3.5" aria-hidden />
                    <span>{review.helpful}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-subtle" aria-label={`No útil: ${review.notHelpful} votos`}>
                    <ThumbsDown className="w-3.5 h-3.5" aria-hidden />
                    <span>{review.notHelpful}</span>
                  </span>
                </div>

                {/* Acciones contextuales */}
                <div className="flex items-center gap-2">
                  {!review.response && respondingTo !== review.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRespondingTo(review.id)}
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                    >
                      Responder
                    </Button>
                  )}
                  {showFlagDialog !== review.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowFlagDialog(review.id)}
                      leftIcon={<Flag className="w-3.5 h-3.5" />}
                      aria-label="Reportar esta reseña"
                    >
                      Reportar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
