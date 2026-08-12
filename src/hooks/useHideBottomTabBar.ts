'use client';

import { useEffect, useState } from 'react';

const EVENT = 'page-action-bar:toggle';

// Fuente de verdad síncrona a nivel de módulo. Los consumidores (BottomTabBar,
// dashboard/layout.tsx) viven en el layout persistente y pueden llevar
// montados desde antes de que la página actual exista -- pero en carga
// directa/recarga de una ruta que llama a useHideBottomTabBar(), su efecto
// (nesteado más profundo en el árbol) se ejecuta ANTES que el efecto del
// layout/BottomTabBar que registra el listener (React dispara los efectos de
// los hijos antes que los del padre/hermanos posteriores). El CustomEvent se
// despacha al vacío y se pierde para siempre -- BottomTabBar se queda
// mostrándose y se solapa con la ActionBar propia de la página. Guardar el
// estado aquí permite que un consumidor que se suscribe DESPUÉS del dispatch
// se ponga al día leyendo el valor actual, en vez de depender solo de
// eventos futuros.
let sharedActionBarOpen = false;

function setSharedActionBarOpen(open: boolean) {
  sharedActionBarOpen = open;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { open } }));
  }
}

/**
 * Hides the global BottomTabBar while the component that calls this hook is mounted.
 * Uses the same CustomEvent bus pattern as FilterBottomSheet.
 *
 * Usage: call this hook in any page/component that renders its own contextual action bar
 * on mobile, so the global nav doesn't overlap.
 */
export function useHideBottomTabBar() {
  useEffect(() => {
    setSharedActionBarOpen(true);
    return () => setSharedActionBarOpen(false);
  }, []);
}

/**
 * Lado consumidor de useHideBottomTabBar() -- usado por BottomTabBar y por
 * dashboard/layout.tsx para saber si deben ceder el sitio a la ActionBar
 * contextual de la página actual. Se sincroniza con el valor compartido
 * inmediatamente al suscribirse (no solo a partir de eventos futuros), para
 * no perderse un dispatch que ya haya ocurrido antes de montarse.
 */
export function useActionBarOpen(): boolean {
  const [open, setOpen] = useState(sharedActionBarOpen);

  useEffect(() => {
    setOpen(sharedActionBarOpen);

    const handler = (e: Event) => setOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return open;
}
