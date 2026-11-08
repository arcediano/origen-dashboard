/**
 * @component ProfileAiReviewButton
 * @description "Mejorar con IA" del perfil comercial ("Mi negocio", petición
 * del humano, 2026-11-08): botón que gasta 1 crédito del asistente para
 * revisar los textos ya escritos (eslogan, historia, filosofía de
 * producción, bienestar animal) y proponer mejoras de redacción. La IA solo
 * sugiere -- el productor acepta o descarta cada sugerencia por separado;
 * nada se aplica al formulario hasta que el propio productor lo acepta, y
 * nada se guarda de verdad hasta que pulsa "Guardar" en el resto de la
 * página (mismo comportamiento que las fotos: cambios en memoria hasta
 * guardar).
 *
 * Misma bolsa de créditos que crear un producto con el asistente -- reutiliza
 * `getAiAssistQuota`/`AddCreditsModal` tal cual.
 */

'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@arcediano/ux-library';
import { AiAssistError, getAiAssistQuota, reviewProfile } from '@/lib/api/ai-assist';
import { AddCreditsModal } from '@/app/dashboard/products/components/ai-onboarding/AddCreditsModal';
import {
  PROFILE_REVIEW_FIELD_LABELS,
  type ProfileReviewFieldKey,
  type ProfileReviewFields,
  type ProfileReviewSuggestion,
} from '@/lib/ai-assist/profile-review';

type Step = 'idle' | 'confirm' | 'loading' | 'review' | 'empty' | 'error';

interface ProfileAiReviewButtonProps {
  fields: ProfileReviewFields;
  onApply: (field: ProfileReviewFieldKey, value: string) => void;
  disabled?: boolean;
}

export function ProfileAiReviewButton({ fields, onApply, disabled }: ProfileAiReviewButtonProps) {
  const [step, setStep] = useState<Step>('idle');
  const [suggestions, setSuggestions] = useState<ProfileReviewSuggestion[]>([]);
  const [decided, setDecided] = useState<Record<string, 'accepted' | 'discarded'>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddCredits, setShowAddCredits] = useState(false);

  const hasAnyText = Object.values(fields).some((v) => v?.trim());

  async function handleOpen() {
    setErrorMessage('');
    try {
      const quota = await getAiAssistQuota();
      if (!quota.enabled) {
        setErrorMessage('El asistente de IA no está disponible en este momento.');
        setStep('error');
        return;
      }
      if (quota.total - quota.used <= 0) {
        setShowAddCredits(true);
        return;
      }
      setStep('confirm');
    } catch (error) {
      setErrorMessage(
        error instanceof AiAssistError ? error.message : 'No se ha podido comprobar tus créditos.',
      );
      setStep('error');
    }
  }

  async function handleConfirm() {
    setStep('loading');
    try {
      const result = await reviewProfile(fields);
      if (result.suggestions.length === 0) {
        setStep('empty');
        return;
      }
      setSuggestions(result.suggestions);
      setDecided({});
      setStep('review');
    } catch (error) {
      setErrorMessage(
        error instanceof AiAssistError ? error.message : 'El asistente de IA no ha podido revisar tu perfil.',
      );
      setStep('error');
    }
  }

  function handleAccept(suggestion: ProfileReviewSuggestion) {
    onApply(suggestion.field, suggestion.suggested);
    setDecided((prev) => ({ ...prev, [suggestion.field]: 'accepted' }));
  }

  function handleDiscard(suggestion: ProfileReviewSuggestion) {
    setDecided((prev) => ({ ...prev, [suggestion.field]: 'discarded' }));
  }

  function close() {
    setStep('idle');
    setSuggestions([]);
    setDecided({});
    setErrorMessage('');
  }

  const open = step !== 'idle';
  const allDecided = suggestions.length > 0 && suggestions.every((s) => decided[s.field]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !hasAnyText}
        leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
        onClick={handleOpen}
      >
        Mejorar con IA
      </Button>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="sm:max-w-xl">
          {step === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle>Revisar con el asistente de IA</DialogTitle>
                <DialogDescription>
                  Va a leer el eslogan, la historia, la filosofía de producción y el bienestar animal que ya
                  tienes escritos, y a proponer mejoras de redacción. Nunca inventa datos ni cambia el
                  significado -- tú decides, campo a campo, qué sugerencia aceptar. Cuesta 1 crédito.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={close}>
                  Cancelar
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={handleConfirm}>
                  Gastar 1 crédito y revisar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-hoja-tinta" aria-hidden="true" />
              <p className="text-sm text-text-subtle">Revisando tus textos…</p>
            </div>
          )}

          {step === 'empty' && (
            <>
              <DialogHeader>
                <DialogTitle>Tus textos ya están bien</DialogTitle>
                <DialogDescription>
                  El asistente no ha encontrado ninguna mejora real que proponer -- no se ha gastado el crédito.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="primary" size="sm" onClick={close}>
                  Entendido
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle>No se ha podido revisar tu perfil</DialogTitle>
              </DialogHeader>
              <Alert variant="error">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <DialogFooter>
                <Button type="button" variant="primary" size="sm" onClick={close}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'review' && (
            <>
              <DialogHeader>
                <DialogTitle>Sugerencias del asistente</DialogTitle>
                <DialogDescription>
                  Acepta cada sugerencia por separado para aplicarla al formulario -- recuerda pulsar
                  &quot;Guardar&quot; al terminar para que se guarde de verdad.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                {suggestions.map((suggestion) => {
                  const state = decided[suggestion.field];
                  return (
                    <div
                      key={suggestion.field}
                      className="space-y-2 rounded-xl border border-border-subtle bg-surface-alt p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-origen-bosque">
                          {PROFILE_REVIEW_FIELD_LABELS[suggestion.field]}
                        </span>
                        {state === 'accepted' && (
                          <Badge variant="leaf" size="xs">
                            Aplicada
                          </Badge>
                        )}
                        {state === 'discarded' && (
                          <Badge variant="outline" size="xs">
                            Descartada
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-text-subtle line-clamp-3">
                        <span className="font-medium">Antes: </span>
                        {suggestion.current}
                      </p>
                      <p className="text-sm text-origen-oscuro">
                        <span className="font-medium text-origen-bosque">Propuesta: </span>
                        {suggestion.suggested}
                      </p>
                      {suggestion.reason && <p className="text-xs italic text-text-subtle">{suggestion.reason}</p>}

                      {!state && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => handleAccept(suggestion)}
                          >
                            Aceptar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => handleDiscard(suggestion)}
                          >
                            Descartar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button type="button" variant="primary" size="sm" onClick={close} disabled={!allDecided}>
                  {allDecided ? 'Terminar' : 'Decide todas las sugerencias para terminar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddCreditsModal
        open={showAddCredits}
        onOpenChange={setShowAddCredits}
        onCreditsPurchased={() => {
          setShowAddCredits(false);
          setStep('confirm');
        }}
      />
    </>
  );
}
