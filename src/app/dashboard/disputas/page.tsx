/**
 * @page DisputasPage
 * @description Bandeja de disputas del productor: lista y conversación completa.
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Scale } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { DisputesInbox } from '@/components/orders/DisputesInbox';

function DisputasContent() {
  const id = useSearchParams().get('id');
  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Disputas"
        description="Sigue las disputas de tus pedidos y responde en la conversación con el comprador y el equipo de Origen"
        badgeIcon={Scale}
        badgeText="Disputas"
      />
      <div className="px-4 sm:px-6 lg:px-8">
        <DisputesInbox initialId={id} />
      </div>
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
