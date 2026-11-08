/**
 * @file page.tsx (dev-preview/profile-ai-review)
 * @description Página de solo-desarrollo para revisar visualmente
 * `ProfileAiReviewButton` ("Mejorar con IA" del perfil comercial, petición
 * del humano, 2026-11-08) tal y como aparece en la cabecera de la sección
 * "Historia y valores" de Mi negocio.
 *
 * No enlazada desde ninguna navegación — fuera de `PROTECTED_PREFIXES` en
 * `middleware.ts`, así que no requiere sesión. Acceso directo por URL.
 */

'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { ProfileAiReviewButton } from '@/app/dashboard/profile/components/ProfileAiReviewButton';
import type { ProfileReviewFields } from '@/lib/ai-assist/profile-review';

export default function ProfileAiReviewPreviewPage() {
  const [fields, setFields] = useState<ProfileReviewFields>({
    tagline: 'Miel de mi pueblo',
    description: 'Hacemos miel desde hace años en nuestra finca familiar.',
    productionPhilosophy: 'Cuidamos las colmenas sin prisa, respetando el ritmo de las abejas.',
    animalWelfare: '',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-origen-oscuro mb-6">
        QA visual — ProfileAiReviewButton
      </h1>

      <Card id="historia" className="scroll-mt-24">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-hoja-tinta" />
              Historia y valores
              <Badge variant="neutral" size="xs">Opcional</Badge>
            </CardTitle>
            <ProfileAiReviewButton
              fields={fields}
              onApply={(field, value) => setFields((prev) => ({ ...prev, [field]: value }))}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-origen-oscuro">Tagline</p>
            <p className="text-sm text-text-subtle">{fields.tagline}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-origen-oscuro">Descripcion</p>
            <p className="text-sm text-text-subtle">{fields.description}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-origen-oscuro">Filosofia de produccion</p>
            <p className="text-sm text-text-subtle">{fields.productionPhilosophy}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
