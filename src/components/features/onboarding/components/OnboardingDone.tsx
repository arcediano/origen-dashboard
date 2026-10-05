'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert, Button, Card, CardIconHeader } from '@arcediano/ux-library';
import { buildPublishChecklist, isPendingReview } from '@/lib/onboarding/publish-checklist';
import type { ProducerReadinessReport } from '@/lib/api/onboarding';
import { ArrowRight, BookOpen, CheckCircle2, PackagePlus, PartyPopper, Rocket } from 'lucide-react';

interface OnboardingDoneProps {
  /** `undefined` = cargando; `null` = no disponible. */
  readiness: ProducerReadinessReport | null | undefined;
  businessName?: string;
  /** El productor ya conectó Stripe en el paso 5: no se le vuelve a pedir aunque readiness vaya con retraso. */
  stripeConnected?: boolean;
}

/**
 * Pantalla final: qué falta para publicar la tienda (con enlace directo a cada
 * cosa) y accesos a los siguientes pasos útiles.
 */
export function OnboardingDone({ readiness, businessName, stripeConnected }: OnboardingDoneProps) {
  const loading = readiness === undefined;
  const blockers = readiness?.blockers ?? [];
  const checklist = buildPublishChecklist(blockers).filter(
    (item) => !(stripeConnected && item.code === 'STRIPE_NOT_CONNECTED'),
  );
  const pendingReview = isPendingReview(blockers);
  const allDone = readiness != null && checklist.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4" data-testid="onboarding-done">
      <div className="rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-5 text-center shadow-sm sm:p-8">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-origen-pradera/15 text-hoja-tinta">
          <PartyPopper className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-h2 font-bold text-origen-bosque">
          {businessName ? `¡Bien hecho, ${businessName}!` : '¡Bien hecho!'}
        </h1>
        <p className="mt-2 text-sm text-text-subtle sm:text-base">
          Has terminado la configuración inicial. {allDone ? 'Tu tienda cumple todos los requisitos.' : 'Esto es lo que queda para que tu tienda sea visible.'}
        </p>
      </div>

      <Card variant="section" padding="md" className="rounded-2xl">
        <CardIconHeader
          icon={<Rocket className="h-5 w-5" />}
          title="Qué falta para publicar"
          description="Cada punto te lleva directo a resolverlo."
        />
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Comprobando requisitos">
            <div className="h-12 animate-pulse rounded-xl bg-origen-pastel/60" />
            <div className="h-12 animate-pulse rounded-xl bg-origen-pastel/60" />
          </div>
        ) : readiness === null ? (
          <Alert variant="info">
            No hemos podido comprobar los requisitos ahora mismo. Revísalos en tu panel.
          </Alert>
        ) : checklist.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-feedback-success-subtle p-3 text-sm text-feedback-success-text">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> No te falta nada por tu parte.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {checklist.map((item) => (
              <li key={item.code} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-origen-oscuro">{item.text}</span>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={item.href}>
                    {item.cta}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
        {pendingReview && (
          <Alert variant="info" className="mt-3">
            Nuestro equipo está revisando tu documentación (24-48 h laborables). Te avisaremos cuando esté verificada.
          </Alert>
        )}
      </Card>

      <Card variant="section" padding="md" className="rounded-2xl">
        <CardIconHeader icon={<PackagePlus className="h-5 w-5" />} title="Siguientes pasos" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button asChild variant="primary" className="w-full">
            <Link href="/dashboard/products/create">
              <PackagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Crear mi primer producto
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/profile/business#historia">
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Completar mi perfil
            </Link>
          </Button>
        </div>
        <div className="mt-3 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Ir a mi panel</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default OnboardingDone;
