/**
 * @component ReviewResponseSheet
 * @description Bottom sheet para responder a reseñas en móvil.
 *              Solo visible en móvil (< lg). En desktop el formulario inline sigue en ReviewsList.
 *
 * Usa Sheet / SheetContent de @arcediano/ux-library.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Sheet, SheetContent, Textarea, Button } from '@arcediano/ux-library';
import { Send, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ReviewResponseSheetProps {
  isOpen:        boolean;
  onClose:       () => void;
  onSubmit:      (text: string) => void;
  reviewAuthor?: string;
  className?:    string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const MAX_CHARS = 500;

export function ReviewResponseSheet({
  isOpen,
  onClose,
  onSubmit,
  reviewAuthor,
  className,
}: ReviewResponseSheetProps) {
  const [text, setText] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus al abrir; limpiar al cerrar
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    } else {
      setText('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          'lg:hidden bg-surface p-0 rounded-t-3xl',
          'pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
          className,
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-origen-pino" />
            <span className="text-sm font-semibold text-origen-bosque">
              {reviewAuthor ? `Responder a ${reviewAuthor}` : 'Responder a la reseña'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-subtle hover:bg-surface-alt"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
        <div className="px-4 pt-4">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Escribe tu respuesta pública..."
            rows={4}
            maxLength={MAX_CHARS}
            className="mb-3"
          />

          {/* Contador */}
          <div className="flex justify-end mb-4">
            <span className={cn(
              'text-[11px]',
              text.length >= MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-text-subtle',
            )}>
              {text.length}/{MAX_CHARS}
            </span>
          </div>

          {/* Botón enviar */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!text.trim()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Publicar respuesta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
