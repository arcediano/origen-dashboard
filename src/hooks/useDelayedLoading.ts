'use client';

import { useState, useEffect } from 'react';

/**
 * Retrasa la activación del indicador de carga.
 *
 * Si los datos llegan antes del umbral (ms), el skeleton/spinner nunca se muestra
 * y el usuario no percibe ningún parpadeo. Solo muestra el indicador cuando la
 * carga tarda más de lo esperado.
 *
 * @param isLoading  Estado de carga real
 * @param delay      Milisegundos antes de mostrar el indicador (default: 200)
 */
export function useDelayedLoading(isLoading: boolean, delay = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return showLoading;
}
