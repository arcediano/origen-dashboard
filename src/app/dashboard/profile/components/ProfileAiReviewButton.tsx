/**
 * @component ProfileAiReviewButton
 * @description "Mejorar con IA" del perfil comercial ("Mi negocio", petición
 * del humano, 2026-11-08, ampliado a fotos y hecho más prominente
 * 2026-11-09): gasta 1 crédito del asistente para revisar los textos ya
 * escritos (eslogan, historia, filosofía de producción, bienestar animal) Y,
 * si hay, hasta 3 fotos (la primera de cada galería: equipo, entorno,
 * proceso), y propone mejoras -- de redacción para el texto, de luz/nitidez
 * para las fotos (nunca genera una escena nueva). La IA solo sugiere -- el
 * productor acepta o descarta cada sugerencia por separado; nada se aplica
 * al formulario hasta que el propio productor lo acepta, y nada se guarda de
 * verdad hasta que pulsa "Guardar" en el resto de la página.
 *
 * `variant="banner"` (usado en "Mi negocio") muestra un aviso destacado al
 * principio de la página, igual de prominente que `AiAssistBanner` en el
 * alta de producto, con los créditos restantes siempre a la vista.
 * `variant="button"` (por defecto) es el disparador pequeño original, por si
 * se reutiliza en otro sitio más compacto.
 *
 * Misma bolsa de créditos que crear un producto con el asistente -- reutiliza
 * `getAiAssistQuota`/`AddCreditsModal` tal cual. 1 crédito cubre la revisión
 * completa (texto + fotos) de una sola vez, nunca 1 por foto.
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
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
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import {
  PROFILE_PHOTO_COLLECTION_LABELS,
  PROFILE_REVIEW_FIELD_LABELS,
  type ProfilePhotoCandidate,
  type ProfilePhotoCollection,
  type ProfilePhotoSuggestion,
  type ProfileReviewFieldKey,
  type ProfileReviewFields,
  type ProfileReviewSuggestion,
} from '@/lib/ai-assist/profile-review';

type Step = 'idle' | 'confirm' | 'loading' | 'review' | 'empty' | 'error';

interface ProfileAiReviewButtonProps {
  fields: ProfileReviewFields;
  onApply: (field: ProfileReviewFieldKey, value: string) => void;
  /** Primera foto activa y ya guardada de cada galería no vacía -- hasta 3 (una por galería). */
  photos?: ProfilePhotoCandidate[];
  onApplyPhoto?: (collection: ProfilePhotoCollection, itemId: string, file: File) => void;
  variant?: 'button' | 'banner';
  disabled?: boolean;
}

/** Convierte la data URL que devuelve el backend en un `File` para aplicarla como foto sustituida. */
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

export function ProfileAiReviewButton({
  fields,
  onApply,
  photos = [],
  onApplyPhoto,
  variant = 'button',
  disabled,
}: ProfileAiReviewButtonProps) {
  const [step, setStep] = useState<Step>('idle');
  const [suggestions, setSuggestions] = useState<ProfileReviewSuggestion[]>([]);
  const [photoSuggestions, setPhotoSuggestions] = useState<ProfilePhotoSuggestion[]>([]);
  const [decided, setDecided] = useState<Record<string, 'accepted' | 'discarded'>>({});
  const [photoDecided, setPhotoDecided] = useState<Record<ProfilePhotoCollection, 'accepted' | 'discarded'>>(
    {} as Record<ProfilePhotoCollection, 'accepted' | 'discarded'>,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);

  const hasAnyText = Object.values(fields).some((v) => v?.trim());
  const canReview = hasAnyText || photos.length > 0;

  // El banner muestra los créditos restantes siempre visibles, no solo al abrir el diálogo.
  useEffect(() => {
    if (variant !== 'banner') return;
    let cancelled = false;
    getAiAssistQuota()
      .then((q) => {
        if (!cancelled) setQuota(q);
      })
      .catch(() => {
        // Degradación silenciosa: el banner sigue mostrando el CTA sin la cifra de créditos.
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  async function handleOpen() {
    setErrorMessage('');
    try {
      const q = await getAiAssistQuota();
      setQuota(q);
      if (!q.enabled) {
        setErrorMessage('El asistente de IA no está disponible en este momento.');
        setStep('error');
        return;
      }
      if (q.total - q.used <= 0) {
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
      const result = await reviewProfile(
        fields,
        photos.map(({ collection, key, url }) => ({ collection, key, url })),
      );
      const textSuggestions = result.suggestions ?? [];
      const photoResults = result.photoSuggestions ?? [];
      if (textSuggestions.length === 0 && photoResults.length === 0) {
        setStep('empty');
        return;
      }
      setSuggestions(textSuggestions);
      setPhotoSuggestions(photoResults);
      setDecided({});
      setPhotoDecided({} as Record<ProfilePhotoCollection, 'accepted' | 'discarded'>);
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

  async function handleAcceptPhoto(suggestion: ProfilePhotoSuggestion) {
    const candidate = photos.find((p) => p.collection === suggestion.collection);
    if (!candidate || !onApplyPhoto) return;
    try {
      const file = await dataUrlToFile(suggestion.after, `${suggestion.collection}-mejorada.jpg`);
      onApplyPhoto(suggestion.collection, candidate.itemId, file);
      setPhotoDecided((prev) => ({ ...prev, [suggestion.collection]: 'accepted' }));
    } catch {
      setPhotoDecided((prev) => ({ ...prev, [suggestion.collection]: 'discarded' }));
    }
  }

  function handleDiscardPhoto(suggestion: ProfilePhotoSuggestion) {
    setPhotoDecided((prev) => ({ ...prev, [suggestion.collection]: 'discarded' }));
  }

  function close() {
    setStep('idle');
    setSuggestions([]);
    setPhotoSuggestions([]);
    setDecided({});
    setPhotoDecided({} as Record<ProfilePhotoCollection, 'accepted' | 'discarded'>);
    setErrorMessage('');
  }

  const open = step !== 'idle';
  const allTextDecided = suggestions.every((s) => decided[s.field]);
  const allPhotosDecided = photoSuggestions.every((s) => photoDecided[s.collection]);
  const allDecided = (suggestions.length > 0 || photoSuggestions.length > 0) && allTextDecided && allPhotosDecided;

  const remaining = quota ? Math.max(0, quota.total - quota.used) : null;

  const trigger =
    variant === 'banner' ? (
      <section
        data-testid="profile-ai-review-banner"
        aria-labelledby="profile-ai-review-banner-title"
        className="rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-origen-pradera/15">
              <Sparkles className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="profile-ai-review-banner-title" className="text-base font-semibold text-origen-bosque sm:text-lg">
                Mejora tu perfil con IA
              </h2>
              <p className="mt-1 text-sm text-text-subtle">
                Revisa los textos de tu historia y hasta 3 fotos de tus galerías (equipo, entorno, proceso).
                Nunca inventa datos ni genera fotos nuevas -- solo pule la redacción y mejora la luz y la
                nitidez de lo que ya tienes. Tú decides, una a una, qué sugerencia aceptar.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={disabled || !canReview}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            onClick={handleOpen}
            className="shrink-0"
          >
            Mejorar con IA
          </Button>
        </div>
        <p className="mt-4 text-xs text-text-subtle" data-testid="profile-ai-review-banner-credits">
          {remaining !== null ? (
            <>
              Te {remaining === 1 ? 'queda' : 'quedan'} <strong className="text-origen-bosque">{remaining}</strong>{' '}
              {remaining === 1 ? 'crédito' : 'créditos'} ·{' '}
            </>
          ) : null}
          1 crédito = 1 revisión completa (texto y fotos), solo se gasta si hay alguna mejora real.
        </p>
      </section>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !canReview}
        leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
        onClick={handleOpen}
      >
        Mejorar con IA
      </Button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="sm:max-w-xl">
          {step === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle>Revisar con el asistente de IA</DialogTitle>
                <DialogDescription>
                  Va a leer el eslogan, la historia, la filosofía de producción y el bienestar animal que ya
                  tienes escritos
                  {photos.length > 0
                    ? `, y a mejorar la luz y nitidez de ${photos.length === 1 ? 'la foto destacada de ' + PROFILE_PHOTO_COLLECTION_LABELS[photos[0].collection].toLowerCase() : `${photos.length} fotos de tus galerías`}`
                    : ''}
                  . Nunca inventa datos ni genera fotos nuevas, ni cambia el significado de tus textos -- tú
                  decides, una a una, qué sugerencia aceptar. Cuesta 1 crédito en total.
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
              <p className="text-sm text-text-subtle">Revisando tu perfil…</p>
            </div>
          )}

          {step === 'empty' && (
            <>
              <DialogHeader>
                <DialogTitle>Tu perfil ya está bien</DialogTitle>
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
                  Acepta cada sugerencia por separado para aplicarla -- recuerda pulsar &quot;Guardar&quot; al
                  terminar para que se guarde de verdad.
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

                {photoSuggestions.map((suggestion) => {
                  const state = photoDecided[suggestion.collection];
                  const candidate = photos.find((p) => p.collection === suggestion.collection);
                  return (
                    <div
                      key={suggestion.collection}
                      className="space-y-2 rounded-xl border border-border-subtle bg-surface-alt p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-origen-bosque">
                          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {PROFILE_PHOTO_COLLECTION_LABELS[suggestion.collection]}
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

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-text-subtle">Antes</p>
                          {candidate && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={candidate.url}
                              alt="Foto original"
                              className="aspect-4/3 w-full rounded-lg object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-text-subtle">Propuesta</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={suggestion.after}
                            alt="Foto mejorada"
                            className="aspect-4/3 w-full rounded-lg object-cover"
                          />
                        </div>
                      </div>

                      {!state && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => handleAcceptPhoto(suggestion)}
                          >
                            Aceptar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => handleDiscardPhoto(suggestion)}
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
