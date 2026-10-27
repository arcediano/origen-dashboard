/**
 * @component AiAssistChat
 * @description Chat guiado "Origen Assist" (rediseño v2, 2026-10-26, spec
 * detallado del humano): máquina de pasos FIJA de 7 pasos (no un chat libre
 * donde el modelo decide qué preguntar), una pregunta concreta por turno con
 * su propia zona de foto y/o chips de respuesta rápida. Al terminar, el
 * backend ya ha creado el `Product` real (DRAFT): este componente redirige a
 * su ficha de detalle con un spinner breve.
 *
 * Resiliencia de sesión (acotada a este flujo, sin tocar `AuthContext`): el
 * `conversationId` se persiste en `sessionStorage` en cada turno -- si el
 * usuario recarga o vuelve tras un redirect a `/login` por expiración, se
 * recupera con `GET /ai-assist/conversation/:id` y se ofrece continuar
 * donde lo dejó, en vez de perder el progreso (mismo patrón que
 * `CheckoutShell.tsx` de origen-web).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Loader2, Send, Sparkles } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Progress,
  Textarea,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { resizeLabelImage } from '@/lib/ai-assist/resize-label-image';
import { AiAssistError, getConversation, postConversationMessage, startConversation } from '@/lib/api/ai-assist';
import type { ConversationTurnResponse } from '@/lib/ai-assist/conversation';
import { STEP_PROMPTS, TOTAL_STEPS, stepIndexOf, type AiAssistUserStep } from '@/lib/ai-assist/step-prompts';
import { AddCreditsModal } from './AddCreditsModal';
import { AiCreditsPanel } from './AiCreditsPanel';

const MAX_FILE_MB = 10;
const STORAGE_KEY = 'origen-ai-assist-conversation-id';

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
}

interface AiAssistChatProps {
  quota: { used: number; total: number; free?: number; purchased?: number } | null;
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
  return error instanceof Error ? error.message : 'Algo ha ido mal.';
}

/** Chips de respuesta rápida + (para "origin") el selector de CCAA no aplica aquí -- es texto libre genérico. */
function QuickReplyChips({
  chips,
  disabled,
  onPick,
}: {
  chips: string[];
  disabled: boolean;
  onPick: (value: string) => void;
}) {
  return (
    // role="group" + aria-label: sin esto, un lector de pantalla anuncia cada
    // chip como un botón suelto sin relación entre sí -- no transmite que son
    // opciones alternativas a la misma pregunta.
    <div className="flex flex-wrap gap-2" role="group" aria-label="Respuestas rápidas">
      {chips.map((chip) => {
        // Chips de candidatos USDA llevan "usda:<i>:<descripción>" -- se muestra solo la descripción.
        const label = chip.startsWith('usda:') ? chip.split(':').slice(2).join(':') : chip;
        return (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onPick(chip)}
            className={cn(
              'rounded-xl border-2 border-border-subtle bg-surface-alt px-4 py-2',
              'text-sm font-semibold text-origen-bosque transition-colors',
              'hover:border-origen-pradera hover:bg-origen-pradera/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
              'disabled:opacity-50',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AiAssistChat({ quota, onManual, onCreditsPurchased }: AiAssistChatProps) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [stepData, setStepData] = useState<{
    stepIndex: number;
    totalSteps: number;
    imageDropzoneLabel?: string;
    chips?: string[];
  } | null>(null);
  const [resumeOffer, setResumeOffer] = useState<{ conversationId: string; step: string } | null>(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quotaExhausted = !!quota && quota.used >= quota.total;

  // Reanudación: si hay una conversación activa guardada (p. ej. tras un
  // redirect a /login por expiración de sesión), se ofrece continuar en vez
  // de empezar de cero -- el borrador en el backend nunca se pierde.
  useEffect(() => {
    const savedId = sessionStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    getConversation(savedId)
      .then((conv) => {
        if (conv.status === 'ACTIVE') {
          setResumeOffer({ conversationId: savedId, step: conv.currentStep });
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, stepData]);

  // Tras cada respuesta del asistente, devolver el foco al campo de texto --
  // sin esto, el usuario tenía que volver a tocar el input en cada turno
  // (fricción real en móvil). Se excluye deliberadamente el paso con foto
  // (`imageDropzoneLabel`): ahí la acción principal es tocar el dropzone, no
  // escribir, y el foco automático puede disparar el teclado virtual justo
  // cuando el usuario va a mirar la zona de subida -- un efecto molesto que
  // no se puede verificar en dispositivo real desde este entorno, así que se
  // evita por precaución en vez de asumir que es seguro en todos los pasos.
  useEffect(() => {
    if (isSending || isRedirecting || stepData?.imageDropzoneLabel) return;
    textareaRef.current?.focus();
  }, [turns, isSending, isRedirecting, stepData?.imageDropzoneLabel]);

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

  const applyResult = (result: ConversationTurnResponse, userTurn: ChatTurn | null) => {
    setConversationId(result.conversationId);
    sessionStorage.setItem(STORAGE_KEY, result.conversationId);
    setTurns((prev) => [...prev, ...(userTurn ? [userTurn] : []), { role: 'assistant', text: result.text }]);
    if (result.kind === 'step') {
      setStepData({
        stepIndex: result.stepIndex,
        totalSteps: result.totalSteps,
        imageDropzoneLabel: result.imageDropzoneLabel,
        chips: result.chips,
      });
    } else {
      setStepData(null);
      sessionStorage.removeItem(STORAGE_KEY);
      setIsRedirecting(true);
      window.setTimeout(() => router.push(`/dashboard/products/${result.productId}?fromAssistant=1`), 1200);
    }
  };

  const send = async (input: { text?: string; choice?: string }, userTurn: ChatTurn | null) => {
    setIsSending(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const images = photo ? [await resizeLabelImage(photo)] : undefined;
      setPhoto(null);
      const payload = { ...input, ...(images && { images }) };
      const result = conversationId
        ? await postConversationMessage(conversationId, payload)
        : await startConversation(payload);
      applyResult(result, userTurn);
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
    const userTurn: ChatTurn = { role: 'user', text: trimmed, imageUrl: photo ? URL.createObjectURL(photo) : undefined };
    setText('');
    void send({ text: trimmed || undefined }, userTurn);
  };

  const handleChip = (choice: string) => {
    const label = choice.startsWith('usda:') ? choice.split(':').slice(2).join(':') : choice;
    void send({ choice }, { role: 'user', text: label });
  };

  if (resumeOffer) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated" className="p-6 sm:p-8 text-center space-y-4">
          <p className="text-base font-medium text-origen-bosque">
            👋 Retomamos donde lo dejaste (paso {stepIndexOf(resumeOffer.step)} de {TOTAL_STEPS}).
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setConversationId(resumeOffer.conversationId);
                const step = resumeOffer.step as AiAssistUserStep;
                const prompt = STEP_PROMPTS[step];
                setTurns([{ role: 'assistant', text: prompt?.text ?? 'Sigamos.' }]);
                if (prompt) {
                  setStepData({
                    stepIndex: stepIndexOf(step),
                    totalSteps: TOTAL_STEPS,
                    imageDropzoneLabel: prompt.imageDropzoneLabel,
                    chips: prompt.chips,
                  });
                }
                setResumeOffer(null);
              }}
            >
              Continuar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                setResumeOffer(null);
              }}
            >
              Empezar de nuevo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated" className="p-10 flex flex-col items-center gap-4 text-center" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-origen-bosque" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Preparando tu ficha…</p>
        </Card>
      </div>
    );
  }

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

      {stepData && (
        <Progress
          value={stepData.stepIndex}
          max={stepData.totalSteps}
          showLabel
          label={`Paso ${stepData.stepIndex} de ${stepData.totalSteps}`}
          size="sm"
        />
      )}

      <Card variant="elevated" className="flex flex-col p-0 overflow-hidden">
        {/* role="log" + aria-live="polite": sin esto, un lector de pantalla
            nunca se entera de que llegó una respuesta nueva -- tendría que
            navegar manualmente a buscarla tras cada turno. */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversación con Origen Assist"
          // `dvh` (dynamic viewport height) en vez de `vh`: `vh` en iOS/Android
          // no se reduce cuando se abre el teclado virtual, así que el log
          // podía quedar más alto que el viewport visible real y empujar el
          // input fuera de la pantalla -- hallazgo de la auditoría UX
          // (petición del humano). `dvh` sí se recalcula con el teclado
          // abierto en los navegadores móviles actuales (iOS Safari ≥15.4,
          // Chrome Android ≥108).
          className="flex max-h-[60dvh] min-h-[280px] flex-col gap-4 overflow-y-auto p-4 sm:p-6"
        >
          {turns.length === 0 && !isSending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-origen-pastel/60 px-4 py-2.5 text-sm text-origen-oscuro">
                Hola, soy Origen Assist. {STEP_PROMPTS.PRODUCT_PHOTO.text}
              </div>
            </div>
          )}
          {turns.map((turn, i) => (
            <div key={i} className={cn('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                  turn.role === 'user' ? 'bg-origen-bosque text-white' : 'bg-origen-pastel/60 text-origen-oscuro',
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
                Pensando…
              </div>
            </div>
          )}
          {stepData?.chips && !isSending && (
            <div className="space-y-1.5">
              <QuickReplyChips chips={stepData.chips} disabled={isSending} onPick={handleChip} />
              {/* Aclara que las fichas y el campo de texto son dos formas de
                  responder lo mismo -- sin esto, no quedaba claro si había
                  que elegir una ficha o si también valía escribir la
                  respuesta a mano (hallazgo de la auditoría UX). */}
              <p className="text-micro text-text-subtle">O escribe tu respuesta abajo.</p>
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

        <div className="border-t border-border-subtle p-3 sm:p-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => handlePhoto(e.target.files)}
          />
          {stepData?.imageDropzoneLabel && (
            <button
              type="button"
              disabled={isSending || quotaExhausted}
              onClick={() => photoInputRef.current?.click()}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong/40 bg-origen-pastel/30 px-4 py-3 text-xs font-medium text-origen-bosque transition-colors hover:bg-origen-pastel/60"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {photo ? photo.name : stepData.imageDropzoneLabel}
            </button>
          )}
          <div className="flex items-end gap-2">
            {!stepData?.imageDropzoneLabel && (
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
            )}
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe aquí…"
              className="min-h-[44px] flex-1"
              disabled={isSending || quotaExhausted}
              // Complementa el fix de `dvh`: cuando el teclado virtual
              // empuja el layout, asegura que el propio campo (no solo el
              // contenedor) quede visible en vez de depender solo del
              // recálculo de altura.
              onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
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
