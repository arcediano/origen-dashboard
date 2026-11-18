/**
 * @file AiFeedbackNotice.tsx
 * @description Aviso "Hay datos que debes corregir": lo que la validación de
 * IA (o un administrador al revertir) ha marcado como incorrecto en un
 * producto, con atajo al paso del formulario de cada campo. Al corregir y
 * reenviar, la IA lo revisa de nuevo en segundos.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Edit, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, Button } from '@arcediano/ux-library';
import type { AiFeedback } from '@/lib/api/products';
import { FORM_STEPS, type FormStepId } from '@/types/product';
import {
  AiAssistError,
  getAiAssistQuota,
  regenerateProductPhoto,
  type RegeneratedProductPhoto,
} from '@/lib/api/ai-assist';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import { AddCreditsModal } from './ai-onboarding/AddCreditsModal';

const FIELD_LABEL: Record<string, string> = {
  name: 'Nombre',
  fullDescription: 'Descripción',
  shortDescription: 'Descripción corta',
  category: 'Categoría',
  categoryId: 'Categoría',
  subcategoryId: 'Subcategoría',
  'productionInfo.story': 'Historia del producto',
  nutritionalInfo: 'Información nutricional',
  allergens: 'Alérgenos',
  'nutritionalInfo.allergens': 'Alérgenos',
  'nutritionalInfo.ingredients': 'Ingredientes',
  ingredients: 'Ingredientes',
  images: 'Imágenes',
  mainImage: 'Foto principal',
};

const FIELD_STEP: Record<string, FormStepId> = {
  name: 'basic',
  fullDescription: 'basic',
  shortDescription: 'basic',
  category: 'basic',
  categoryId: 'basic',
  subcategoryId: 'basic',
  images: 'images',
  mainImage: 'images',
  nutritionalInfo: 'nutritional',
  allergens: 'nutritional',
  'nutritionalInfo.allergens': 'nutritional',
  'nutritionalInfo.ingredients': 'nutritional',
  ingredients: 'nutritional',
  'productionInfo.story': 'production',
};

export function aiFieldLabel(field: string): string | null {
  return FIELD_LABEL[field] ?? null;
}

export function aiFieldStep(field: string): FormStepId | null {
  return FIELD_STEP[field] ?? (field.startsWith('productionInfo') ? 'production' : null);
}

/**
 * Bloqueo de la foto principal: la foto no cumple el estándar de catálogo (fondo blanco,
 * cuadrada, resolución suficiente). El productor puede subir otra, o pedir a la IA que
 * genere una válida a partir de la rechazada (1 crédito).
 */
function PhotoBlock({
  productId,
  imageUrl,
  onRegenerated,
}: {
  productId: string;
  imageUrl?: string;
  onRegenerated: (photo: RegeneratedProductPhoto) => void;
}) {
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);
  const [busy, setBusy] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const done = newUrl !== null;
  const [error, setError] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAiAssistQuota()
      .then((q) => !cancelled && setQuota(q))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const remaining = quota ? Math.max(0, quota.total - quota.used) : null;
  const noCredits = remaining !== null && remaining <= 0;
  const unavailable = quota?.enabled === false;

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const photo = await regenerateProductPhoto(productId);
      onRegenerated(photo);
      setNewUrl(photo.url);
      getAiAssistQuota()
        .then(setQuota)
        .catch(() => undefined);
    } catch (e) {
      if (e instanceof AiAssistError && e.code === 'AI_PRODUCER_QUOTA_EXCEEDED') {
        setShowCredits(true);
      }
      setError(e instanceof Error ? e.message : 'No se ha podido generar la foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-border bg-surface-alt p-3 sm:p-4"
      data-testid="ai-photo-block"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {(newUrl ?? imageUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(newUrl ?? imageUrl) as string}
            alt={done ? 'Foto principal nueva' : 'Foto principal rechazada'}
            className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          {done ? (
            <p className="text-sm text-text-primary" data-testid="ai-photo-done">
              <strong>Foto nueva lista.</strong> La hemos puesto como foto principal de tu ficha:
              revísala en «Imágenes» y vuelve a publicar para que la IA la compruebe.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-primary">
                <strong>¿Prefieres que lo haga la IA?</strong> Genera una foto de producto con
                fondo blanco y formato cuadrado a partir de la que no ha pasado la revisión
                (no inventa nada: es el mismo producto). Usa{' '}
                <strong>1 crédito</strong>
                {remaining !== null && (
                  <>
                    {' '}
                    · {noCredits ? 'no te quedan créditos' : `te ${remaining === 1 ? 'queda' : 'quedan'} ${remaining}`}
                  </>
                )}
                .
              </p>
              <div className="flex flex-wrap gap-2">
                {noCredits ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => setShowCredits(true)}
                  >
                    Conseguir créditos
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={generate}
                    disabled={busy || unavailable}
                    loading={busy}
                    loadingText="Generando foto..."
                    data-testid="ai-photo-generate"
                  >
                    Generar con IA · 1 crédito
                  </Button>
                )}
              </div>
              {unavailable && (
                <p className="text-xs text-text-subtle">
                  El asistente de IA no está disponible ahora mismo. Sube otra foto en «Imágenes».
                </p>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-feedback-danger-text">
              {error}
            </p>
          )}
        </div>
      </div>
      <AddCreditsModal
        open={showCredits}
        onOpenChange={setShowCredits}
        onCreditsPurchased={() => {
          setShowCredits(false);
          setError(null);
          getAiAssistQuota()
            .then(setQuota)
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

/**
 * Recomendación de alérgenos: la IA NUNCA los modifica (es información delicada de seguridad
 * alimentaria), solo sugiere. El productor decide: añadirlos con un clic o revisarlos a mano.
 */
function AllergenSuggestion({
  message,
  values,
  currentAllergens,
  onApply,
  onReview,
}: {
  message: string;
  values: string[];
  currentAllergens: string[];
  onApply?: (values: string[]) => void;
  onReview?: () => void;
}) {
  const missing = values.filter((v) => !currentAllergens.includes(v));
  const [applied, setApplied] = useState(false);
  const allDone = applied || missing.length === 0;
  return (
    <div
      className="rounded-2xl border border-border bg-surface-alt p-3 sm:p-4"
      data-testid="ai-allergen-suggestion"
    >
      <p className="text-sm font-semibold text-text-primary">Alérgenos: confirma esta recomendación</p>
      <p className="mt-1 text-sm text-text-primary">{message}</p>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Alérgenos recomendados">
        {values.map((v) => (
          <li
            key={v}
            className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-text-primary"
          >
            {v}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-text-subtle">
        La IA no modifica los alérgenos: es una recomendación y la decisión es tuya.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {allDone ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-feedback-success-text" role="status">
            <Check className="h-4 w-4" aria-hidden="true" />
            Añadidos a tu ficha. Revísalos y vuelve a publicar.
          </p>
        ) : (
          onApply && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onApply(missing);
                setApplied(true);
              }}
              data-testid="ai-allergen-apply"
            >
              Añadir {missing.length === 1 ? 'este alérgeno' : 'estos alérgenos'}
            </Button>
          )
        )}
        {onReview && (
          <Button variant="outline" size="sm" onClick={onReview}>
            Revisar yo mismo
          </Button>
        )}
      </div>
    </div>
  );
}

export function AiFeedbackNotice({
  feedback,
  productId,
  onJumpToStep,
  onPhotoRegenerated,
  currentAllergens = [],
  onApplyAllergens,
}: {
  feedback: AiFeedback;
  productId: string;
  /** En el formulario de edición: salta al paso. En el detalle, el atajo enlaza a la edición. */
  onJumpToStep?: (step: FormStepId) => void;
  /** Solo en la edición: recibe la foto generada por la IA para ponerla como principal. */
  onPhotoRegenerated?: (photo: RegeneratedProductPhoto) => void;
  /** Alérgenos que ya tiene la ficha (para no ofrecer los que ya están). */
  currentAllergens?: string[];
  /** Solo en la edición: añade a la ficha los alérgenos recomendados (decisión del productor). */
  onApplyAllergens?: (values: string[]) => void;
}) {
  const allergenProblem = feedback.problems.find(
    (p) => p.field === 'nutritionalInfo.allergens' && (p.suggestedValues?.length ?? 0) > 0,
  );
  const photoProblem = feedback.problems.find((p) => p.field === 'mainImage');
  const reverted = feedback.kind === 'REVERTED';
  return (
    <Alert variant={reverted ? 'error' : 'warning'} className="mb-4" data-testid="ai-feedback-notice">
      <AlertTitle>
        {reverted ? 'Un administrador ha revertido la publicación' : 'Hay datos que debes corregir'}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <ul className="list-disc space-y-1.5 pl-5">
          {feedback.problems.filter((p) => p !== allergenProblem).map((p, i) => {
            const label = aiFieldLabel(p.field);
            const step = aiFieldStep(p.field);
            const stepLabel = step ? FORM_STEPS.find((s) => s.id === step)?.label : undefined;
            return (
              <li key={i}>
                {label && <span className="font-semibold">{label}: </span>}
                {p.message}
                {stepLabel && onJumpToStep && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => onJumpToStep(step!)}
                      className="font-medium underline underline-offset-2"
                    >
                      Ir a «{stepLabel}»
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {allergenProblem && (
          <AllergenSuggestion
            message={allergenProblem.message}
            values={allergenProblem.suggestedValues ?? []}
            currentAllergens={currentAllergens}
            onApply={onApplyAllergens}
            onReview={onJumpToStep ? () => onJumpToStep('nutritional') : undefined}
          />
        )}
        {photoProblem && onPhotoRegenerated && (
          <PhotoBlock
            productId={productId}
            imageUrl={photoProblem.imageUrl}
            onRegenerated={onPhotoRegenerated}
          />
        )}
        <p className="text-xs">
          {feedback.attempt > 1
            ? `Es la revisión nº ${feedback.attempt} de este producto. `
            : ''}
          Cuando lo corrijas y lo vuelvas a enviar, lo revisaremos de nuevo en unos segundos
          y, si todo está bien, se publicará al momento.
        </p>
        {!onJumpToStep && (
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>
              Corregir ahora
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
