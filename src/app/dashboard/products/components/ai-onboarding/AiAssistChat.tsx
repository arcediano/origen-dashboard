/**
 * @component AiAssistChat
 * @description Chat conversacional "Origen Assist" (rediseño 2026-10-26):
 * sustituye al formulario de una sola pantalla (`AiProductIntake`) por una
 * conversación turno a turno. Cada turno es un POST a
 * `/ai-assist/conversation` (inicio) o `/ai-assist/conversation/:id/message`
 * (siguientes), sin streaming ni WebSockets -- cada respuesta del asistente
 * llega completa. Cuando el asistente llama a `finalizar_borrador`, la
 * respuesta tiene la misma forma que `ProductDraftResponse` (ver
 * `lib/ai-assist/conversation.ts`), así que `onDraftReady` se integra con el
 * resto del flujo (`draftToPatches`, `AiProductReview`) sin cambios.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronRight, Loader2, Send, Sparkles, SkipForward, X } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Textarea,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { resizeLabelImage } from '@/lib/ai-assist/resize-label-image';
import { AiAssistError, postConversationMessage, startConversation } from '@/lib/api/ai-assist';
import type { ConversationQuestion, ConversationTurnResponse } from '@/lib/ai-assist/conversation';
import type { ProductDraftResponse } from '@/lib/ai-assist/product-draft';
import {
  AUTONOMOUS_COMMUNITY_CODES,
  AUTONOMOUS_COMMUNITY_NAMES,
  autonomousCommunityFlagSrc,
} from '@/lib/constants/autonomous-community';
import { AddCreditsModal } from './AddCreditsModal';
import { AiCreditsPanel } from './AiCreditsPanel';

const MAX_FILE_MB = 10;

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
}

export interface AiAssistChatDraftReady {
  response: ProductDraftResponse;
  /** La última foto de producto subida en el chat (para size/type al guardar). */
  productPhoto: File | null;
}

interface AiAssistChatProps {
  quota: { used: number; total: number; free?: number; purchased?: number } | null;
  onDraftReady: (result: AiAssistChatDraftReady) => void;
  onManual: () => void;
  onCreditsPurchased?: () => void;
}

function friendlyError(error: unknown): string {
  if (error instanceof AiAssistError) {
    switch (error.code) {
      case 'AI_PRODUCER_QUOTA_EXCEEDED':
        return 'Has alcanzado el máximo de productos con asistente de IA. Compra más créditos para seguir usándolo, o rellena este producto a mano.';
      case 'AI_MONTHLY_CAP_REACHED':
      case 'AI_DISABLED':
      case 'AI_NOT_CONFIGURED':
        return 'El asistente no está disponible ahora mismo. Puedes crear el producto rellenándolo a mano.';
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : 'El asistente no ha podido responder.';
}

/** Respuesta inline a una pregunta de cierre pendiente -- mismos controles por tipo que `AiFollowUpQuestions`, sin modal. */
function PendingQuestionAnswer({
  question,
  disabled,
  onAnswer,
  onSkip,
}: {
  question: ConversationQuestion;
  disabled: boolean;
  onAnswer: (value: string) => void;
  onSkip: () => void;
}) {
  const [textValue, setTextValue] = useState('');

  if (question.field === 'originRegion') {
    return (
      <div className="space-y-2">
        <Select onValueChange={onAnswer} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar comunidad autónoma" />
          </SelectTrigger>
          <SelectContent>
            {AUTONOMOUS_COMMUNITY_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <img
                    src={autonomousCommunityFlagSrc(code)}
                    alt=""
                    className="h-4 w-6 rounded-sm object-cover shrink-0"
                  />
                  {AUTONOMOUS_COMMUNITY_NAMES[code]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onSkip} leftIcon={<SkipForward className="h-4 w-4" aria-hidden="true" />}>
          Saltar
        </Button>
      </div>
    );
  }

  if (question.type === 'single_choice') {
    return (
      <div className="flex flex-wrap gap-2">
        {(question.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(opt)}
            className={cn(
              'rounded-xl border-2 border-border-subtle bg-surface-alt px-4 py-2',
              'text-sm font-semibold text-origen-bosque transition-colors',
              'hover:border-origen-pradera hover:bg-origen-pradera/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
            )}
          >
            {opt}
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onSkip} leftIcon={<SkipForward className="h-4 w-4" aria-hidden="true" />}>
          Saltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder="Escribe tu respuesta..."
        className="min-h-[70px]"
        disabled={disabled}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || !textValue.trim()}
          onClick={() => onAnswer(textValue.trim())}
          rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
        >
          Responder
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onSkip} leftIcon={<SkipForward className="h-4 w-4" aria-hidden="true" />}>
          Saltar
        </Button>
      </div>
    </div>
  );
}

export function AiAssistChat({ quota, onDraftReady, onManual, onCreditsPurchased }: AiAssistChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      text: 'Hola, soy Origen Assist. Sube una foto de tu producto y cuéntame qué es -- con eso preparo la ficha completa para que la revises.',
    },
  ]);
  const [pendingQuestion, setPendingQuestion] = useState<ConversationQuestion | null>(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [lastProductPhoto, setLastProductPhoto] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quotaExhausted = !!quota && quota.used >= quota.total;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, pendingQuestion]);

  const handlePhoto = (list: FileList | null) => {
    const file = list?.[0];
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG o WebP).');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`La imagen supera los ${MAX_FILE_MB} MB. Prueba con otra.`);
      return;
    }
    setError(null);
    setPhoto(file);
  };

  const handleResult = (result: ConversationTurnResponse, userTurn: ChatTurn) => {
    setTurns((prev) => [...prev, userTurn, { role: 'assistant', text: result.text }]);
    if (result.kind === 'question') {
      setPendingQuestion(result.question);
    } else {
      setPendingQuestion(null);
      if (result.kind === 'draft_ready') {
        onDraftReady({ response: result, productPhoto: lastProductPhoto });
      }
    }
  };

  const send = async (input: { text?: string; followUpAnswer?: string }, userTurn: ChatTurn) => {
    setIsSending(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const images = photo ? [await resizeLabelImage(photo)] : undefined;
      if (photo) setLastProductPhoto(photo);
      setPhoto(null);
      const payload = { ...input, ...(images && { images }) };
      const result = conversationId
        ? await postConversationMessage(conversationId, payload)
        : await startConversation(payload);
      setConversationId(result.conversationId);
      handleResult(result, userTurn);
    } catch (err) {
      setError(friendlyError(err));
      setQuotaExceeded(err instanceof AiAssistError && err.code === 'AI_PRODUCER_QUOTA_EXCEEDED');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !photo) return;
    const userTurn: ChatTurn = {
      role: 'user',
      text: trimmed,
      imageUrl: photo ? URL.createObjectURL(photo) : undefined,
    };
    setText('');
    void send({ text: trimmed || undefined }, userTurn);
  };

  const handleAnswer = (value: string) => {
    if (!pendingQuestion) return;
    void send({ followUpAnswer: value }, { role: 'user', text: value });
  };

  const handleSkip = () => {
    if (!pendingQuestion) return;
    void send({ followUpAnswer: 'No lo sé, sigue sin este dato.' }, { role: 'user', text: '(sin responder)' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {quota && (
        <AiCreditsPanel
          quota={quotaExceeded ? { ...quota, used: Math.max(quota.used, quota.total) } : quota}
          onRecharge={() => setShowAddCredits(true)}
          onManual={quotaExhausted || quotaExceeded ? onManual : undefined}
        />
      )}

      <Card variant="elevated" className="flex flex-col p-0 overflow-hidden">
        <div className="flex max-h-[60vh] min-h-[320px] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          {turns.map((turn, i) => (
            <div key={i} className={cn('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                  turn.role === 'user'
                    ? 'bg-origen-bosque text-white'
                    : 'bg-origen-pastel/60 text-origen-oscuro',
                )}
              >
                {turn.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={turn.imageUrl} alt="" className="mb-2 h-28 w-28 rounded-xl object-cover" />
                )}
                {turn.text}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-origen-pastel/60 px-4 py-2.5 text-sm text-origen-oscuro">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Pensando...
              </div>
            </div>
          )}
          {pendingQuestion && !isSending && (
            <div className="rounded-2xl border border-border-subtle bg-surface-alt p-4 space-y-3">
              <p className="text-sm font-medium text-origen-bosque">{pendingQuestion.question}</p>
              <PendingQuestionAnswer
                question={pendingQuestion}
                disabled={isSending}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
              />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-4 sm:px-6">
            <Alert variant={quotaExceeded ? 'warning' : 'error'}>
              <AlertTitle>{quotaExceeded ? 'Sin créditos del asistente' : 'Algo ha ido mal'}</AlertTitle>
              <AlertDescription><p>{error}</p></AlertDescription>
            </Alert>
          </div>
        )}

        {!pendingQuestion && (
          <div className="border-t border-border-subtle p-3 sm:p-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => handlePhoto(e.target.files)}
            />
            {photo && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-border-subtle bg-origen-pastel/40 px-3 py-2 text-xs text-origen-bosque">
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                {photo.name}
                <button type="button" onClick={() => setPhoto(null)} aria-label="Quitar foto" className="ml-auto">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={isSending || quotaExhausted}
                onClick={() => photoInputRef.current?.click()}
                aria-label="Añadir foto"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe aquí..."
                className="min-h-[44px] flex-1"
                disabled={isSending || quotaExhausted}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="button"
                variant="primary"
                size="icon"
                disabled={isSending || quotaExhausted || (!text.trim() && !photo)}
                onClick={handleSend}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        <AddCreditsModal
          open={showAddCredits}
          onOpenChange={setShowAddCredits}
          onCreditsPurchased={() => {
            setError(null);
            setQuotaExceeded(false);
            onCreditsPurchased?.();
          }}
        />
      </Card>

      <div className="text-center">
        <Button type="button" variant="ghost" size="sm" onClick={onManual} leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}>
          Prefiero rellenarlo yo
        </Button>
      </div>
    </motion.div>
  );
}
