/**
 * @component AiFollowUpQuestions
 * @description Preguntas de seguimiento del asistente de IA: tras preparar el
 * borrador, si quedan campos de producción/dietéticos que no pudo determinar,
 * se las pregunta al productor una a una (opción única o texto libre) antes
 * de pasar a la revisión final — así la ficha de revisión llega ya completa.
 * Responder es siempre opcional: se puede saltar cada pregunta o cerrar el
 * diálogo para continuar con lo que ya se haya respondido.
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, HelpCircle, SkipForward } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import type { FollowUpField, FollowUpQuestion } from '@/lib/ai-assist/product-draft';

export interface AiFollowUpQuestionsProps {
  open: boolean;
  questions: FollowUpQuestion[];
  /** Solo incluye los campos respondidos; lo saltado no aparece. */
  onComplete: (answers: Partial<Record<FollowUpField, string>>) => void;
}

export function AiFollowUpQuestions({ open, questions, onComplete }: AiFollowUpQuestionsProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<FollowUpField, string>>>({});
  const [textValue, setTextValue] = useState('');

  // Cada tanda de preguntas (un nuevo borrador) empieza de cero.
  useEffect(() => {
    if (open) {
      setIndex(0);
      setAnswers({});
      setTextValue('');
    }
  }, [open, questions]);

  if (!open || questions.length === 0) return null;

  const question = questions[index];
  const isLast = index === questions.length - 1;

  const advance = (value?: string) => {
    const next = value === undefined ? answers : { ...answers, [question.field]: value };
    if (isLast) {
      onComplete(next);
    } else {
      setAnswers(next);
      setIndex((i) => i + 1);
      setTextValue('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onComplete(answers); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
            <DialogTitle>Un par de detalles más</DialogTitle>
          </div>
          <DialogDescription>
            Pregunta {index + 1} de {questions.length} — así la ficha queda completa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <p className="text-base font-medium text-origen-bosque">{question.question}</p>

          {question.type === 'single_choice' ? (
            <div className="flex gap-2">
              {(question.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => advance(opt)}
                  className={cn(
                    'flex-1 rounded-xl border-2 border-border-subtle bg-surface-alt px-4 py-3',
                    'text-sm font-semibold text-origen-bosque transition-colors',
                    'hover:border-origen-pradera hover:bg-origen-pradera/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <Textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="min-h-[90px]"
              autoFocus
            />
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => advance(undefined)}
            leftIcon={<SkipForward className="h-4 w-4" aria-hidden="true" />}
          >
            Saltar
          </Button>
          {question.type === 'text' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!textValue.trim()}
              onClick={() => advance(textValue.trim())}
              rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
            >
              {isLast ? 'Terminar' : 'Siguiente'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
