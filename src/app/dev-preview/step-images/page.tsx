/**
 * @file page.tsx (dev-preview/step-images)
 * @description Página de solo-desarrollo para revisar visualmente el paso
 * "Imágenes" del formulario de producto — en concreto, el checklist de
 * estilo (`ImageStyleGuideline`) añadido junto al uploader (petición del
 * humano, 2026-10-17, guía de imágenes A.1).
 *
 * No enlazada desde ninguna navegación — fuera de `PROTECTED_PREFIXES` en
 * `middleware.ts` (solo protege `/dashboard` y `/onboarding`), así que no
 * requiere sesión. Acceso directo por URL (`/dev-preview/step-images`)
 * solo para QA de diseño.
 */

'use client';

import { useState } from 'react';
import { StepImages } from '@/app/dashboard/products/components/steps/StepImages';
import type { ProductImage } from '@/types/product';

export default function StepImagesPreviewPage() {
  const [gallery, setGallery] = useState<ProductImage[]>([]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-origen-oscuro mb-2">
        QA visual — StepImages (checklist de guía de imágenes)
      </h1>
      <p className="mb-6 text-sm text-text-subtle">
        Página de solo-desarrollo para revisar el checklist &quot;Antes de subir tu foto&quot;
        añadido junto al uploader de imágenes de producto.
      </p>
      <StepImages gallery={gallery} onImagesChange={setGallery} completed={gallery.length > 0} />
    </div>
  );
}
