/**
 * @page DisputasPage
 * @description Bandeja de disputas del productor: lista (tabla en escritorio, lista simple en
 * móvil) y, con `?id=`, el detalle de una disputa con su conversación completa.
 */

'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { DisputesInbox } from '@/components/orders/DisputesInbox';

function DisputasContent() {
  const router = useRouter();
  const id = useSearchParams().get('id');
  return (
    <div className="pb-6">
      <PageHeader
        title="Disputas"
        description="Sigue las disputas de tus pedidos y responde en la conversación con el comprador y el equipo de Origen"
        badgeIcon={Scale}
        badgeText="Disputas"
      />
      <DisputesInbox
        initialId={id}
        onSelectChange={(next) => router.push(next ? `/dashboard/disputas?id=${encodeURIComponent(next)}` : '/dashboard/disputas')}
      />
    </div>
  );
}

export default function DisputasPage() {
  return (
    <Suspense fallback={null}>
      <DisputasContent />
    </Suspense>
  );
}
