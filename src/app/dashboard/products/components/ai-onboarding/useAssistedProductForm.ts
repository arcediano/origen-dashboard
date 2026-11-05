/**
 * Estado del formulario guiado de "Origen Assist": texto + paso actual (se
 * conservan en `sessionStorage` por si el usuario recarga o su sesión
 * caduca a medio camino) y fotos (solo en memoria: no se serializan).
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_TEXT_STATE,
  WIZARD_STEP_IDS,
  type AssistedTextState,
  type WizardStepId,
} from '@/lib/ai-assist/assisted-product';

export const DRAFT_STORAGE_KEY = 'origen-ai-assist-form-v2';
export const MAX_FILE_MB = 10;

export type PhotoKey = 'product' | 'nutrition' | 'ingredients' | 'conservation';

export interface PickedPhoto {
  file: File;
  previewUrl: string;
}

interface StoredDraft {
  step: WizardStepId;
  text: AssistedTextState;
}

function readStoredDraft(): StoredDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed.text || !parsed.step || !WIZARD_STEP_IDS.includes(parsed.step)) return null;
    return { step: parsed.step, text: { ...EMPTY_TEXT_STATE, ...parsed.text } };
  } catch {
    return null;
  }
}

/** Valida el archivo elegido; devuelve el mensaje de error o `null`. */
export function validatePhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen (JPG, PNG o WebP).';
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `La imagen "${file.name}" supera los ${MAX_FILE_MB} MB. Prueba con otra.`;
  }
  return null;
}

export function useAssistedProductForm() {
  const [step, setStep] = useState<WizardStepId>('intro');
  const [text, setText] = useState<AssistedTextState>(EMPTY_TEXT_STATE);
  const [photos, setPhotos] = useState<Partial<Record<PhotoKey, PickedPhoto>>>({});
  const [restored, setRestored] = useState(false);
  const [recoveredAnswers, setRecoveredAnswers] = useState(false);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Recuperar el borrador una sola vez, en cliente (evita desajustes de hidratación).
  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) {
      setText(stored.text);
      // Sin las fotos (solo en memoria) no se puede estar más allá del paso de foto.
      const needsPhotos = stored.step !== 'intro' && stored.step !== 'photo';
      setStep(needsPhotos ? 'photo' : stored.step);
      setRecoveredAnswers(needsPhotos);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, text }));
    } catch {
      // Sin almacenamiento disponible: el formulario sigue funcionando sin persistencia.
    }
  }, [restored, step, text]);

  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((photo) => photo && URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  const updateText = useCallback(<K extends keyof AssistedTextState>(key: K, value: AssistedTextState[K]) => {
    setText((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setPhoto = useCallback((key: PhotoKey, file: File | null): string | null => {
    if (file) {
      const error = validatePhotoFile(file);
      if (error) return error;
    }
    setPhotos((prev) => {
      const previous = prev[key];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      const next = { ...prev };
      if (file) next[key] = { file, previewUrl: URL.createObjectURL(file) };
      else delete next[key];
      return next;
    });
    return null;
  }, []);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // nada que limpiar
    }
  }, []);

  return { step, setStep, text, updateText, photos, setPhoto, restored, recoveredAnswers, clearDraft };
}
