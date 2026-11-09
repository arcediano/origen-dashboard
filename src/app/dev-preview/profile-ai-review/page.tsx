/**
 * @file page.tsx (dev-preview/profile-ai-review)
 * @description Página de solo-desarrollo para revisar visualmente
 * `ProfileAiReviewButton` ("Mejorar con IA" del perfil comercial, petición
 * del humano, 2026-11-08, ampliado a fotos y hecho más prominente
 * 2026-11-09) tal y como aparece al principio de "Mi negocio" (banner) y,
 * debajo, el detalle de una galería con una foto candidata a mejorar.
 *
 * No enlazada desde ninguna navegación — fuera de `PROTECTED_PREFIXES` en
 * `middleware.ts`, así que no requiere sesión. Acceso directo por URL.
 */

'use client';

import { useState } from 'react';
import { ProfileAiReviewButton } from '@/app/dashboard/profile/components/ProfileAiReviewButton';
import type { ProfilePhotoCandidate, ProfilePhotoCollection, ProfileReviewFields } from '@/lib/ai-assist/profile-review';

const SAMPLE_PHOTOS: ProfilePhotoCandidate[] = [
  {
    collection: 'teamPhotos',
    itemId: 'team-1',
    key: 'producers/1/documents/team/a.jpg',
    url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600',
  },
  {
    collection: 'locationImages',
    itemId: 'location-1',
    key: 'producers/1/documents/location/a.jpg',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
  },
  {
    collection: 'galleryImages',
    itemId: 'gallery-1',
    key: 'producers/1/documents/gallery/a.jpg',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
  },
];

export default function ProfileAiReviewPreviewPage() {
  const [fields, setFields] = useState<ProfileReviewFields>({
    tagline: 'Miel de mi pueblo',
    description: 'Hacemos miel desde hace años en nuestra finca familiar.',
    productionPhilosophy: 'Cuidamos las colmenas sin prisa, respetando el ritmo de las abejas.',
    animalWelfare: '',
  });
  const [appliedPhotos, setAppliedPhotos] = useState<Record<ProfilePhotoCollection, string>>(
    {} as Record<ProfilePhotoCollection, string>,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-origen-oscuro">
        QA visual — ProfileAiReviewButton (texto + fotos)
      </h1>

      <ProfileAiReviewButton
        variant="banner"
        fields={fields}
        onApply={(field, value) => setFields((prev) => ({ ...prev, [field]: value }))}
        photos={SAMPLE_PHOTOS}
        onApplyPhoto={(collection, _itemId, file) =>
          setAppliedPhotos((prev) => ({ ...prev, [collection]: URL.createObjectURL(file) }))
        }
      />

      <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-alt p-4">
        <p className="text-sm font-medium text-origen-oscuro">Tagline</p>
        <p className="text-sm text-text-subtle">{fields.tagline}</p>
        <p className="text-sm font-medium text-origen-oscuro">Descripcion</p>
        <p className="text-sm text-text-subtle">{fields.description}</p>
        <p className="text-sm font-medium text-origen-oscuro">Filosofia de produccion</p>
        <p className="text-sm text-text-subtle">{fields.productionPhilosophy}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SAMPLE_PHOTOS.map((photo) => (
          <div key={photo.collection} className="space-y-1">
            <p className="text-xs font-medium text-text-subtle">{photo.collection}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appliedPhotos[photo.collection] ?? photo.url}
              alt={photo.collection}
              className="aspect-4/3 w-full rounded-lg object-cover"
            />
            {appliedPhotos[photo.collection] && <p className="text-[10px] text-feedback-success">Mejorada (pendiente)</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
        <p className="mb-2 text-sm font-medium text-origen-oscuro">Botón pequeño (variant=&quot;button&quot;)</p>
        <ProfileAiReviewButton
          fields={fields}
          onApply={(field, value) => setFields((prev) => ({ ...prev, [field]: value }))}
        />
      </div>
    </div>
  );
}
