/**
 * @component AiProductIntake
 * @description Primera pantalla del alta de producto con IA (estilo "sube una
 * foto y cuéntanos qué es"): foto del producto + texto breve + (opcional) fotos
 * de la etiqueta. Con eso el asistente prepara la ficha completa, que el
 * productor revisa en `AiProductReview`. También ofrece rellenarlo a mano.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Barcode, Camera, Coins, ImagePlus, Loader2, ScanLine, Sparkles, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, Button, Card, Input, Textarea } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { resizeLabelImage } from '@/lib/ai-assist/resize-label-image';
import { AiAssistError, draftProduct } from '@/lib/api/ai-assist';
import type { ProductDraftResponse } from '@/lib/ai-assist/product-draft';
import {
  IMAGE_QUALITY_PRESETS,
  buildImageResolutionError,
  getImageDimensions,
} from '@/lib/validations/image-quality';
import { AddCreditsModal } from './AddCreditsModal';

const MAX_LABEL_PHOTOS = 2;
const MIN_TEXT = 10;
const MAX_TEXT = 2000;
const MAX_FILE_MB = 10;
const BARCODE_RE = /^\d{8}$|^\d{12,14}$/;

const PROGRESS_MESSAGES = [
  'Mirando tu foto…',
  'Leyendo los detalles que nos has contado…',
  'Redactando la descripción…',
  'Clasificando tu producto…',
  'Ordenando ingredientes e información nutricional…',
];

/** Mismo mensaje tanto si lo detecta el cupo ya cargado (antes de generar) como si lo rechaza el backend al intentarlo. */
const QUOTA_EXCEEDED_MESSAGE =
  'Has alcanzado el máximo de productos con asistente de IA. Compra más créditos para seguir usándolo, o rellena este producto a mano.';

/** Mensajes claros por código de error del backend; el resto usa el mensaje ya en español. */
function friendlyError(error: unknown): string {
  if (error instanceof AiAssistError) {
    switch (error.code) {
      case 'AI_PRODUCER_QUOTA_EXCEEDED':
        return QUOTA_EXCEEDED_MESSAGE;
      case 'AI_MONTHLY_CAP_REACHED':
      case 'AI_DISABLED':
      case 'AI_NOT_CONFIGURED':
        return 'El asistente no está disponible ahora mismo. Puedes crear el producto rellenándolo a mano.';
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : 'No se ha podido preparar la ficha.';
}

export interface IntakeResult {
  response: ProductDraftResponse;
  /** Foto del producto tal como la eligió el productor (se sube al guardar). */
  productPhoto: File;
}

interface AiProductIntakeProps {
  /** Clave de imputación del cupo (borrador en el navegador). */
  assistKey: string | null;
  quota: { used: number; total: number } | null;
  /** Al recibir el borrador de la IA. */
  onDraft: (result: IntakeResult) => void;
  /** El productor prefiere rellenar el formulario a mano. */
  onManual: () => void;
  /** Borrador local a medias: se ofrece continuarlo o descartarlo sin saltarse el asistente. */
  pendingDraft?: { name: string; onResume: () => void; onDiscard: () => void };
  /** Tras comprar créditos (webhook ya confirmado): refresca el cupo mostrado. */
  onCreditsPurchased?: () => void;
}

function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function LabelThumb({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled: boolean }) {
  const url = useObjectUrl(file);
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-origen-pastel">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="Foto de la etiqueta" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Quitar foto de la etiqueta"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-origen-oscuro shadow-sm before:absolute before:-inset-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AiProductIntake({
  assistKey,
  quota,
  onDraft,
  onManual,
  pendingDraft,
  onCreditsPurchased,
}: AiProductIntakeProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [labels, setLabels] = useState<File[]>([]);
  const [text, setText] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const photoUrl = useObjectUrl(photo);

  useEffect(() => {
    if (!isGenerating) return;
    setMessageIndex(0);
    const timer = setInterval(
      () => setMessageIndex((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1)),
      6000,
    );
    return () => clearInterval(timer);
  }, [isGenerating]);

  const trimmedLength = text.trim().length;
  const trimmedBarcode = barcode.trim();
  const barcodeInvalid = trimmedBarcode.length > 0 && !BARCODE_RE.test(trimmedBarcode);
  // Se sabe de antemano por el cupo ya cargado, sin esperar a que el backend
  // rechace el intento — así el aviso (y el acceso a comprar créditos) sale
  // nada más abrirse el asistente, no solo tras un primer intento fallido.
  const quotaExhausted = !!quota && quota.used >= quota.total;
  const canSubmit =
    !!photo &&
    trimmedLength >= MIN_TEXT &&
    !!assistKey &&
    !isGenerating &&
    !barcodeInvalid &&
    !quotaExhausted;

  const handlePhoto = async (list: FileList | null) => {
    const file = list?.[0];
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('El archivo debe ser una imagen (JPG, PNG o WebP).');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setPhotoError(`La imagen supera los ${MAX_FILE_MB} MB. Prueba con otra.`);
      return;
    }
    // Misma exigencia de resolución que la galería: si no, la foto no se podría publicar.
    try {
      const dimensions = await getImageDimensions(file);
      const req = IMAGE_QUALITY_PRESETS.productImage;
      if (dimensions.width < req.minDimensions.width || dimensions.height < req.minDimensions.height) {
        setPhotoError(buildImageResolutionError(file.name, dimensions, req));
        return;
      }
    } catch {
      setPhotoError('No hemos podido abrir la imagen. Prueba con otra.');
      return;
    }
    setPhoto(file);
    setError(null);
  };

  const handleLabels = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (labelInputRef.current) labelInputRef.current.value = '';
    setLabels((prev) => [...prev, ...picked].slice(0, MAX_LABEL_PHOTOS));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !photo || !assistKey) return;
    setIsGenerating(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const [productImage, ...labelImages] = await Promise.all(
        [photo, ...labels].map(resizeLabelImage),
      );
      const response = await draftProduct(assistKey, {
        text: text.trim(),
        productImage,
        ...(labelImages.length > 0 && { labelImages }),
        // El backend solo lo usa si no hay fotos de etiqueta.
        ...(labelImages.length === 0 && trimmedBarcode && { barcode: trimmedBarcode }),
      });
      onDraft({ response, productPhoto: photo });
    } catch (err) {
      setError(friendlyError(err));
      setQuotaExceeded(err instanceof AiAssistError && err.code === 'AI_PRODUCER_QUOTA_EXCEEDED');
      setIsGenerating(false);
    }
  };

  // ── Generando ─────────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated" className="p-6 sm:p-10" aria-busy="true">
          <div className="flex flex-col items-center text-center gap-5" role="status" aria-live="polite">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-origen-pradera/10 text-origen-bosque">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-origen-bosque">Preparando tu ficha</h2>
              <p className="min-h-[1.5rem] text-sm text-muted-foreground">{PROGRESS_MESSAGES[messageIndex]}</p>
            </div>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" aria-hidden="true" className="h-28 w-28 rounded-2xl object-cover shadow-subtle" />
            )}
            <p className="text-xs text-text-subtle">Puede tardar hasta un minuto. No cierres esta página.</p>
          </div>
        </Card>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {pendingDraft && (
        <Alert>
          <AlertTitle>Tienes un borrador sin terminar</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              {pendingDraft.name ? `«${pendingDraft.name}»` : 'Un producto a medias'}: puedes continuarlo o
              descartarlo para empezar de nuevo con el asistente.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" size="sm" onClick={pendingDraft.onResume}>
                Continuar borrador
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={pendingDraft.onDiscard}>
                Descartar y empezar de nuevo
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card variant="elevated" className="p-4 sm:p-6 space-y-7">
        {/* 1. Foto */}
        <section aria-labelledby="intake-photo">
          <h3 id="intake-photo" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
            1 · Foto del producto
          </h3>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void handlePhoto(e.target.files)}
          />
          {photoUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-origen-pastel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Foto del producto" className="mx-auto max-h-72 w-full object-contain" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                leftIcon={<Camera className="w-4 h-4" aria-hidden="true" />}
                className="absolute bottom-3 right-3 w-auto"
              >
                Cambiar foto
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className={cn(
                'flex min-h-[176px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-strong/40',
                'bg-origen-pastel/40 px-4 py-8 text-center transition-colors hover:bg-origen-pastel/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-origen-bosque shadow-subtle">
                <Camera className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-origen-bosque">Añade una foto de tu producto</span>
              <span className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. {MAX_FILE_MB} MB</span>
            </button>
          )}
          {photoError && (
            <p role="alert" className="mt-2 text-xs text-feedback-danger">{photoError}</p>
          )}
        </section>

        {/* 2. Texto */}
        <section aria-labelledby="intake-text">
          <h3 id="intake-text" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
            2 · Cuéntanos qué es
          </h3>
          <Textarea
            aria-labelledby="intake-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px]"
            placeholder="Ej.: Queso curado de oveja, 12 meses de curación, elaborado en Soria con leche de nuestras ovejas. Piezas de 1,2 kg aproximadamente."
            maxLength={MAX_TEXT}
            showCharCount
            helperText={
              trimmedLength < MIN_TEXT
                ? `Escribe al menos ${MIN_TEXT} caracteres. Cuantos más detalles (origen, elaboración, formato), mejor ficha.`
                : 'Solo usaremos lo que escribas: no inventamos datos. Corregimos la ortografía por ti.'
            }
          />
        </section>

        {/* 3. Etiqueta */}
        <section aria-labelledby="intake-label">
          <h3 id="intake-label" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
            3 · Etiqueta <span className="normal-case tracking-normal font-normal">(opcional)</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            ¿Tienes la etiqueta? Sube fotos de los ingredientes y la información nutricional y las leemos por ti.
          </p>
          <input
            ref={labelInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => handleLabels(e.target.files)}
          />
          <div className="flex flex-wrap items-center gap-3">
            {labels.map((file, i) => (
              <LabelThumb
                key={`${file.name}-${file.lastModified}-${i}`}
                file={file}
                disabled={isGenerating}
                onRemove={() => setLabels((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            {labels.length < MAX_LABEL_PHOTOS && (
              <button
                type="button"
                onClick={() => labelInputRef.current?.click()}
                className="flex h-20 min-w-[5rem] items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong/40 bg-origen-pastel/40 px-4 text-sm font-medium text-origen-bosque transition-colors hover:bg-origen-pastel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
              >
                {labels.length === 0 ? <ScanLine className="h-5 w-5" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
                {labels.length === 0 ? 'Añadir etiqueta' : 'Añadir otra'}
              </button>
            )}
          </div>
        </section>

        {/* 4. Código de barras — solo si no hay foto de etiqueta */}
        {labels.length === 0 && (
          <section aria-labelledby="intake-barcode">
            <h3 id="intake-barcode" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
              4 · Código de barras <span className="normal-case tracking-normal font-normal">(opcional)</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Si tu producto tiene un código de barras real (EAN), lo buscamos en Open Food Facts para proponerte ingredientes y nutrición ya reales — tú los confirmas igual.
            </p>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="Ej.: 8412345678901"
              leftIcon={<Barcode className="w-4 h-4" aria-hidden="true" />}
              error={barcodeInvalid ? 'El código debe tener 8, o entre 12 y 14 dígitos.' : undefined}
              maxLength={14}
            />
          </section>
        )}

        {!error && quotaExhausted && (
          <Alert variant="error">
            <AlertTitle>Sin créditos para el asistente de IA</AlertTitle>
            <AlertDescription>
              <p>{QUOTA_EXCEEDED_MESSAGE}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-auto"
                leftIcon={<Coins className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setShowAddCredits(true)}
              >
                Comprar créditos
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            <AlertTitle>No hemos podido preparar la ficha</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              {quotaExceeded && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-auto"
                  leftIcon={<Coins className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => setShowAddCredits(true)}
                >
                  Comprar créditos
                </Button>
              )}
            </AlertDescription>
          </Alert>
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

        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
          >
            Crear con IA
          </Button>
          {quota && !quotaExhausted && (
            <p className="text-center text-xs text-text-subtle">
              Cuenta como 1 de tus {quota.total} productos con asistente (has usado {quota.used}). Puedes repetir en este mismo producto sin gastar más.
            </p>
          )}
          <div className="text-center">
            <Button type="button" variant="ghost" size="sm" onClick={onManual}>
              Prefiero rellenarlo yo
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
