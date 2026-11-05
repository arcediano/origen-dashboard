/**
 * @component AiPhotoField
 * @description Zona de subida de una foto del formulario guiado de Origen
 * Assist: botón grande con aclaración, miniatura con "Cambiar"/"Quitar" y
 * mensaje de error propio.
 */
'use client';

import { useId, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import type { PickedPhoto } from './useAssistedProductForm';

interface AiPhotoFieldProps {
  label: string;
  hint: string;
  photo?: PickedPhoto;
  required?: boolean;
  testId: string;
  /** Devuelve un mensaje de error si el archivo no vale. */
  onPick: (file: File) => string | null;
  onRemove: () => void;
}

export function AiPhotoField({ label, hint, photo, required, testId, onPick, onRemove }: AiPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const hintId = useId();

  const handleChange = (files: FileList | null) => {
    // Leer el archivo ANTES de resetear el input: resetear `value` invalida el FileList en iOS/Safari.
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setError(onPick(file));
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-origen-bosque">
          {label}
          {required && <span className="text-feedback-danger" aria-hidden="true"> *</span>}
        </p>
        {photo && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-origen-hoja">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Foto añadida
          </span>
        )}
      </div>

      {/* "image/*" y no una lista de tipos: iOS Safari se comporta de forma errática con listas concretas. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Elegir foto: ${label}`}
        onChange={(e) => handleChange(e.target.files)}
      />

      {photo ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-2 shadow-sm">
          <img src={photo.previewUrl} alt={label} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-text-subtle">{photo.file.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Cambiar
              </Button>
              {!required && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    onRemove();
                  }}
                  leftIcon={<X className="h-3.5 w-3.5" aria-hidden="true" />}
                >
                  Quitar
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={hintId}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            'border-border-strong/40 bg-surface-alt/60 text-origen-bosque',
            'hover:bg-origen-pastel/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
          )}
        >
          <Camera className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-semibold">Subir o hacer una foto</span>
        </button>
      )}

      <p id={hintId} className="text-xs text-text-subtle">
        {hint}
      </p>
      {error && (
        <p role="alert" className="text-xs font-medium text-feedback-danger">
          {error}
        </p>
      )}
    </div>
  );
}
