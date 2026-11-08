/**
 * @file page.tsx (dev-preview/profile-image-manager)
 * @description Página de solo-desarrollo para reproducir y validar visualmente
 * el bug reportado por el humano (2026-11-08, captura de "Mi negocio" móvil):
 * imágenes que no se visualizan (icono de imagen rota) y los botones de
 * acción de cada foto repartidos en dos líneas en vez de una.
 *
 * No enlazada desde ninguna navegación — fuera de `PROTECTED_PREFIXES` en
 * `middleware.ts`, así que no requiere sesión. Acceso directo por URL.
 */

'use client';

import { useState } from 'react';
import { ProfileImageManager } from '@/app/dashboard/profile/components/ProfileImageManager';
import type { ProfileImageItem } from '@/lib/profile/image-list';

const BROKEN_ITEMS: ProfileImageItem[] = [
  { id: 'broken-1', key: 'k1', url: 'https://images.unsplash.com/foto-que-no-existe-404-1.jpg' },
  { id: 'broken-2', key: 'k2', url: 'https://images.unsplash.com/foto-que-no-existe-404-2.jpg' },
  { id: 'broken-3', key: 'k3', url: 'https://images.unsplash.com/foto-que-no-existe-404-3.jpg' },
];

export default function ProfileImageManagerPreviewPage() {
  const [items, setItems] = useState<ProfileImageItem[]>(BROKEN_ITEMS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-origen-oscuro mb-2">
        QA visual — ProfileImageManager (imágenes rotas + layout de botones)
      </h1>
      <ProfileImageManager
        id="qa"
        items={items}
        onChange={setItems}
        max={3}
        editable
        altPrefix="Equipo, foto"
        emptyLabel="Aún no has añadido fotos."
      />
    </div>
  );
}
