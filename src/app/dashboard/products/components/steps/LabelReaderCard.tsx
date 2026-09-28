/**
 * @component LabelReaderCard
 * @description Asistente de IA (F1): lee la etiqueta de un producto a partir de
 *              1-2 fotos y PRERRELLENA el paso de información nutricional.
 *              La IA solo propone: el productor siempre revisa y confirma.
 *              Se oculta si el asistente no está disponible (apagado, sin clave
 *              o sin permiso).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Card } from '@arcediano/ux-library';
import { Camera, ScanLine, Sparkles, X } from 'lucide-react';
import {
  AiAssistError,
  getAiAssistQuota,
  readLabel,
} from '@/lib/api/ai-assist';
import {
  proposalToPatches,
  unreadableFieldNames,
  type AiAssistQuota,
  type FieldPatch,
  type LabelReadingResponse,
} from '@/lib/ai-assist/label-proposal';
import { resizeLabelImage } from '@/lib/ai-assist/resize-label-image';
import type { NutritionalInfo } from '@/types/product';

const MAX_PHOTOS = 2;

interface LabelReaderCardProps {
  /** Clave de imputación del cupo: productId real (edición) o clave del borrador (creación). */
  assistKey: string | null;
  nutritionalInfo: Pick<NutritionalInfo, 'servingSizeValue' | 'servingSizeUnit'>;
  /** Aplica al formulario los campos leídos. */
  onApply: (patches: FieldPatch[]) => void;
  /** Avisa de que este producto ya ha consumido cupo (para el aviso al abandonar). */
  onUsed?: () => void;
}

export function LabelReaderCard({
  assistKey,
  nutritionalInfo,
  onApply,
  onUsed,
}: LabelReaderCardProps) {
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    { appliedCount: number; response: LabelReadingResponse } | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!assistKey) return;
    let cancelled = false;
    getAiAssistQuota()
      .then((q) => !cancelled && setQuota(q))
      .catch(() => !cancelled && setQuota(null)); // sin permiso o servicio caído → se oculta
    return () => {
      cancelled = true;
    };
  }, [assistKey]);

  if (!assistKey || !quota?.enabled) return null;

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    // Copiar ANTES de vaciar el input: `FileList` es una colección en vivo y
    // `value = ''` la deja vacía antes de que React ejecute el updater.
    const picked = Array.from(list);
    setError(null);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRead = async () => {
    if (files.length === 0 || isReading) return;
    setIsReading(true);
    setError(null);
    setResult(null);
    try {
      const images = await Promise.all(files.map(resizeLabelImage));
      const response = await readLabel(assistKey, images);
      const patches = proposalToPatches(response.proposal, nutritionalInfo);
      onApply(patches);
      onUsed?.();
      setQuota((q) => (q ? { ...q, used: response.quota.used, total: response.quota.total } : q));
      setResult({ appliedCount: patches.length, response });
      setFiles([]);
    } catch (err) {
      // El uso se consume aunque la etiqueta no se lea (la llamada se cobró).
      if (err instanceof AiAssistError && err.code === 'AI_LABEL_UNREADABLE') onUsed?.();
      setError(err instanceof Error ? err.message : 'No se ha podido leer la etiqueta.');
    } finally {
      setIsReading(false);
    }
  };

  const unreadable = result ? unreadableFieldNames(result.response.unreadableFields) : [];

  return (
    <Card variant="flat" className="mb-6 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 text-origen-bosque flex items-center justify-center shrink-0">
          <ScanLine className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-origen-bosque">
            Leer etiqueta con IA
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sube 1 o 2 fotos de la etiqueta (ingredientes y tabla nutricional) y
            rellenamos este paso por ti. Tú revisas y confirmas siempre.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Has usado el asistente en {quota.used} de {quota.total} productos. Cada
            producto en el que lo uses cuenta como uno; puedes repetir la lectura
            en el mismo producto sin gastar más.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          id="label-photos"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isReading || files.length >= MAX_PHOTOS}
        />
        <Button
          type="button"
          variant="outline"
          leftIcon={<Camera className="w-4 h-4" aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
          disabled={isReading || files.length >= MAX_PHOTOS}
          className="min-h-[44px]"
        >
          {files.length === 0 ? 'Añadir fotos' : 'Añadir otra foto'}
        </Button>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
          onClick={handleRead}
          disabled={files.length === 0}
          loading={isReading}
          loadingText="Leyendo etiqueta…"
          className="min-h-[44px]"
        >
          Leer etiqueta
        </Button>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fotos seleccionadas">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-full border border-border-subtle bg-white pl-3 pr-1 py-1 text-xs text-foreground max-w-full"
            >
              <span className="truncate max-w-[12rem]">{file.name}</span>
              <button
                type="button"
                aria-label={`Quitar ${file.name}`}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={isReading}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <Alert variant="error" className="mt-4">
          <AlertTitle>No se ha podido leer la etiqueta</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant="warning" className="mt-4">
          <AlertTitle>Revisa los datos antes de continuar</AlertTitle>
          <AlertDescription>
            <p>
              Hemos rellenado {result.appliedCount} campos a partir de las fotos.
              La IA puede equivocarse: comprueba especialmente los{' '}
              <strong>alérgenos</strong>, de los que eres responsable legalmente.
            </p>
            {unreadable.length > 0 && (
              <p className="mt-2">
                No hemos podido leer: {unreadable.join(', ')}. Rellénalos a mano.
              </p>
            )}
            {result.response.notes && <p className="mt-2">{result.response.notes}</p>}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
