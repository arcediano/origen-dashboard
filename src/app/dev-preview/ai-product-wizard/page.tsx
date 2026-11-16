/**
 * @file page.tsx (dev-preview/ai-product-wizard)
 * @description Página de solo-desarrollo para revisar visualmente el nuevo
 * paso de fotos de "Origen Assist" (petición del humano, 2026-11-14): una
 * única pantalla con una sección clara e independiente por cada imagen
 * (producto, tabla nutricional, ingredientes, conservación), en vez de un
 * chat o de las fotos repartidas en pasos distintos. Las preguntas de texto
 * siguen después, una vez subidas las fotos.
 *
 * No enlazada desde ninguna navegación — fuera de `PROTECTED_PREFIXES` en
 * `middleware.ts`, así que no requiere sesión. Acceso directo por URL
 * (`/dev-preview/ai-product-wizard`) solo para QA de diseño.
 */

'use client';

import { AiProductWizard } from '@/app/dashboard/products/components/ai-onboarding/AiProductWizard';

export default function AiProductWizardPreviewPage() {
  return (
    <div className="min-h-screen bg-surface-alt px-4 py-8 sm:px-6">
      <h1 className="mx-auto mb-2 max-w-3xl font-serif text-2xl font-bold text-origen-oscuro">
        QA visual — AiProductWizard (pantalla de fotos por secciones)
      </h1>
      <p className="mx-auto mb-6 max-w-3xl text-sm text-text-subtle">
        Pulsa &quot;Empezar&quot; para ver la pantalla de fotos: cada imagen (producto, tabla nutricional, ingredientes,
        conservación) tiene su propia sección, visible toda a la vez. Las preguntas de texto llegan después.
      </p>
      <AiProductWizard quota={{ used: 1, total: 5 }} onManual={() => alert('Prefiero hacerlo a mano')} />
    </div>
  );
}
