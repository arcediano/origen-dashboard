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
import { AiCreditsPanel } from './AiCreditsPanel';

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
  // Preparación de la foto principal (fondo blanco, 2000x2000 — petición del
  // humano, 2026-10-08): corre en paralelo con el resto, así que este
  // mensaje puede aparecer en cualquier punto, no solo al final.
  'Preparando tu foto con fondo blanco…',
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
  quota: { used: number; total: number; free?: number; purchased?: number } | null;
  /** Al recibir el borrador de la IA. */
  onDraft: (result: IntakeResult) => void;
  /** El productor prefiere rellenar el formulario a mano. */
  onManual: () => void;
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

  const quickActions = [
    { label: 'Subir foto', action: () => photoInputRef.current?.click() },
    { label: 'Generar desde etiqueta', action: () => labelInputRef.current?.click() },
    { label: 'Crear descripción', action: () => setText((current) => current || 'Queso curado artesanal con leche de oveja, elaborado en Soria y con un proceso tradicional de maduración de 12 meses.') },
    { label: 'Detectar ingredientes', action: () => setText((current) => current || 'Necesito detectar ingredientes, origen y elaboración para preparar una ficha clara y comercial.') },
    { label: 'Categorizar producto', action: () => setText((current) => current || 'Quiero una categoría clara, un formato comercial y una descripción orientada a compra.') },
    { label: 'Extraer información nutricional', action: () => setText((current) => current || 'Extrae información nutricional, alérgenos e ingredientes para completar la ficha de producto.') },
  ];

  const knownFacts = [
    'Nombre del producto',
    'Tipo de producto',
    'Origen',
    'Formato',
  ];

  const pendingFacts = ['Ingredientes', 'Alérgenos', 'Peso', 'Conservación'];

  const processingSteps = [
    'Analizando fotografía',
    'Detectando marca',
    'Identificando formato',
    'Detectando categoría',
    'Generando descripción',
  ];

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
      <div className="mx-auto max-w-4xl">
        <Card variant="elevated" className="overflow-hidden border border-violet-200 bg-white p-0 shadow-[0_18px_60px_rgba(79,70,229,0.08)]" aria-busy="true">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="p-6 sm:p-8" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">Origen Assist</p>
                  <h2 className="text-2xl font-semibold text-slate-900">Preparando tu ficha</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {processingSteps.map((step, index) => {
                  const active = index === messageIndex;
                  const done = index < messageIndex;
                  return (
                    <div
                      key={step}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border px-3 py-2 transition-all',
                        active ? 'border-violet-200 bg-violet-50 text-violet-900 shadow-sm' :
                          done ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500',
                      )}
                    >
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                        active ? 'bg-violet-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600',
                      )}>
                        {done ? '✓' : index + 1}
                      </span>
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 min-h-[1.5rem] text-sm text-slate-600">{PROGRESS_MESSAGES[messageIndex]}</p>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Vista previa</p>
              {photoUrl ? (
                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Producto en proceso" className="h-52 w-full object-cover" />
                </div>
              ) : (
                <div className="mt-4 flex h-52 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-400">
                  <Camera className="h-10 w-10" aria-hidden="true" />
                </div>
              )}
              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Producto</span>
                  <span>En curso</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-violet-500 transition-all" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Ficha en construcción</p>
              </div>
            </div>
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
      className="mx-auto max-w-6xl space-y-6"
    >
      <header className="overflow-hidden rounded-[28px] border border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.12),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f7f7ff_100%)] p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">
                IA
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Crear un nuevo producto con IA</h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Sube una foto o describe tu producto. Origen Assist completará la información y te guiará hasta tener una ficha lista para publicar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
              {['Menos de 2 minutos', 'Descripción automática', 'SEO automático', 'Categorización automática'].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm lg:max-w-md">
            {quota && (
              <AiCreditsPanel
                quota={quotaExceeded ? { ...quota, used: Math.max(quota.used, quota.total) } : quota}
                onRecharge={() => setShowAddCredits(true)}
                onManual={quotaExhausted || quotaExceeded ? onManual : undefined}
                className="border-violet-200 bg-white/90 shadow-[0_12px_40px_rgba(79,70,229,0.08)]"
              />
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Origen Assist</p>
                <p className="text-sm font-medium text-slate-800">Chat</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Menos de 2 min
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-sm text-white shadow-sm">AI</div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-md border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-900">👋 Hola, soy Origen Assist</p>
                <p className="mt-2">
                  Puedo ayudarte a crear una ficha completa de producto a partir de una simple fotografía.
                </p>
                <p className="mt-2">Sube una imagen o cuéntame qué producto quieres vender.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickActions.map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => void handlePhoto(e.target.files)}
              />

              {photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Foto del producto" className="mx-auto max-h-56 w-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    leftIcon={<Camera className="h-4 w-4" aria-hidden="true" />}
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
                    'flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-white px-4 py-8 text-center transition-colors hover:bg-violet-50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300',
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <Camera className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-base font-medium text-slate-900">Subir foto del producto</span>
                  <span className="text-xs text-slate-500">JPG, PNG o WebP · máx. {MAX_FILE_MB} MB</span>
                </button>
              )}

              {photoError && (
                <p role="alert" className="mt-2 text-xs text-red-600">{photoError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Tu mensaje</span>
                <span>{trimmedLength}/{MAX_TEXT}</span>
              </div>
              <Textarea
                aria-labelledby="intake-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[110px] border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                placeholder="Describe tu producto, origen, formato, ingredientes o cualquier detalle que quieras incluir..."
                maxLength={MAX_TEXT}
              />
              <p className="mt-2 text-xs text-slate-500">
                {trimmedLength < MIN_TEXT
                  ? `Escribe al menos ${MIN_TEXT} caracteres para que la IA pueda preparar una ficha útil.`
                  : 'La IA corregirá y enriquecerá la información sin inventar datos.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Adjuntos</span>
                </div>
                <span className="text-xs text-slate-500">{labels.length}/{MAX_LABEL_PHOTOS}</span>
              </div>

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
                    className="flex h-20 min-w-[5.5rem] items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    {labels.length === 0 ? <ScanLine className="h-4 w-4" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
                    {labels.length === 0 ? 'Etiqueta' : 'Otra'}
                  </button>
                )}
              </div>
            </div>

            {labels.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Código de barras</div>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                  placeholder="Ej.: 8412345678901"
                  leftIcon={<Barcode className="w-4 h-4" aria-hidden="true" />}
                  error={barcodeInvalid ? 'El código debe tener 8, o entre 12 y 14 dígitos.' : undefined}
                  maxLength={14}
                />
              </div>
            )}

            {error && (
              <Alert variant={quotaExceeded ? 'warning' : 'error'}>
                <AlertTitle>{quotaExceeded ? 'Sin créditos del asistente' : 'No hemos podido preparar la ficha'}</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <Send className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>Listo para crear con IA</span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onManual}>
                  Yo lo relleno
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                  leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                >
                  Crear con IA
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Lo que ya sabemos</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">OK</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {knownFacts.map((fact) => (
                <li key={fact} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Pendiente por completar</h2>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">4</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {pendingFacts.map((fact) => (
                <li key={fact} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/60 px-3 py-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-700">!</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 p-4">
              <h2 className="text-base font-semibold text-slate-900">Vista previa viva</h2>
            </div>
            <div className="p-4">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Vista previa del producto" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100 text-slate-400">
                    <Camera className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">Queso de oveja curado</p>
                  </div>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">Premium</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-2.5 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Categoría</span>
                    <span className="mt-1 block font-medium text-slate-800">Quesos</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-2.5 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Productor</span>
                    <span className="mt-1 block font-medium text-slate-800">Origen</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Etiquetas</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Artisan', 'Local', 'Sin gluten', 'Premium'].map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="rounded-2xl bg-slate-50 px-2.5 py-2 text-sm leading-6 text-slate-600">
                  Queso curado de oveja elaborado con leche local, madurado lentamente para lograr un sabor intenso y una textura cremosa.
                </p>
              </div>
            </div>
          </div>
        </aside>
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
    </motion.div>
  );
}
