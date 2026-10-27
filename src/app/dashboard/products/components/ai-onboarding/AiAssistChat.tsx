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
import { Camera, Loader2, Paperclip, Send, Sparkles, X } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
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
  imageUrls?: string[];
}

interface AttachedImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
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

function stepSummary(stepData: { stepIndex: number; totalSteps: number; imageDropzoneLabel?: string; chips?: string[] } | null) {
  if (!stepData) {
    return 'Foto del producto';
  }

  const currentStep = stepData.stepIndex;
  const mapping = [
    'Foto del producto',
    'Ficha nutricional',
    'Ingredientes y alérgenos',
    'Certificados',
    'Formato de venta',
  ];

  return mapping[Math.min(currentStep - 1, mapping.length - 1)] ?? 'Sigue creando tu producto';
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
  const [attachments, setAttachments] = useState<AttachedImage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quotaExhausted = !!quota && quota.used >= quota.total;

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
  // cuando el usuario va a mirar la zona de subida.
  useEffect(() => {
    if (isSending || isRedirecting || stepData?.imageDropzoneLabel) return;
    textareaRef.current?.focus();
  }, [turns, isSending, isRedirecting, stepData?.imageDropzoneLabel]);

  const clearAttachments = () => {
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const handlePhoto = (list: FileList | null) => {
    if (photoInputRef.current) photoInputRef.current.value = '';
    const files = list ? Array.from(list) : [];
    if (!files.length) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen (JPG, PNG o WebP).');
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`La imagen "${file.name}" supera los ${MAX_FILE_MB} MB. Prueba con otra.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    setError(null);
    setAttachments((prev) => {
      const next = [
        ...prev,
        ...validFiles.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
        })),
      ];
      return next.slice(-5);
    });
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
    const draftText = text;
    const draftAttachments = attachments;
    setIsSending(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const images = draftAttachments.length > 0 ? await Promise.all(draftAttachments.map(({ file }) => resizeLabelImage(file))) : undefined;
      setText('');
      setAttachments((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return [];
      });
      const payload = { ...input, ...(images && { images }) };
      const result = conversationId
        ? await postConversationMessage(conversationId, payload)
        : await startConversation(payload);
      applyResult(result, userTurn);
    } catch (err) {
      setText(draftText);
      setAttachments(draftAttachments);
      setError(friendlyError(err));
      setQuotaExceeded(err instanceof AiAssistError && err.code === 'AI_PRODUCER_QUOTA_EXCEEDED');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachments.length) return;
    const userTurn: ChatTurn = {
      role: 'user',
      text: trimmed || (attachments.length > 1 ? 'He adjuntado imágenes' : 'He adjuntado una imagen'),
      imageUrls: attachments.map((attachment) => attachment.previewUrl),
    };
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

  const currentTask = stepSummary(stepData);

  return (
    <>
      {quota && (
        <div className="mb-3 lg:hidden">
          <AiCreditsPanel
            quota={quotaExceeded ? { ...quota, used: Math.max(quota.used, quota.total) } : quota}
            onRecharge={() => setShowAddCredits(true)}
            onManual={onManual}
            className="p-3 sm:p-4"
          />
        </div>
      )}

      <div className="mb-3 flex items-stretch gap-2 lg:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onManual}
          className="flex-1 min-w-0 justify-center px-3"
        >
          Crear manualmente
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddCredits(true)}
          className="flex-1 min-w-0 justify-center px-3"
        >
          Recargar
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_360px]">
        <section className="space-y-4">
          {stepData && (
            <div className="rounded-2xl border border-border-subtle bg-white p-3 shadow-sm sm:p-4">
              <Progress
                value={stepData.stepIndex}
                max={stepData.totalSteps}
                showLabel
                label={`Paso ${stepData.stepIndex} de ${stepData.totalSteps}`}
                size="sm"
              />
            </div>
          )}

          <Card variant="elevated" className="flex min-w-0 flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-origen-pastel/40 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-origen-bosque shadow-sm">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-origen-bosque">Origen Assist</p>
                  <p className="text-[11px] text-text-subtle">{currentTask}</p>
                </div>
              </div>
              <Badge variant="neutral" size="xs" className="shrink-0">
                {stepData ? 'En curso' : 'Preparando'}
              </Badge>
            </div>

            {/* role="log" + aria-live: sin esto, un lector de pantalla nunca
                se entera de que llegó una respuesta nueva. `dvh` en vez de
                `vh`: `vh` no se reduce al abrir el teclado virtual en
                iOS/Android, podía empujar el input fuera del viewport
                visible; `dvh` sí se recalcula con el teclado abierto. */}
            <div
              role="log"
              aria-live="polite"
              aria-label="Conversación con Origen Assist"
              className="flex max-h-[62dvh] min-h-[260px] min-w-0 flex-col gap-4 overflow-y-auto bg-white p-4 sm:p-6"
            >
              {turns.length === 0 && !isSending && (
                <div className="space-y-4">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-origen-pastel/60 px-4 py-3 text-sm text-origen-oscuro shadow-sm">
                    Hola, soy Origen Assist. {STEP_PROMPTS.PRODUCT_PHOTO.text}
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-surface-alt p-3 text-sm text-text-subtle">
                    <p className="font-medium text-origen-bosque">Qué te pediremos</p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-origen-pradera" aria-hidden="true" />Foto principal y nombre del producto</li>
                      <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-origen-pradera" aria-hidden="true" />Tabla nutricional o ingredientes si los tienes</li>
                      <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-origen-pradera" aria-hidden="true" />Formato de venta y certificados</li>
                    </ul>
                  </div>
                </div>
              )}

              {turns.map((turn, i) => (
                <div key={i} className={cn('flex min-w-0', turn.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm',
                      turn.role === 'user'
                        ? 'rounded-br-md bg-origen-bosque text-white'
                        : 'rounded-bl-md border border-border-subtle bg-origen-pastel/60 text-origen-oscuro',
                    )}
                  >
                    {(turn.imageUrls ?? (turn.imageUrl ? [turn.imageUrl] : [])).length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {(turn.imageUrls ?? (turn.imageUrl ? [turn.imageUrl] : [])).map((imageUrl, imageIndex) => (
                          <img
                            key={`${i}-${imageIndex}`}
                            src={imageUrl}
                            alt="Imagen adjunta"
                            className="h-24 w-24 max-w-full rounded-xl object-cover border border-white/20 sm:h-28 sm:w-28"
                          />
                        ))}
                      </div>
                    )}
                    {turn.text}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border-subtle bg-origen-pastel/60 px-4 py-3 text-sm text-origen-oscuro shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Estamos preparando tu ficha…
                  </div>
                </div>
              )}

              {stepData?.chips && !isSending && (
                <div className="space-y-1.5">
                  <QuickReplyChips chips={stepData.chips} disabled={isSending} onPick={handleChip} />
                  {/* Aclara que las fichas y el campo de texto son dos formas
                      de responder lo mismo -- sin esto, no quedaba claro si
                      había que elegir una ficha o si también valía escribir
                      la respuesta a mano. */}
                  <p className="text-xs text-text-subtle">O escribe tu respuesta abajo.</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="border-t border-border-subtle px-4 py-4 sm:px-6">
                <Alert variant={quotaExceeded ? 'warning' : 'error'}>
                  <AlertTitle>{quotaExceeded ? 'Sin créditos del asistente' : 'Algo ha ido mal'}</AlertTitle>
                  <AlertDescription><p>{error}</p></AlertDescription>
                </Alert>
              </div>
            )}

            <div className="border-t border-border-subtle bg-surface-alt/40 p-3 sm:p-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => handlePhoto(e.target.files)}
              />

              {attachments.length > 0 && (
                <div className="mb-3 rounded-2xl border border-border-subtle bg-white p-2 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-origen-bosque/70">
                      Imagen adjunta
                    </span>
                    <button
                      type="button"
                      onClick={clearAttachments}
                      className="text-xs font-medium text-text-subtle transition-colors hover:text-origen-bosque focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
                    >
                      Eliminar todas
                    </button>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
                    {attachments.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-xl border border-border-subtle bg-surface-alt p-1.5"
                      >
                        <img src={item.previewUrl} alt={item.name} className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16" />
                        <div className="min-w-0 max-w-[120px]">
                          <p className="truncate text-[11px] font-medium text-origen-bosque">{item.name}</p>
                          <button
                            type="button"
                            aria-label={`Eliminar adjunto ${item.name}`}
                            onClick={() => removeAttachment(item.id)}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-text-subtle transition-colors hover:text-origen-bosque focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stepData?.imageDropzoneLabel && (
                <button
                  type="button"
                  disabled={isSending || quotaExhausted}
                  onClick={() => photoInputRef.current?.click()}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong/40 bg-white px-3 py-2.5 text-xs font-medium text-origen-bosque transition-colors hover:bg-origen-pastel/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  {attachments[0] ? `${attachments.length} imagen${attachments.length > 1 ? 'es' : ''} preparada${attachments.length > 1 ? 's' : ''}` : stepData.imageDropzoneLabel}
                </button>
              )}

              <div className="flex items-end gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  disabled={isSending || quotaExhausted}
                  onClick={() => photoInputRef.current?.click()}
                  aria-label="Adjuntar imagen"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                </Button>

                <Textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={stepData?.imageDropzoneLabel ? 'Describe lo que quieres cambiar o añade más detalle…' : 'Escribe aquí lo que quieras añadir…'}
                  className="min-h-[44px] max-h-[180px] flex-1 resize-none border-border-subtle bg-white text-sm leading-5 focus-visible:ring-2 focus-visible:ring-origen-pradera"
                  disabled={isSending || quotaExhausted}
                  // Complementa el fix de `dvh`: cuando el teclado virtual
                  // empuja el layout, asegura que el propio campo quede
                  // visible, no solo el contenedor.
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
                  className="h-11 w-11 shrink-0 rounded-xl"
                  disabled={isSending || quotaExhausted || (!text.trim() && attachments.length === 0)}
                  onClick={handleSend}
                  aria-label="Enviar mensaje"
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
        </section>

        <aside className="min-w-0 space-y-4">
          {quota && (
            <div className="hidden lg:block">
              <AiCreditsPanel
                quota={quotaExceeded ? { ...quota, used: Math.max(quota.used, quota.total) } : quota}
                onRecharge={() => setShowAddCredits(true)}
                onManual={onManual}
              />
            </div>
          )}

          <Card variant="elevated" className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-origen-pradera/10 text-origen-bosque">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-origen-bosque">Qué te pedimos</h2>
            </div>
            <ul className="space-y-2.5 text-sm leading-6 text-text-subtle">
              <li className="flex gap-2.5"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-origen-pradera" aria-hidden="true" />Foto del producto para reconocer marca, forma y estilo.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-origen-pradera" aria-hidden="true" />Info útil como origen, elaboración, formato y certificados.</li>
              <li className="flex gap-2.5"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-origen-pradera" aria-hidden="true" />La ficha queda lista para revisar y publicar con un solo vistazo.</li>
            </ul>
          </Card>

          <Card variant="elevated" className="min-w-0 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-origen-pastel text-origen-bosque">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-origen-bosque">Resumen</h2>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-alt p-3 text-sm text-text-subtle">
              <p className="font-medium text-origen-bosque">Tarea actual</p>
              <p className="mt-1 break-words">{currentTask}</p>
              <div className="mt-3 h-px bg-border-subtle" />
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-origen-bosque/70">Sugerencias rápidas</p>
              <p className="mt-2 break-words">
                {stepData?.chips?.length ? stepData.chips.slice(0, 2).join(' • ') : 'Sube fotos, responde con un par de frases y deja que la IA te ayude.'}
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </motion.div>
    </>
  );
}
