/**
 * MaintenanceScreen — pantalla completa de modo mantenimiento
 *
 * Sin navegación ni enlaces a la app: el gateway responde 503 a todo lo demás.
 * Sigue guia-diseno-ux.md: fondo crema (bg-background), card blanca
 * (bg-surface-alt + border-border-subtle + shadow-subtle, radio de hero
 * rounded-[28px]), icono sobre círculo pradera/10 con texto hoja-tinta,
 * eyebrow uppercase y Button primary de @arcediano/ux-library.
 */

'use client';

import { RefreshCw, Wrench } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/lib/maintenance';

export interface MaintenanceScreenProps {
  /** Mensaje del administrador (`maintenanceMessage`). Vacío → texto por defecto. */
  message?: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  const text = message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 sm:px-6"
      aria-labelledby="maintenance-title"
    >
      {/* Robots: la pantalla no debe indexarse (React 19 lo eleva a <head>) */}
      <meta name="robots" content="noindex, nofollow" />

      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-alt p-6 text-center shadow-subtle sm:rounded-[28px] sm:p-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/origen-icon.svg" alt="" width={36} height={36} className="h-9 w-9" />
          <div className="flex flex-col text-left leading-none">
            <span className="text-base font-bold tracking-tight text-origen-bosque">Origen.</span>
            <span className="-mt-0.5 text-[10px] text-hoja-tinta">Productores locales</span>
          </div>
        </div>

        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-origen-pradera/10"
          aria-hidden="true"
        >
          <Wrench className="h-6 w-6 text-hoja-tinta" />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Modo mantenimiento
        </p>
        <h1
          id="maintenance-title"
          className="text-[22px] font-bold text-origen-bosque sm:text-[26px] lg:text-[32px]"
        >
          Volvemos enseguida
        </h1>
        <p
          role="status"
          className="mt-3 whitespace-pre-line break-words text-sm text-text-subtle sm:text-base"
        >
          {text}
        </p>

        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    </main>
  );
}
