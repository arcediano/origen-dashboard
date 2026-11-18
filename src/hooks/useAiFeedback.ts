'use client';

import { useEffect, useState } from 'react';
import { getAiFeedback, type AiFeedback } from '@/lib/api/products';

/**
 * Feedback de la validación de IA del producto (solo si `enabled`, p. ej. en borrador), con el
 * estado de carga: así la pantalla puede reservar el sitio del aviso en vez de que aparezca de golpe.
 */
export function useAiFeedbackState(productId: string | undefined, enabled: boolean, refreshKey?: string) {
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!productId || !enabled) {
      setFeedback(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getAiFeedback(productId)
      .then((res) => {
        if (active) setFeedback(res.data ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId, enabled, refreshKey]);
  return { feedback, loading };
}

/** Feedback de la validación de IA del producto (solo si `enabled`, p. ej. en borrador). */
export function useAiFeedback(productId: string | undefined, enabled: boolean, refreshKey?: string) {
  return useAiFeedbackState(productId, enabled, refreshKey).feedback;
}
