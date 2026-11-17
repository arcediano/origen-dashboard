'use client';

import { useEffect, useState } from 'react';
import { getAiFeedback, type AiFeedback } from '@/lib/api/products';

/** Feedback de la validación de IA del producto (solo si `enabled`, p. ej. en borrador). */
export function useAiFeedback(productId: string | undefined, enabled: boolean, refreshKey?: string) {
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  useEffect(() => {
    if (!productId || !enabled) {
      setFeedback(null);
      return;
    }
    let active = true;
    getAiFeedback(productId).then((res) => {
      if (active) setFeedback(res.data ?? null);
    });
    return () => {
      active = false;
    };
  }, [productId, enabled, refreshKey]);
  return feedback;
}
