/**
 * @component AiProductWizard
 * @description "Origen Assist" como formulario guiado por pasos (2026-11-05):
 * sustituye al chat. El productor responde pregunta a pregunta (con
 * aclaraciones de qué hará la IA con cada respuesta), revisa un resumen y, con
 * un único envío, el backend lee las etiquetas, redacta los textos
 * comerciales y crea el producto en borrador. Al terminar redirige a su ficha.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Progress } from '@arcediano/ux-library';
import { resizeLabelImage } from '@/lib/ai-assist/resize-label-image';
import { AiAssistError, createAssistedProduct } from '@/lib/api/ai-assist';
import {
  QUESTION_STEP_IDS,
  WIZARD_STEP_IDS,
  WIZARD_STEP_LABELS,
  buildAssistedProductInput,
  firstInvalidStep,
  validateStep,
  type WizardStepId,
} from '@/lib/ai-assist/assisted-product';
import { useAssistedProductForm, type PhotoKey } from './useAssistedProductForm';
import {
  DetailsStep,
  IntroStep,
  LabelsStep,
  OriginStep,
  PhotoStep,
  ProductStep,
  ProductionStep,
  ReviewStep,
} from './AiWizardSteps';

interface AiProductWizardProps {
  quota: { used: number; total: number } | null;
  /** Salir del asistente y rellenar el producto a mano. */
  onManual: () => void;
  onRecharge?: () => void;
}

const PROGRESS_MESSAGES = [
  'Subiendo tus fotos…',
  'Leyendo tus etiquetas…',
  'Redactando tu ficha con un tono cuidado…',
  'Preparando tu borrador…',
];
const PROGRESS_INTERVAL_MS = 7000;

function friendlyError(error: unknown): string {
  if (error instanceof AiAssistError) {
    switch (error.code) {
      case 'AI_PRODUCER_QUOTA_EXCEEDED':
        return 'No te quedan créditos del asistente. Recarga para seguir usándolo, o rellena este producto a mano.';
      case 'AI_MONTHLY_CAP_REACHED':
      case 'AI_DISABLED':
      case 'AI_NOT_CONFIGURED':
        return 'El asistente no está disponible ahora mismo. Puedes crear el producto rellenándolo a mano.';
      case 'AI_CALL_FAILED':
        return 'No hemos podido completar el proceso. No se te ha cobrado nada: puedes reintentarlo o crear el producto a mano.';
      default:
        break;
    }
    // Sin respuesta a tiempo: el backend puede haber terminado igualmente, así que se avisa antes de reintentar.
    if (error.status === 0 || error.status === 408 || error.status === 504) {
      return 'Está tardando más de lo normal. Antes de reintentarlo, mira en «Mis productos»: si ya aparece tu borrador, no hace falta repetirlo.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Algo ha ido mal.';
}

export function AiProductWizard({ quota, onManual, onRecharge }: AiProductWizardProps) {
  const router = useRouter();
  const { step, setStep, text, updateText, photos, setPhoto, recoveredAnswers, clearDraft } = useAssistedProductForm();
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  const remainingCredits = quota ? Math.max(0, quota.total - quota.used) : null;
  const quotaExhausted = remainingCredits === 0;
  const stepIndex = WIZARD_STEP_IDS.indexOf(step);
  const questionIndex = QUESTION_STEP_IDS.indexOf(step) + 1;
  const isReview = step === 'review';
  const validationInput = { ...text, hasProductPhoto: !!photos.product };

  useEffect(() => {
    if (!isSubmitting) return;
    setMessageIndex(0);
    const timer = window.setInterval(
      () => setMessageIndex((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1)),
      PROGRESS_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  // Al cambiar de paso, volver al principio del formulario y llevar el foco allí (lectores de pantalla y móvil).
  useEffect(() => {
    frameRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    frameRef.current?.focus({ preventScroll: true });
  }, [step]);

  const goTo = (target: WizardStepId) => {
    setStepError(null);
    setSubmitError(null);
    setStep(target);
  };

  const handleNext = () => {
    const error = validateStep(step, validationInput);
    if (error) {
      setStepError(error);
      return;
    }
    goTo(WIZARD_STEP_IDS[Math.min(stepIndex + 1, WIZARD_STEP_IDS.length - 1)]);
  };

  const handleBack = () => {
    if (stepIndex > 0) goTo(WIZARD_STEP_IDS[stepIndex - 1]);
  };

  const handleSubmit = async () => {
    const invalid = firstInvalidStep(validationInput);
    if (invalid) {
      goTo(invalid);
      setStepError(validateStep(invalid, validationInput));
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setQuotaExceeded(false);
    try {
      const resize = async (key: PhotoKey) => {
        const photo = photos[key];
        return photo ? resizeLabelImage(photo.file) : undefined;
      };
      const [product, nutrition, ingredients, conservation] = await Promise.all(
        (['product', 'nutrition', 'ingredients', 'conservation'] as const).map(resize),
      );
      const result = await createAssistedProduct(
        buildAssistedProductInput(text, {
          product: product as NonNullable<typeof product>,
          nutrition,
          ingredients,
          conservation,
        }),
      );
      clearDraft();
      setIsRedirecting(true);
      const nutritionParam = result.nutritionSource === 'usda' ? '&nutrition=usda' : '';
      router.push(`/dashboard/products/${result.productId}?fromAssistant=1${nutritionParam}`);
    } catch (error) {
      setSubmitError(friendlyError(error));
      setQuotaExceeded(error instanceof AiAssistError && error.code === 'AI_PRODUCER_QUOTA_EXCEEDED');
      setIsSubmitting(false);
    }
  };

  const pickPhoto = (key: PhotoKey) => (file: File) => {
    setStepError(null);
    return setPhoto(key, file);
  };

  if (isSubmitting || isRedirecting) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated" className="flex flex-col items-center gap-4 p-8 text-center sm:p-10" aria-busy="true">
          <Loader2 className="h-9 w-9 animate-spin text-origen-bosque" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-origen-bosque">
            {isRedirecting ? 'Preparando tu ficha…' : 'Origen Assist está creando tu producto'}
          </h2>
          <p role="status" aria-live="polite" className="text-sm text-text-subtle">
            {isRedirecting ? 'Te llevamos a revisarla.' : PROGRESS_MESSAGES[messageIndex]}
          </p>
          {!isRedirecting && (
            <p className="text-xs text-text-subtle">Puede tardar hasta un minuto y medio. No cierres esta página.</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-3xl space-y-4"
    >
      {step !== 'intro' && (
        <div className="rounded-2xl border border-border-subtle bg-white p-3 shadow-sm sm:p-4">
          <Progress
            value={questionIndex}
            max={QUESTION_STEP_IDS.length}
            showLabel
            label={`Paso ${questionIndex} de ${QUESTION_STEP_IDS.length} · ${WIZARD_STEP_LABELS[step]}`}
            size="sm"
          />
        </div>
      )}

      <Card variant="elevated" className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-origen-pastel/40 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-origen-bosque shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="truncate text-sm font-semibold text-origen-bosque">Origen Assist</p>
          </div>
          <Badge variant="neutral" size="xs" className="shrink-0">
            {step === 'intro' ? 'Asistente de IA' : 'En curso'}
          </Badge>
        </div>

        <div ref={frameRef} tabIndex={-1} className="p-4 outline-none sm:p-6">
          {step === 'intro' && <IntroStep remainingCredits={remainingCredits} />}
          {step === 'photo' && (
            <PhotoStep
              photo={photos.product}
              name={text.name}
              recoveredAnswers={recoveredAnswers}
              onPick={pickPhoto('product')}
              onRemove={() => setPhoto('product', null)}
              onName={(value) => updateText('name', value)}
            />
          )}
          {step === 'product' && (
            <ProductStep value={text.productDescription} onChange={(v) => updateText('productDescription', v)} />
          )}
          {step === 'origin' && <OriginStep value={text.originStory} onChange={(v) => updateText('originStory', v)} />}
          {step === 'production' && (
            <ProductionStep value={text.productionProcess} onChange={(v) => updateText('productionProcess', v)} />
          )}
          {step === 'labels' && (
            <LabelsStep photos={photos} onPick={(key, file) => pickPhoto(key)(file)} onRemove={(key) => setPhoto(key, null)} />
          )}
          {step === 'details' && <DetailsStep state={text} onChange={updateText} />}
          {step === 'review' && (
            <ReviewStep
              state={text}
              photos={photos}
              remainingCredits={remainingCredits}
              onEdit={goTo}
              onImprovePhoto={(value) => updateText('improvePhoto', value)}
            />
          )}

          {stepError && (
            <p role="alert" className="mt-4 text-sm font-medium text-feedback-danger">
              {stepError}
            </p>
          )}

          {quotaExhausted && (
            <Alert variant="warning" className="mt-4">
              <AlertTitle>Sin créditos del asistente</AlertTitle>
              <AlertDescription>
                <p>Recarga créditos para usar el asistente, o crea el producto a mano.</p>
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert variant={quotaExceeded ? 'warning' : 'error'} className="mt-4">
              <AlertTitle>{quotaExceeded ? 'Sin créditos del asistente' : 'No se ha podido crear el producto'}</AlertTitle>
              <AlertDescription>
                <p>{submitError}</p>
                {quotaExceeded && onRecharge && (
                  <Button type="button" variant="primary" size="sm" className="mt-2 w-auto" onClick={onRecharge}>
                    Recargar créditos
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-surface-alt/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-2">
            {step !== 'intro' && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
              >
                Atrás
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onManual}>
              Prefiero hacerlo a mano
            </Button>
          </div>

          {isReview ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={quotaExhausted}
              leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            >
              Crear mi producto con IA
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={quotaExhausted}
              rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
            >
              {step === 'intro' ? 'Empezar' : 'Siguiente'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
