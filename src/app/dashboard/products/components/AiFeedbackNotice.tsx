/**
 * @file AiFeedbackNotice.tsx
 * @description Aviso "Hay datos que debes corregir": lo que la validación de
 * IA (o un administrador al revertir) ha marcado como incorrecto en un
 * producto, con atajo al paso del formulario de cada campo. Al corregir y
 * reenviar, la IA lo revisa de nuevo en segundos.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Edit, ImagePlus, Send, Sparkles } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import type { AiFeedback } from '@/lib/api/products';
import { FORM_STEPS, type FormStepId } from '@/types/product';
import {
  AiAssistError,
  getAiAssistQuota,
  regenerateProductPhoto,
  type RegeneratedProductPhoto,
} from '@/lib/api/ai-assist';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import { MAIN_PHOTO_REQUIREMENTS, validateMainPhoto } from '@/lib/products/photo-requirements';
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
 * Bloqueo de la foto principal. Móvil primero: miniatura + título en una fila, el motivo técnico
 * plegado, y una sola tarjeta con la opción recomendada (IA) a ancho completo; subir otra foto
 * queda como acción secundaria. Los colores son explícitos: dentro del aviso naranja el texto no
 * debe heredar el tono del contenedor.
 */
function PhotoBlock({
  productId,
  imageUrl,
  reason,
  unrelated = false,
  onRegenerated,
  onResubmit,
  onUploadFile,
  onManualUpload,
  editHref,
}: {
  productId: string;
  imageUrl?: string;
  /** Motivo técnico de la IA, ya limpio, para explicar qué falla. */
  reason: string;
  /** La foto no tiene relación con el producto: la IA no puede generar nada a partir de ella. */
  unrelated?: boolean;
  /** Recibe la foto generada y la deja como principal (en el formulario o guardándola). */
  onRegenerated: (photo: RegeneratedProductPhoto) => void | Promise<void>;
  /** Detalle del producto: tras guardar la foto nueva ofrece volver a publicar en un clic. */
  onResubmit?: () => void | Promise<void>;
  /** Foto elegida por el productor (ya validada): la deja como principal. Sin esto cae a `onManualUpload`/enlace. */
  onUploadFile?: (file: File, previewUrl: string) => void | Promise<void>;
  /** Alternativa sin subida directa: salta al paso de imágenes. */
  onManualUpload?: () => void;
  editHref: string;
}) {
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);
  const [busy, setBusy] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const done = newUrl !== null;
  const [error, setError] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedByUser, setUploadedByUser] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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
      await onRegenerated(photo);
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

  const handleFile = async (file: File | undefined) => {
    if (!file || !onUploadFile) return;
    setError(null);
    const problem = await validateMainPhoto(file);
    if (problem) {
      setError(problem);
      return;
    }
    setUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      await onUploadFile(file, preview);
      setNewUrl(preview);
      setUploadedByUser(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar la foto.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const resubmit = async () => {
    if (!onResubmit) return;
    setResubmitting(true);
    try {
      await onResubmit();
    } finally {
      setResubmitting(false);
    }
  };

  const manualButton = (variant: 'primary' | 'outline', label: string) => {
    if (onUploadFile) {
      return (
        <>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label="Elegir la foto principal"
            data-testid="ai-photo-file"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button
            variant={variant}
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            loading={uploading}
            loadingText="Subiendo..."
            data-testid="ai-photo-manual"
          >
            {label}
          </Button>
        </>
      );
    }
    return onManualUpload ? (
      <Button
        variant={variant}
        size="sm"
        className="w-full sm:w-auto"
        leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
        onClick={onManualUpload}
        data-testid="ai-photo-manual"
      >
        {label}
      </Button>
    ) : (
      <Link href={editHref} className="block">
        <Button
          variant={variant}
          size="sm"
          className="w-full sm:w-auto"
          leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
          data-testid="ai-photo-manual"
        >
          {label}
        </Button>
      </Link>
    );
  };

  const requirements = (
    <div
      className="rounded-xl border border-border bg-surface-alt p-3 text-foreground"
      data-testid="ai-photo-requirements"
    >
      <p className="text-sm font-semibold">Para que la foto sea aceptada</p>
      <ul className="mt-1.5 space-y-1 text-xs text-text-subtle">
        {MAIN_PHOTO_REQUIREMENTS.map((r) => (
          <li key={r} className="flex gap-1.5">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hoja-tinta" aria-hidden="true" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div
      className="space-y-3 rounded-2xl border border-border bg-surface p-3 text-foreground"
      data-testid={unrelated ? 'ai-photo-unrelated' : 'ai-photo-block'}
    >
      <div className="flex items-center gap-3">
        {(newUrl ?? imageUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(newUrl ?? imageUrl) as string}
            alt={done ? 'Foto principal nueva' : 'Foto principal actual'}
            className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover sm:h-20 sm:w-20"
          />
        )}
        <p className="min-w-0 text-sm font-semibold leading-snug text-foreground">
          {done
            ? 'Foto nueva lista'
            : unrelated
              ? 'La foto no tiene relación con el producto'
              : 'La foto principal no cumple el estándar de catálogo'}
        </p>
      </div>

      {done && (
        <p className="text-sm text-foreground" data-testid="ai-photo-done">
          {onResubmit
            ? uploadedByUser
              ? 'Tu foto está guardada como foto principal. Solo falta volver a publicar para que la revisemos.'
              : 'Ya la hemos puesto como foto principal de tu ficha. Solo falta volver a publicar.'
            : uploadedByUser
              ? 'Tu foto ya es la foto principal de la ficha. Pulsa «Guardar» o vuelve a publicar para que la revisemos.'
              : 'La hemos puesto como foto principal de tu ficha: revísala en «Imágenes» y vuelve a publicar para que la IA la compruebe.'}
        </p>
      )}

      {!done && unrelated && (
        <p className="text-sm text-foreground" data-testid="ai-photo-unrelated-note">
          {reason && <>{reason} </>}
          El asistente de IA no puede generar una foto de producto a partir de una imagen que no
          corresponde a este producto: <strong>no se ha usado ningún crédito</strong>.
        </p>
      )}

      {!done && !unrelated && reason && (
        <details className="group text-sm text-foreground">
          <summary className="cursor-pointer select-none font-medium text-feedback-info-text underline underline-offset-2">
            Ver por qué
          </summary>
          <p className="mt-1.5 text-text-subtle">{reason}</p>
        </details>
      )}

      {done ? (
        onResubmit && (
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            onClick={resubmit}
            loading={resubmitting}
            loadingText="Enviando..."
            data-testid="ai-photo-resubmit"
          >
            Volver a publicar
          </Button>
        )
      ) : unrelated ? (
        <div className="space-y-2">
          {requirements}
          {manualButton('primary', 'Subir una foto real del producto')}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl border border-border bg-surface-alt p-3">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-hoja-tinta" aria-hidden="true" />
                Que lo haga la IA
              </span>
              <span className="rounded-full bg-feedback-success-subtle px-2 py-0.5 text-[11px] font-medium text-feedback-success-text">
                Recomendado
              </span>
            </p>
            <p className="mt-1 min-h-[2.5rem] text-xs text-text-subtle">
              Foto cuadrada con fondo blanco, a partir de la tuya. Es el mismo producto: no inventa
              nada. <strong className="text-foreground">1 crédito</strong>
              {remaining !== null ? (
                <>
                  {' · '}
                  {noCredits
                    ? 'no te quedan'
                    : `te ${remaining === 1 ? 'queda' : 'quedan'} ${remaining}`}
                </>
              ) : (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-3 w-24 animate-pulse rounded bg-border align-middle"
                />
              )}
              {remaining !== null && '.'}
            </p>
            <div className="mt-2.5">
              {noCredits ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={() => setShowCredits(true)}
                >
                  Conseguir créditos
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={generate}
                  // Hasta conocer el cupo el botón ocupa su sitio pero no se puede pulsar (no cambia de
                  // «Generar» a «Conseguir créditos» de golpe).
                  disabled={busy || unavailable || quota === null}
                  loading={busy}
                  loadingText="Generando foto..."
                  data-testid="ai-photo-generate"
                >
                  Generar con IA · 1 crédito
                </Button>
              )}
            </div>
            {unavailable && (
              <p className="mt-2 text-xs text-text-subtle">
                El asistente de IA no está disponible ahora mismo. Puedes subir otra foto.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Subir otra foto yo
              <span className="text-xs font-normal text-text-subtle">· gratis</span>
            </p>
            <div className="mt-2">{requirements}</div>
            <div className="mt-2.5">{manualButton('outline', onUploadFile ? 'Elegir foto' : 'Subir otra foto')}</div>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-feedback-danger-text">
          {error}
        </p>
      )}
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
      className="rounded-2xl border border-border bg-surface p-3 text-foreground"
      data-testid="ai-allergen-suggestion"
    >
      <p className="text-sm font-semibold text-foreground">Alérgenos: confirma esta recomendación</p>
      <p className="mt-1 text-sm text-foreground">{message}</p>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Alérgenos recomendados">
        {values.map((v) => (
          <li
            key={v}
            className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground"
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

/** Del mensaje técnico de la IA deja solo el motivo (sin la invitación final, que ahora son los botones). */
export function photoReason(message: string): string {
  const inParens = message.match(/\(([^]*)\)\.\s*Sube otra foto/);
  const text = (inParens ? inParens[1] : message.replace(/\s*Sube otra foto[^]*$/, '')).trim();
  return text.replace(/^la foto principal no cumple el estándar de catálogo\s*/i, '').trim();
}

/** Mensaje de «sin relación»: la parte que dice qué se ve en la foto; el resto lo explica la tarjeta. */
export function unrelatedReason(message: string): string {
  const seen = message.match(/\(se ve: ([^)]*)\)/);
  return seen ? `En la foto se ve ${seen[1].trim()}.` : '';
}

/**
 * Marcador de sitio del aviso mientras llega el feedback de la IA (el producto ya sabe que lo tiene):
 * misma caja y altura aproximada, para que al aparecer el contenido no se desplace nada.
 */
export function AiFeedbackNoticeSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando las correcciones de tu producto"
      className="mb-4 space-y-3 rounded-2xl border border-amber-200 bg-feedback-warning-subtle p-3 sm:p-4"
      data-testid="ai-feedback-skeleton"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-feedback-warning-text" aria-hidden="true" />
        <div className="w-full space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-amber-200/70" />
          <div className="h-3 w-full max-w-md animate-pulse rounded bg-amber-200/50" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
    </section>
  );
}

export function AiFeedbackNotice({
  feedback,
  productId,
  onJumpToStep,
  onPhotoRegenerated,
  onResubmit,
  onUploadPhoto,
  currentAllergens = [],
  onApplyAllergens,
}: {
  feedback: AiFeedback;
  productId: string;
  /** En el formulario de edición: salta al paso. En el detalle, el atajo enlaza a la edición. */
  onJumpToStep?: (step: FormStepId) => void;
  /**
   * Recibe la foto generada por la IA para dejarla como principal: en la edición la pone en el
   * formulario; en el detalle la guarda en el producto.
   */
  onPhotoRegenerated?: (photo: RegeneratedProductPhoto) => void | Promise<void>;
  /** Detalle: vuelve a enviar a revisión tras guardar la foto nueva. */
  onResubmit?: () => void | Promise<void>;
  /** Foto elegida por el productor (ya validada: tamaño, proporción, tipo): la deja como principal. */
  onUploadPhoto?: (file: File, previewUrl: string) => void | Promise<void>;
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
  const partial = feedback.kind === 'PARTIAL';
  const plain = feedback.problems.filter((p) => p !== allergenProblem && p !== photoProblem);
  const total = feedback.problems.length;
  const editHref = `/dashboard/products/${productId}/edit`;
  const aiCanHelp =
    !reverted && !partial && ((photoProblem && !photoProblem.unrelated) || allergenProblem);

  // Contenedor propio (no el Alert de la librería): el Alert tiñe de naranja TODO su contenido
  // y las tarjetas internas quedaban ilegibles. Aquí solo el borde y la cabecera llevan el tono.
  const tone = reverted
    ? 'border-red-200 bg-feedback-danger-subtle'
    : 'border-amber-200 bg-feedback-warning-subtle';
  const toneText = reverted ? 'text-feedback-danger-text' : 'text-feedback-warning-text';

  return (
    <section
      aria-labelledby="ai-feedback-title"
      className={`mb-4 space-y-3 rounded-2xl border p-3 text-foreground sm:p-4 ${tone}`}
      data-testid="ai-feedback-notice"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${toneText}`} aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="ai-feedback-title" className={`text-base font-semibold leading-snug ${toneText}`}>
            {reverted
              ? 'Un administrador ha revertido la publicación'
              : partial
                ? 'Hemos publicado parte de tus cambios'
                : 'Hay datos que debes corregir'}
          </h2>
          {partial && (
            <p className="mt-0.5 text-sm text-foreground" data-testid="ai-partial-note">
              Lo que estaba bien ya está publicado y tu producto sigue a la venta. Solo{' '}
              {total === 1 ? 'queda 1 campo' : `quedan ${total} campos`} por rehacer:
            </p>
          )}
          {!reverted && !partial && (
            <p className="mt-0.5 text-sm text-foreground">
              {total === 1 ? 'Solo hay 1 cosa' : `Hay ${total} cosas`} que ajustar para publicarlo
              {aiCanHelp ? ' y la IA te lo pone fácil: elige una opción de abajo.' : '.'}
            </p>
          )}
        </div>
      </div>

      {plain.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
          {plain.map((p, i) => {
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
      )}
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
          reason={
            photoProblem.unrelated
              ? unrelatedReason(photoProblem.message)
              : photoReason(photoProblem.message)
          }
          unrelated={photoProblem.unrelated === true}
          onRegenerated={onPhotoRegenerated}
          onResubmit={onResubmit}
          onUploadFile={onUploadPhoto}
          onManualUpload={onJumpToStep ? () => onJumpToStep('images') : undefined}
          editHref={editHref}
        />
      )}
      <p className="text-xs text-text-subtle">
        {feedback.attempt > 1 ? `Es la revisión nº ${feedback.attempt} de este producto. ` : ''}
        {partial
          ? 'Cuando rehagas ese campo, lo revisaremos de nuevo en unos segundos y, si todo está bien, se publicará al momento.'
          : 'Cuando lo corrijas y lo vuelvas a enviar, lo revisaremos de nuevo en unos segundos y, si todo está bien, se publicará al momento.'}
      </p>
      {!onJumpToStep && !photoProblem && (
        <Link href={editHref} className="block sm:inline-block">
          <Button variant="outline" size="sm" fullWidth leftIcon={<Edit className="h-3.5 w-3.5" />}>
            Corregir ahora
          </Button>
        </Link>
      )}
    </section>
  );
}
