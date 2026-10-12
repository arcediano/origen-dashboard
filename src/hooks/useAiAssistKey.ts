/**
 * Clave de imputación del cupo del asistente de IA (opción A, decisión del humano).
 *
 * El cupo es "N productos asistidos por productor". Al EDITAR un producto se usa
 * su `productId` real. Al CREAR uno nuevo, antes de tener respuesta de la IA el
 * producto aún no existe, así que se usa una clave generada en el navegador que
 * vive lo mismo que el borrador (localStorage) y se descarta cuando el producto
 * se guarda/publica.
 *
 * `assistUsed` indica que en este borrador se ha consumido ya una unidad de cupo
 * (solo modo creación). Desde la petición del humano de 2026-10-09, el backend
 * solo consume el cupo si el borrador queda realmente persistido (`Product`
 * real en estado DRAFT) -- por eso, en la práctica, `assistUsed=true` implica
 * que el producto YA está guardado; abandonar sin pulsar "Guardar" no lo
 * descarta ni pierde la unidad de cupo, solo los cambios hechos en esa pantalla
 * desde que se creó el borrador.
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'origen-nuevo-producto-ai-assist-v1';

interface StoredAssist {
  key: string;
  used: boolean;
}

function readStored(): StoredAssist | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAssist>;
    return typeof parsed.key === 'string' && parsed.key.length >= 8
      ? { key: parsed.key, used: parsed.used === true }
      : null;
  } catch {
    return null;
  }
}

function persist(value: StoredAssist): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* sin localStorage: la clave vive solo en memoria durante esta sesión */
  }
}

/** Quita la clave del borrador (llamar cuando el borrador se guarda o publica). */
export function clearAiAssistDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function useAiAssistKey(productId?: string) {
  const [state, setState] = useState<{ key: string | null; used: boolean }>({
    key: productId ?? null,
    used: false,
  });

  useEffect(() => {
    if (productId) {
      setState({ key: productId, used: false });
      return;
    }
    const stored = readStored();
    if (stored) {
      setState(stored);
      return;
    }
    const fresh: StoredAssist = { key: crypto.randomUUID(), used: false };
    persist(fresh);
    setState(fresh);
  }, [productId]);

  const markUsed = useCallback(() => {
    setState((prev) => {
      if (!prev.key || prev.used) return prev;
      const next = { key: prev.key, used: true };
      if (!productId) persist(next);
      return next;
    });
  }, [productId]);

  return {
    assistKey: state.key,
    /**
     * Cupo consumido por el asistente de IA en modo creación -- el nombre es
     * histórico (de antes de la petición del humano de 2026-10-09): hoy, si
     * esto es `true`, el producto YA está guardado como borrador real (el
     * backend solo consume el cupo tras persistirlo). No implica que nada
     * se vaya a perder si el productor sale sin pulsar "Guardar".
     */
    assistUsedUnsaved: !productId && state.used,
    markUsed,
  };
}
