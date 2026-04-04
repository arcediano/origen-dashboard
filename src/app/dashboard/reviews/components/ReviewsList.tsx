/**
 * @component ReviewsList
 * @description Lista de reseñas con diseño de tarjetas
 */

'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
import { Textarea } from '@/components/ui/atoms/textarea';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Flag,
  Send,
  X
} from 'lucide-react';
import type { Review } from '@/types/review';

interface ReviewsListProps {
  reviews: Review[];
  onRespond?: (reviewId: string, response: string) => void;
  onFlag?: (reviewId: string, reason?: string) => void;
  onHelpful?: (reviewId: string, helpful: boolean) => void;
  className?: string;
}

export function ReviewsList({
  reviews,
  onRespond,
  onFlag,
  onHelpful,
  className
}: ReviewsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showFlagDialog, setShowFlagDialog] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const getStatusBadge = (status: Review['status']) => {
    const config = {
      pending: { variant: 'warning' as const, icon: Clock, label: 'Pendiente' },
      approved: { variant: 'success' as const, icon: CheckCircle, label: 'Aprobada' },
      rejected: { variant: 'danger' as const, icon: AlertCircle, label: 'Rechazada' },
      flagged: { variant: 'danger' as const, icon: AlertCircle, label: 'Reportada' }
    };
    const { variant, icon: Icon, label } = config[status];
    return <Badge variant={variant} icon={<Icon className="w-3 h-3" />}>{label}</Badge>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'
            )}
          />
        ))}
      </div>
    );
  };

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

  if (reviews.length === 0) {
    return (
      <Card className="py-8 sm:p-12 text-center">
        <div className="flex flex-col items-center">
          <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-text-disabled mb-3 sm:mb-4" />
          <h3 className="text-lg font-semibold text-origen-bosque mb-2">
            No hay reseñas
          </h3>
          <p className="text-sm text-text-subtle">
            No se encontraron reseñas con los filtros seleccionados.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {reviews.map((review) => (
        <Card key={review.id} variant="elevated" className="p-4 sm:p-5">
          {/* Cabecera */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.authorAvatar} alt={review.authorName} />
                <AvatarFallback className="bg-origen-crema text-origen-bosque text-sm font-medium">
                  {review.authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info autor */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-origen-bosque">
                    {review.authorName}
                  </span>
                  {review.verifiedPurchase && (
                    <Badge variant="success" size="xs" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Compra verificada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-subtle mt-1">
                  <span>Reseña de {review.type === 'product' ? 'producto' : 'productor'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(review.createdAt, { locale: es, addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2">
              {getStatusBadge(review.status)}
            </div>
          </div>

          {/* Target (producto/productor) */}
          <div className="mb-3">
            <Badge variant="leaf" size="sm">
              {review.type === 'product' ? 'Producto:' : 'Productor:'} {review.targetName}
            </Badge>
          </div>

          {/* Rating y título */}
          <div className="flex items-center gap-3 mb-2">
            {renderStars(review.rating)}
            <span className="font-semibold text-origen-bosque">{review.title}</span>
          </div>

          {/* Contenido */}
          <p className={cn(
            'text-sm text-text-subtle mb-3',
            expandedId !== review.id && 'line-clamp-3'
          )}>
            {review.content}
          </p>

          {/* Botón ver más */}
          {review.content.length > 200 && (
            <button
              onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
              className="text-xs text-origen-pradera hover:text-origen-hoja mb-3"
            >
              {expandedId === review.id ? 'Ver menos' : 'Ver más'}
            </button>
          )}

          {/* Imágenes */}
          {review.images && review.images.length > 0 && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
              {review.images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 rounded-lg bg-origen-crema flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  <ImageIcon className="w-6 h-6 text-text-subtle" />
                </div>
              ))}
            </div>
          )}

          {/* Respuesta existente */}
          {review.response && (
            <div className="mt-3 pl-4 border-l-2 border-origen-pradera/30">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-3 h-3 text-origen-pradera" />
                <span className="text-xs font-medium text-origen-bosque">
                  {review.response.authorName}
                </span>
                <span className="text-[10px] text-text-subtle">
                  {formatDistanceToNow(review.response.createdAt, { locale: es, addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{review.response.content}</p>
            </div>
          )}

          {/* Formulario de respuesta */}
          {respondingTo === review.id && (
            <div className="mt-4 p-4 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-origen-bosque">Responder a esta reseña</span>
                <button
                  onClick={() => {
                    setRespondingTo(null);
                    setResponseText('');
                  }}
                  className="text-text-subtle hover:text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="min-h-[80px] mb-3"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSubmitResponse(review.id)}
                  disabled={!responseText.trim()}
                >
                  <span>
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Enviar respuesta
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Diálogo de reporte */}
          {showFlagDialog === review.id && (
            <div className="mt-4 p-4 bg-feedback-danger-subtle/50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-600">Reportar reseña</span>
                <button
                  onClick={() => {
                    setShowFlagDialog(null);
                    setFlagReason('');
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                ¿Por qué quieres reportar esta reseña?
              </p>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full p-2 text-sm border border-border rounded-lg mb-3"
              >
                <option value="">Selecciona un motivo</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="spam">Spam</option>
                <option value="fake">Reseña falsa</option>
                <option value="offensive">Lenguaje ofensivo</option>
                <option value="other">Otro</option>
              </select>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowFlagDialog(null);
                    setFlagReason('');
                  }}
                >
                  <span>
                    <span className="flex items-center gap-2">
                      Cancelar
                    </span>
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleSubmitFlag(review.id)}
                  disabled={!flagReason}
                >
                  <span>
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Reportar
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Footer con acciones - CON ESTRUCTURA CORREGIDA */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onHelpful?.(review.id, true)}
              >
                <span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{review.helpful}</span>
                  </span>
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onHelpful?.(review.id, false)}
              >
                <span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{review.notHelpful}</span>
                  </span>
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {!review.response && respondingTo !== review.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRespondingTo(review.id)}
                >
                  <span>
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Responder
                    </span>
                  </span>
                </Button>
              )}
              {showFlagDialog !== review.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFlagDialog(review.id)}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <span>
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Reportar
                    </span>
                  </span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}